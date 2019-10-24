"""
Simple, single agent gym environment
"""
import gym
import yaml
from .base import BaseEnvironment
from .single import SingleEnvironment
from ..loaders.geometry import GeometryLoader



class SimpleEnvironment(SingleEnvironment, gym.Env):
    """
    Create an environment that is linked to the communication platform
    @env_config: Environment configuration from config file
    @args: Command line arguments for overriding defaults
    """

    def __init__(self):
        with open('environment/configs/prod.yaml') as cfg:
            api_config = yaml.load(cfg, Loader=yaml.Loader)
            api_config['building_id'] = '5d984a7c6f1886dacf9c730d'

        loader = GeometryLoader(api_config) # Handles HTTP
        self.base_env = BaseEnvironment(loader, headless=False)
        robot = self.base_env.robots[0]
        super().__init__(self.base_env, robot=robot)


    def step(self, actions):
        """
        Step the simulation forward one timestep
        """
        self.act(actions)
        self.base_env.step()
        obs, rew, done, info = self.observe()
        return obs, rew, done, info