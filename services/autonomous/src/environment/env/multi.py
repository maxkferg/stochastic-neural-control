import os
import gym
import math
import random
import numpy as np
from astar import AStar
from .single import SingleEnvironment
from .base import BaseEnvironment
from ray.rllib.env import MultiAgentEnv
from PIL import Image, ImageDraw, ImageColor

DEFAULT_ACTION_REPEAT = 2



class MultiEnvironment(gym.Env, MultiAgentEnv):

    def __init__(self, base_env, env_config={}):
        #if 'num_robots' in env_config:
        #    self.num_robots = env_config['num_robots']
        #else:
        #    raise ValueError("The number of robots was not specified")
        #
        #if "reset_on_target" in env_config:
        #    env_config["resetOnTarget"] = env_config["reset_on_target"]

        self.dones = set()
        self.action_repeat = env_config.get("action_repeat") or DEFAULT_ACTION_REPEAT
        self.base_env = base_env
        self.env = {}
        for i,robot in enumerate(self.base_env.robots):
            self.env[i] = SingleEnvironment(base_env, robot=robot)

        self.default_env = self.env[0]
        self.action_space = self.default_env.action_space
        self.observation_space = self.default_env.observation_space

        #for env in self.env.values():
        #    for other in self.env.values():
        #        if other != env:
        #            env.collision_objects.append(other.robot.racecarUniqueId)


    def step(self, actions):
        """
        Step the simulation forward one timestep
        """
        for key, action in actions.items():
            self.env[key].act(action)

        for i in range(self.action_repeat):
            self.default_env.base.step()
            is_crashed = any(e.is_crashed() for e in self.env.values())
            is_target = any(e.is_at_target() for e in self.env.values())
            if is_crashed or is_target:
                break

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