"""
Control Generator
    Generate control actions for any observation on the stream
    - Subscribes to robot.events.observation to track robot positions
    - Publishes observations to robot.commands.velocity_pred
"""

import os
import ray
import math
import time
import yaml
import json
import urllib
import shutil
import pickle
import logging
import argparse
import numpy as np
from ray import tune
from pprint import pprint
from kafka import KafkaProducer, KafkaConsumer
from ray.rllib.agents.registry import get_agent_class
from ray.rllib.policy.sample_batch import DEFAULT_POLICY_ID
from .utils import KafkaBuffer, NumpyEncoder
from .. import common
from ..agents.sacq import SACQAgent
from ..environment.sensor import SensorEnvironment
from ..environment.core.env.base import BaseEnvironment

logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)
tune.register_trainable("SACQ", SACQAgent)

NULL_ACTION = [0,0]
KAFKA_GROUP_NAME = 'Auto control service'
OBSERVATION_TOPIC = 'robot.events.observation'
CONTROL_PUBLISH_TOPIC = 'robot.commands.velocity_pred'


class ControlGenerator():
    """
    Generate control for every robot in @building_id

    This generator provides an abstraction over real and simulated
    robots, allowing the learner to be totally agnostic to the underlying hardware
    """

    def __init__(self, checkpoint_path, api_config, verbosity=0):
        """
        @building_id: The building to simulate
        @min_timestep: The minimum time between observations
        """
        kafka_host = api_config["Kafka"]["host"]
        self.verbosity = verbosity
        self.api_config = api_config
        self.checkpoint_path = checkpoint_path
        self.kafka_producer = self._setup_kafka_producer(kafka_host)
        self.kafka_consumer = KafkaConsumer(
            OBSERVATION_TOPIC, 
            bootstrap_servers=kafka_host, 
            group_id=KAFKA_GROUP_NAME)
        # Seek to the end of the kafka stream
        self.kafka_consumer.poll()
        self.kafka_consumer.seek_to_end()
        logging.info("Predicting actions for any observations on %s"%OBSERVATION_TOPIC)


    def _setup_kafka_producer(self, bootstrap_servers):
        return KafkaProducer(bootstrap_servers=bootstrap_servers)


    def _publish_robot_action(self, robot_id, action):
        """
        Publish RL observation to kafka
        """
        linear = float(action[0])
        rotation = float(action[1])
        message = {
          "robot": {
            "id": robot_id,
          },
          "time": time.time(),
          "velocity": {
            "linear": dict(x=linear, y=0, z=0),
            "angular": dict(x=0, y=0, z=rotation),
          }
        }
        if self.verbosity>0:
            pprint(message)
        message = json.dumps(message, cls=NumpyEncoder).encode('utf-8')
        future = self.kafka_producer.send(CONTROL_PUBLISH_TOPIC, message)
        logging.info(f"Sent {CONTROL_PUBLISH_TOPIC} message for robot %s"%robot_id)


    def rollout(self, agent):
        """
        Rollout the agent on the observation stream
        """
        result = self.kafka_consumer.poll()
        for partition, messages in result.items():
            for msg in messages:
                message = json.loads(msg.value)
                policy_id = DEFAULT_POLICY_ID
                robot_id = message["robot_id"]
                observation = message["observation"]
                obs, reward, done, info = observation
                print("----", reward, "----")
                a_action = agent.compute_action(
                    obs,
                    prev_action=None,
                    prev_reward=None,
                    policy_id=policy_id)
                print(a_action)
                #a_action = _flatten_action(a_action)
                self._publish_robot_action(robot_id, a_action)


    def run(self, algorithm="SACQ"):
        """
        Run the action producer
        """
        checkpoint_file = os.path.expanduser(self.checkpoint_path)
        config_dir = os.path.dirname(checkpoint_file)
        config_dir = os.path.expanduser(config_dir)
        config_path = os.path.join(config_dir, "params.pkl")
        if not os.path.exists(config_path):
            config_path = os.path.join(config_dir, "../params.pkl")
        if not os.path.exists(config_path):
            if not args.config:
                raise ValueError(
                    "Could not find params.pkl in either the checkpoint dir or "
                    "its parent directory.")

        with open(config_path, "rb") as f:
            config = pickle.load(f)

        if "num_workers" in config:
            config["num_workers"] = min(1, config["num_workers"])
        if "horizon" in config:
            del config["horizon"]

        # Stop all the actor noise
        config['num_workers'] = 0
        config['evaluation_interval'] = 0
        config['exploration_enabled'] = False

        # Merge in API configuration from the command line
        config['env_config'].update(self.api_config)
        config['env_config']['building_id'] = '5dc75e99d46ec9139d26a61f'

        ray.init()
        cls = SACQAgent#get_agent_class(algorithm)
        #agent = cls(env=args.env, config=config)
        agent = cls(config=config)
        agent.restore(checkpoint_file)
        # Loop forever
        while True:
            self.rollout(agent)
