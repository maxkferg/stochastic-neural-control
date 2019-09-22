"""
python tests.py
"""
import io
import ray
import yaml
import numpy as np
import gym
import argparse
import learning.model
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
from learning.fusion import FusionModel
from environment.loaders.geometry import GeometryLoader
from environment.env.base import BaseEnvironment # Env type
from environment.env.multi import MultiEnvironment # Env type
colored_traceback.add_hook()


# Register Model
ModelCatalog.register_custom_model("fusion_model", FusionModel)


def train_env_creator():
    """
    Create an environment that is linked to the communication platform
    """
    with open('environment/configs/test.yaml') as cfg:
    	api_config = yaml.load(cfg, Loader=yaml.Loader)

    cfg = {
        "debug": True,
        "monitor": True,
        "headless": True,
        "reset_on_target": True
    }
    loader = GeometryLoader(api_config) # Handles HTTP
    base = BaseEnvironment(loader, headless=cfg["headless"])
    return MultiEnvironment(base, cfg)



def test_preprocessor(env):
	Preprocessor = get_preprocessor(env.observation_space)
	preprocessor = Preprocessor(env.observation_space)
	action = {i:[0.2, -0.5] for i in range(len(env.default_env.base.robots))}
	obs, reward, done, _ = env.step(action)
	out = preprocessor.transform(obs[0])
	print(len(out))


if __name__=="__main__":
	env = train_env_creator()
	test_preprocessor(env)
