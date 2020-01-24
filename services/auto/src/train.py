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
from environment.core.utils.config import extend_config
from common import train_env_factory


with open("scenarios/scenarios.yaml") as stream:
    scenarios = yaml.safe_load(stream)


# Choose a scenario to rollout
SCENARIO = scenarios["bottleneck"]


SCENARIO.update({
    'headless': True,
})


# Only show errors and warnings
logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.WARN)


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



def config_from_args(args):
    """
    Extract experiment args from the command line args
    These can be used to overrided the args in a yaml file
    """
    config = {}
    if args.workers:
        config["num_workers"] = args.workers
    if args.headless:
        config["env_config"] = dict(headless=True)
    if args.render:
        config["env_config"] = dict(headless=False)
    return config


def get_callbacks():
    return {
        "callbacks": {
            "on_episode_start": on_episode_start,
            "on_episode_step": on_episode_step,
            "on_episode_end": on_episode_end,
        }
    }


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
    """
    Run a single trial
    """
    with open(args.config, 'r') as stream:
        experiments = yaml.load(stream, Loader=yaml.Loader)

    for experiment_name, settings in experiments.items():
        print("Running %s"%experiment_name)
        config = settings['config']
        config = extend_config(config, get_callbacks())
        config = extend_config(config, dict(env_config=SCENARIO))
        config = extend_config(config, config_from_args(args))

        ray.tune.run(
            settings['run'],
            name=experiment_name,
            stop=settings['stop'],
            config=config,
            restore=SCENARIO["checkpoint"],
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
    """
    Run population based training
    """
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

    with open(args.config, 'r') as stream:
        experiments = yaml.load(stream, Loader=yaml.Loader)

    for experiment_name, settings in experiments.items():
        print("Running %s"%experiment_name)
        config = settings['config']
        config.update({
            "learning_starts": sample_from(
                lambda spec: random.choice([10000, 20000])),
            "target_network_update_freq": sample_from(
                lambda spec: random.choice([0, 10, 100])),
            "buffer_size": sample_from(
                lambda spec: int(random.choice([1e6, 2e6, 4e6, 8e6]))),
            "sample_batch_size": sample_from(
                lambda spec: int(random.choice([1,4,8]))),
            "train_batch_size": sample_from(
                lambda spec: int(random.choice([128,256,512]))),
        })
        # Hard overrides from this file and the commandline
        config = extend_config(config, get_callbacks())
        config = extend_config(config, dict(env_config=SCENARIO))
        config = extend_config(config, config_from_args(args))

        ray.tune.run(
            settings['run'],
            name=experiment_name,
            scheduler=pbt_scheduler,
            restore=SCENARIO["checkpoint"],
            config=config,
            checkpoint_freq=20,
            max_failures=5,
            num_samples=6
        )


def run_trials(args):
    """
    Run a series of trials with different hyperparameters
    """
    with open(args.config, 'r') as stream:
        experiments = yaml.load(stream, Loader=yaml.Loader)

    for experiment_name, settings in experiments.items():
        print("Running %s"%experiment_name)
        config = settings['config']
        config.update({
            "target_network_update_freq": sample_from(
                lambda spec: random.choice([0, 1, 2])),
            "buffer_size": sample_from(
                lambda spec: int(random.choice([2e6, 4e6, 8e6]))),
            "train_batch_size": sample_from(
                lambda spec: int(random.choice([256, 512]))),
        })
        # Hard overrides from this file and the commandline
        config = extend_config(config, get_callbacks())
        config = extend_config(config, dict(env_config=SCENARIO))
        config = extend_config(config, config_from_args(args))

        ray.tune.run(
            settings['run'],
            name=experiment_name,
            config=settings['config'],
            restore=SCENARIO["checkpoint"],
            checkpoint_freq=20,
            max_failures=4,
            num_samples=4
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

