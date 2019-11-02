"""
python tests.py
"""
import io
import ray
import yaml
import numpy as np
import gym
import math
import random
import argparse
import colored_traceback
from random import choice
from pprint import pprint
from gym.spaces import Discrete, Box
from gym.envs.registration import EnvSpec
from gym.envs.registration import registry
from ray import tune
from ray.tune.schedulers import PopulationBasedTraining
from ray.tune import run_experiments
from ray.tune.registry import register_env
from ray.rllib.models import ModelCatalog
from ray.rllib.models.preprocessors import get_preprocessor
from learning.mink import MinkModel
from environment.core.utils.math import normalize_angle
from environment.sensor import SensorEnvironment # Env type
from environment.multi import MultiEnvironment # Env type
colored_traceback.add_hook()

ENVIRONMENT = "MultiRobot-v0"

DEFAULTS = {
    'headless': False,
    'reset_on_target': True,
    'building_id': '5d984a7c6f1886dacf9c730d'
}


def setup():
    ModelCatalog.register_custom_model("mink", MinkModel)
    register_env(ENVIRONMENT, lambda cfg: train_env_creator(cfg))


def create_parser():
    parser = argparse.ArgumentParser(
        description='Process some integers.')
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
    return parser



def train_env_factory(args):
    """
    Create an environment that is linked to the communication platform
    @env_config: Environment configuration from config file
    @args: Command line arguments for overriding defaults
    """
    def train_env(cfg={}):
        config = DEFAULTS.copy()
        config.update(cfg)
        if args.headless:
            config["headless"] = True
        elif args.render:
            config["headless"] = False
        return MultiEnvironment(config=config, environment_cls=SensorEnvironment)

    return train_env




def test_preprocessor(env):
	Preprocessor = get_preprocessor(env.observation_space)
	preprocessor = Preprocessor(env.observation_space)
	action = {i:[0.2, -0.5] for i in range(len(env.default_env.base.robots))}
	obs, reward, done, _ = env.step(action)
	out = preprocessor.transform(obs[0])
	print(len(out))


def test_random_actions(env):
    def act():
        steer = 1-2*random.random()
        throttle = 1-2*random.random()
        return [steer, throttle]

    for i in range(100):
        action = {i:act() for i in range(len(env.default_env.base.robots))}
        obs, reward, done, _ = env.step(action)
        print("REWARD:", reward)
        print("DONE:", done)


def test_follow_checkpoint(env):
    def act(obs=None):
        checkpoint = obs['ckpts'][0:2]
        print(checkpoint)
        steer = -0.1*checkpoint[0]
        throttle = 0
        return [steer, throttle]

    obs = env.reset()
    for i in range(1000):
        action = {i:act(obs[i]) for i in range(len(env.robots))}
        obs, reward, done, _ = env.step(action)
        print("REWARD:", reward)
        print("DONE:", done)


def test_rotate_robot(env):
    """
    Rotate robot to [0, pi/2, pi, 3/2pi] in that order
    """
    def act(obs, target_rotation):
        theta = obs['robot_theta']
        print("Robot theta:", theta[1])
        delta = normalize_angle(target_rotation-theta[1])
        steer = 0.1*(delta)
        return [steer, 0]

    obs = env.reset()
    for target_rotation in [0, 0.5, 1, 1.5, 2]:
        print("Rotating to %.2f pi"%target_rotation)
        for i in range(60):
            t = math.pi*target_rotation
            action = {i:act(obs[i],t) for i in range(len(env.robots))}
            obs, reward, done, _ = env.step(action)


def test_rotate_target(env):
    def act(obs):
        target = obs['target']
        print("Target bearing:", target[0])
        steer = 0.1*target[0]
        return [steer, 0]

    for i in range(10):
        obs = env.reset()
        for i in range(100):
            action = {i:act(obs[i]) for i in range(len(env.robots))}
            obs, reward, done, _ = env.step(action)


def test_rotate_checkpoint(env):
    def act(obs):
        theta, dist = obs['ckpts'][0,:].tolist()
        print("Checkpoint bearing:", theta)
        steer = 0.1*theta
        return [steer, 0]

    for i in range(10):
        obs = env.reset()
        for i in range(100):
            action = {i:act(obs[i]) for i in range(len(env.robots))}
            obs, reward, done, _ = env.step(action)


def test_collect_checkpoints(env):
    for i in range(10):
        obs = env.reset()
        for i in range(100):
            action = {i:checkpoint_policy(obs[i]) for i in range(len(env.robots))}
            obs, reward, done, _ = env.step(action)


def test_collect_target(env):
    obs = env.reset()
    for i in range(100):
        action = {i:target_policy(obs[i]) for i in range(len(env.robots))}
        obs, reward, done, _ = env.step(action)


def test_policy(env, policy):
    for i in range(10):
        obs = env.reset()
        done = {i:False for i in obs}
        done['__all__'] = False
        total_reward = 0
        total_steps = 0
        for i in range(100):
            action = {i:policy(obs[i]) for i in done if i!='__all__' and not done[i]}
            obs, reward, done, _ = env.step(action)
            total_steps += 1
            total_reward += np.sum(list(reward.values()))
            if done['__all__']:
                break
        print("Total reward: %.3f in %i steps"%(total_reward, total_steps))



def checkpoint_policy(obs):
    """
    Collect checkpoints if they are close
    """
    theta, dist = obs['ckpts'][0,:]
    steer = 0.2*theta
    throttle = 0
    if abs(theta) < math.pi/4:
        throttle = 0.5 - 0.5*abs(theta/math.pi)
    return [steer, throttle]


def target_policy(obs):
    """
    Collect checkpoints if they are close
    """
    theta, dist = obs['target']
    steer = 0.1*theta
    throttle = 0
    if abs(theta) < 0.2:
        throttle = 0.2
    return [steer, throttle]


def simple_policy(obs):
    """
    Collect checkpoints if they are close
    """
    _, ckpt_dist = obs['ckpts'][0,:]
    if ckpt_dist>4:
        return target_policy(obs)
    else:
        return checkpoint_policy(obs)


def safe_policy(obs):
    """
    Collect checkpoints if they are close
    Stop whenever near another object
    """
    scale = 5
    points = obs['pointcloud']
    steer, throttle = simple_policy(obs)
    if np.min(points)<0.5:
        return [steer/scale, throttle/scale]
    return [steer, throttle]



def noisey_policy(obs):
    """
    Collect checkpoints if they are close
    """
    exploration_noise_sigma = 0.3
    policy = np.array(simple_policy(obs))
    noise = np.random.normal(0, exploration_noise_sigma, 2)
    return tuple(policy+noise)



if __name__=="__main__":
    setup()
    parser = create_parser()
    args = parser.parse_args()
    env = train_env_factory(args)()
    #test_preprocessor(env)
    #test_random_actions(env)
    #test_follow_checkpoint(env)
    #test_rotate_robot(env)
    #test_rotate_checkpoint(env)
    #test_collect_checkpoints(env)
    #test_collect_target(env)
    #test_policy(env, simple_policy)
    #test_policy(env, safe_policy)
    test_policy(env, noisey_policy)
    #test_noisey_policy(env)
