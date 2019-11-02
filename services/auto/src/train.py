"""
Train an agent on SeekerSimEnv

# For a lightweight test
python train.py configs/seeker-sac-test.yaml --dev


# For a development td3 test
python train.py configs/seeker-td3.yaml --headless

# For a GPU driven large test
python train.py configs/seeker-apex-td3.yaml
python train.py configs/simple/simple-td3.yaml --headless

# Population based training
python train.py configs/seeker-apex-pbt.yaml --pbt
"""
import io
import ray
import yaml
import numpy as np
import gym
import math
import random
import logging
import argparse
import tensorflow as tf
import colored_traceback
from random import choice
from pprint import pprint
from gym.spaces import Discrete, Box
from gym.envs.registration import EnvSpec
from gym.envs.registration import registry
from ray import tune
from ray.tune import run, sample_from, run_experiments
from ray.tune.schedulers import PopulationBasedTraining
from ray.tune.registry import register_env
from ray.rllib.models import ModelCatalog
from learning.robot import RobotModel
from learning.apex import ApexSACTrainer
from learning.sensor import SensorModel
from learning.preprocessing import DictFlatteningPreprocessor
from environment.sensor import SensorEnvironment # Env type
from environment.multi import MultiEnvironment # Env type
colored_traceback.add_hook()


ENVIRONMENT = "MultiRobot-v0"

DEFAULTS = {
    'headless': True,
    'building_id': '5d984a7c6f1886dacf9c730d'
}


# Only show errors and warnings
logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.WARN)


def train_env_factory(args):
    """
    Create an environment that is linked to the communication platform
    @env_config: Environment configuration from config file
    @args: Command line arguments for overriding defaults
    """
    def train_env(cfg):
        config = DEFAULTS.copy()
        config.update(cfg)
        if args.headless:
            config["headless"] = True
        elif args.render:
            config["headless"] = False
        return MultiEnvironment(config=config, environment_cls=SensorEnvironment)

    return train_env



def create_parser():
    parser = argparse.ArgumentParser(
        description='Process some integers.')
    parser.add_argument(
        "config",
        default="configs/seeker-test.yaml",
        type=str,
        help="The configuration file to use for the RL agent.")
    parser.add_argument(
        "--pbt",
        default=False,
        action="store_true",
        help="Run population based training.")
    parser.add_argument(
        "--trials",
        default=False,
        action="store_true",
        help="Run trials.")
    parser.add_argument(
        "--dev",
        action="store_true",
        help="Use development cluster with local redis server")
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Hide any GUI windows")
    parser.add_argument(
        "--render",
        action="store_true",
        help="Show GUI windows")
    parser.add_argument(
        "--workers",
        type=int,
        required=False,
        help="Number of workers per trial")
    return parser



def on_episode_start(info):
    episode = info["episode"]
    episode.user_data["actions"] = []


def on_episode_step(info):
    episode = info["episode"]
    episode.user_data["actions"].append(episode.prev_action_for(0))
    episode.user_data["actions"].append(episode.prev_action_for(1))

def on_episode_end(info):
    episode = info["episode"]
    actions = episode.user_data["actions"]
    throttle = [a[1] for a in actions]
    rotation = [a[0] for a in actions]
    episode.custom_metrics["rotation"] = np.mean(rotation)
    episode.custom_metrics["throttle"] = np.mean(throttle)



def run(args):
    ModelCatalog.register_custom_model("robot", RobotModel)
    ModelCatalog.register_custom_model("sensor", SensorModel)
    register_env(ENVIRONMENT, train_env_factory(args))

    with open(args.config, 'r') as stream:
        experiments = yaml.load(stream, Loader=yaml.Loader)

    for experiment_name, settings in experiments.items():
        print("Running %s"%experiment_name)
        settings["config"].update({
            "callbacks": {
                "on_episode_start": on_episode_start,
                "on_episode_step": on_episode_step,
                "on_episode_end": on_episode_end,
            }
        })
        
        if args.workers is not None:
            settings['config']['num_workers'] = args.workers
        
        ray.tune.run(
            #settings['run'],
            ApexSACTrainer,
            name=experiment_name,
            stop=settings['stop'],
            config=settings['config'],
            checkpoint_freq=settings['checkpoint_freq'],
            queue_trials=True,
        )

def log_uniform(max, min):
    """
    log_uniform(1e-2, 1e-5)
    """
    min_exp = math.log10(min)
    max_exp = math.log10(max)
    exp = random.uniform(min_exp, max_exp)
    return 10**exp



def run_pbt(args):
    ModelCatalog.register_custom_model("robot", RobotModel)
    ModelCatalog.register_custom_model("sensor", SensorModel)
    register_env(ENVIRONMENT, train_env_factory(args))

    pbt_scheduler = PopulationBasedTraining(
        time_attr='time_total_s',
        metric="episode_reward_mean",
        mode="max",
        perturbation_interval=600.0,
        hyperparam_mutations={
            "tau": lambda: random.uniform(0.001, 0.005),
            "optimization": {
                "actor_learning_rate": log_uniform(1e-3, 1e-5),
                "critic_learning_rate": log_uniform(1e-3, 1e-5),
                "entropy_learning_rate": log_uniform(1e-3, 1e-5),
            }
        })          

    # Prepare the default settings
    with open(args.config, 'r') as stream:
        experiments = yaml.load(stream, Loader=yaml.Loader)

    for experiment_name, settings in experiments.items():
        print("Running %s"%experiment_name)
        settings['config'].update({
            "learning_starts": sample_from(
                lambda spec: random.choice([1000, 10000, 20000])),
            "target_network_update_freq": sample_from(
                lambda spec: random.choice([0, 10, 100])),
            "buffer_size": sample_from(
                lambda spec: int(random.choice([1e6, 2e6, 4e6, 8e6]))),
            "sample_batch_size": sample_from(
                lambda spec: int(random.choice([1,4,8]))),
            "train_batch_size": sample_from(
                lambda spec: int(random.choice([128,256,512]))),
            "callbacks": {
                "on_episode_start": on_episode_start,
                "on_episode_step": on_episode_step,
                "on_episode_end": on_episode_end,
            }
        })

        if args.workers is not None:
            settings['config']['num_workers'] = args.workers

        ray.tune.run(
            settings['run'],
            name=experiment_name,
            scheduler=pbt_scheduler,
            config=settings['config'],
            checkpoint_freq=20,
            max_failures=5,
            num_samples=6
        )


def run_trials(args):
    ModelCatalog.register_custom_model("robot", RobotModel)
    ModelCatalog.register_custom_model("sensor", SensorModel)
    register_env(ENVIRONMENT, train_env_factory(args))

    # Prepare the default settings
    with open(args.config, 'r') as stream:
        experiments = yaml.load(stream, Loader=yaml.Loader)

    for experiment_name, settings in experiments.items():
        print("Running %s"%experiment_name)
        settings['config'].update({
            "target_network_update_freq": sample_from(
                lambda spec: random.choice([0, 1, 2])),
            "buffer_size": sample_from(
                lambda spec: int(random.choice([1e6, 2e6, 4e6, 8e6]))),
            "sample_batch_size": sample_from(
                lambda spec: int(random.choice([1,2,4]))),
            "train_batch_size": sample_from(
                lambda spec: int(random.choice([128,256,512]))),
            "no_done_at_end": sample_from(
                lambda spec: random.choice([True, False])),
            "callbacks": {
                "on_episode_start": on_episode_start,
                "on_episode_step": on_episode_step,
                "on_episode_end": on_episode_end,
            }
        })

        if args.workers is not None:
            settings['config']['num_workers'] = args.workers

        ray.tune.run(
            settings['run'],
            name=experiment_name,
            config=settings['config'],
            checkpoint_freq=20,
            max_failures=4,
            num_samples=6
        )



if __name__ == "__main__":
    parser = create_parser()
    args = parser.parse_args()
    if args.dev:
        ray.init()
    else:
        ray.init("localhost:6379")
    if args.pbt:
        run_pbt(args)
    if args.trials:
        run_trials(args)
    else:
        run(args)

