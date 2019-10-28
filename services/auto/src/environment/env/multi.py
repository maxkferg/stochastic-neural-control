import os
import gym
import time
import math
import random
import numpy as np
from .single import SingleEnvironment
from .base import BaseEnvironment
from ray.rllib.env.multi_agent_env import MultiAgentEnv
from PIL import Image, ImageDraw, ImageColor


DEFAULTS = {
    'creation_delay': 1,
    'verbosity': 0,
}


class MultiEnvironment(MultiAgentEnv):
    noop_action = (0,0)

    def __init__(self, base_env, config={}):
        config = dict(DEFAULTS, **config)
        self.dones = set()
        self.base_env = base_env
        self.robots = base_env.robots
        self.verbosity = config['verbosity']
        self.creation_delay = config['creation_delay']
        self.env = {}

        delay = self.creation_delay*random.random()
        print("Waiting for %.3f seconds before creating this env"%delay)
        time.sleep(delay)

        for i,robot in enumerate(self.robots):
            self.env[i] = SingleEnvironment(base_env, robot=robot, config=config)

        self.default_env = self.env[0]
        self.action_space = self.default_env.action_space
        self.observation_space = self.default_env.observation_space


    def step(self, actions):
        """
        Step the simulation forward one timestep
        """
        for i,env in self.env.items():
            if i in actions:
                env.act(actions[i])
            else:
                env.act(self.noop_action)
            
        self.default_env.step()

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