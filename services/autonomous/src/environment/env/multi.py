import os
import gym
import math
import random
import numpy as np
from .single import SingleEnvironment
from .base import BaseEnvironment
from ray.rllib.env.multi_agent_env import MultiAgentEnv
from PIL import Image, ImageDraw, ImageColor



class MultiEnvironment(MultiAgentEnv):

    def __init__(self, base_env, verbosity=1, env_config={}):
        self.dones = set()
        self.base_env = base_env
        self.env = {}
        for i,robot in enumerate(self.base_env.robots):
            self.env[i] = SingleEnvironment(base_env, robot=robot, verbosity=verbosity)

        self.default_env = self.env[0]
        self.action_space = self.default_env.action_space
        self.observation_space = self.default_env.observation_space


    def step(self, actions):
        """
        Step the simulation forward one timestep
        """
        for key, action in actions.items():
            self.env[key].act(action)

        self.default_env.base.step()
        is_crashed = any(e.is_crashed() for e in self.env.values())
        is_target = any(e.is_at_target() for e in self.env.values())

        obs, rew, done, info = {}, {}, {}, {}
        for i in actions.keys():
            obs[i], rew[i], done[i], info[i] = self.env[i].observe()
            if done[i]:
                self.dones.add(i)

        # Rllib requires a dones[__all__] key
        done["__all__"] = len(self.dones) == len(self.env)

        return obs, rew, done, info


    def reset(self):
        """
        Reset the base environment
        """
        self.dones = set()
        return {key:env.reset() for key,env in self.env.items()}


    def render(self, *arg, **kwargs):
        return self.default_env.render(*arg, **kwargs)


    def render_map(self, *arg, **kwargs):
        return self.default_env.render_map(*arg, **kwargs)