"""
Simple, single agent gym environment
"""
import gym
import yaml
import numpy as np
from .base import BaseEnvironment
from .single import SingleEnvironment
from ..loaders.geometry import GeometryLoader



class SimpleEnvironment(SingleEnvironment, gym.Env):
    """
    Create an environment that is linked to the communication platform
    @env_config: Environment configuration from config file
    @args: Command line arguments for overriding defaults
    """

    def __init__(self, config={}):
        with open('environment/configs/prod.yaml') as cfg:
            api_config = yaml.load(cfg, Loader=yaml.Loader)
            api_config['building_id'] = '5d984a7c6f1886dacf9c730d'

        loader = GeometryLoader(api_config) # Handles HTTP
        headless = config["headless"]
        base_env = BaseEnvironment(loader, headless=headless)
        robot = base_env.robots[0]
        self.nsteps = 0
        self.action_norm = 0
        self.last_action = None
        super().__init__(base_env, robot=robot, config=config)
        
    def reset(self):
        if self.nsteps > 1000:
            print("Action Norm:", self.action_norm/self.nsteps, self.last_action)
            self.action_norm = 0
            self.nsteps = 0
        return super().reset()

    def step(self, actions):
        """
        Step the simulation forward one timestep
        """
        self.act(actions)
        self.base.step()
        self.nsteps += 1
        self.action_norm += np.mean(np.abs(actions))
        self.last_action = actions
        obs, rew, done, info = self.observe()
        return obs, rew, done, info
