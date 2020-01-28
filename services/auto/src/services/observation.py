"""
Observation Generator
    Generate observations for each robot in a building
    Provides a solid abstraction over real and simulated robots
    - Subscribes to robot.events.odom to track robot positions
    - Subscribes to robot.events.pointcloud to track robot sensors
    - Arranges simulated environment to match Kafka stream
    - Publishes observations to robot.events.observation
"""

import os
import math
import time
import yaml
import json
import urllib
import shutil
import logging
import argparse
import numpy as np
from kafka import KafkaProducer
from common import train_env_factory
from environment.multi import MultiEnvironment
from environment.sensor import SensorEnvironment
from environment.core.env.base import BaseEnvironment
from .utils import KafkaBuffer, NumpyEncoder

logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)

NULL_ACTION = [0,0]

KAFKA_GROUP_NAME = 'Observation service'
ODOM_READ_TOPIC = 'robot.events.odom'
SENSOR_READ_TOPIC = 'robot.events.pointcloud'
OBSERVATION_PUBLISH_TOPIC = 'robot.events.observation'



class ObservationGenerator():
    """
    Generate observations for every robot in @building_id

    This generator provides an abstraction over real and simulated
    robots, allowing the learner to be totally agnostic to the underlying hardware
    """

    def __init__(self, building_id, api_config, min_timestep=0.1, headless=True, verbosity=0):
        """
        @building_id: The building to simulate
        @min_timestep: The minimum time between observations
        """
        kafka_host = api_config["Kafka"]["host"]
        self.headless = headless
        self.verbosity = verbosity
        self.api_config = api_config
        self.building_id = building_id
        self.min_timestep = min_timestep
        self.kafka_producer = self._setup_kafka_producer(kafka_host)
        self.env = self._setup_simulator(building_id)
        self.robot_ids = [robot.id for robot in self.robots]
        self.odom_buffer = KafkaBuffer(ODOM_READ_TOPIC, self.robot_ids, kafka_host, KAFKA_GROUP_NAME)
        #self.pointcloud_buffer = KafkaBuffer(ODOM_READ_TOPIC, self.robot_ids, kafka_host)
        logging.info("Generating observations for robots %s"%self.robot_ids)


    def _setup_kafka_producer(self, bootstrap_servers):
        return KafkaProducer(bootstrap_servers=bootstrap_servers)


    def _setup_simulator(self, building_id):
        """
        Create a Pybullet env to generate observations
        """
        env = {}
        config = self.api_config.copy()
        config.update({
            'headless': self.headless,
            'reset_on_target': False,
            'building_id': self.building_id
        })
        print(config)

        base_env = BaseEnvironment(config=config)
        self.robots = base_env.robots
        for i,robot in enumerate(self.robots):
            env[i] = SensorEnvironment(base_env, robot=robot, config=config)
        return env


    def _sync_simulator(self):
        """
        Sync the simulator with the Kafka stream
        """
        for env in self.env.values():
            self.odom_buffer.tick()
            try:
                message, _ = self.odom_buffer.get_last_message(env.robot.id)
            except ValueError as err:
                logging.error(err)
                continue
            pose = message["pose"]["pose"]
            position = [
                pose['position']['x'],
                pose['position']['y'],
                pose['position']['z'],
            ]
            orientation = [
                pose['orientation']['x'],
                pose['orientation']['y'],
                pose['orientation']['z'],
                pose['orientation']['w'],
            ]
            env.robot.set_pose(position, orientation)


    #def _normalize_observation(self, observation, time_passed):
    #    """
    #    Normalize the observation.
    #    If we are using a really long timestep, then we should
    #    """
    #    adjustment = REFERENCE_TIMESTEP / time_passed
    #    observation[0]["robot_velocity"] *= adjustment
    #    return observation


    def _publish_robot_observation(self, robot_id, observation):
        """
        Publish RL observation to kafka
        """
        message = {
           "robot_id": robot_id,
            "building_id": self.building_id,
            "observation": observation,
            "timestamp": time.time()
        }
        if self.verbosity>0:
            pprint(message)
        message = json.dumps(message, cls=NumpyEncoder).encode('utf-8')
        future = self.kafka_producer.send(OBSERVATION_PUBLISH_TOPIC, message)
        logging.info(f"Sent {OBSERVATION_PUBLISH_TOPIC} message for robot %s"%robot_id)



    def run(self):
        """
        Continuously poll Kafka for new actions and apply them immediately
        to their environment. After a timestep observe the environment and publish
        the current (action,observation) pair.
        """
        while True:
            started = time.time()
            self._sync_simulator()
            for env in self.env.values():
                observation = env.observe()
                #time_passed = time.time() - started
                #observation = self._normalize_observation(observation, time_passed)
                self._publish_robot_observation(env.robot.id, observation)
            time_remaining = self.min_timestep - (time.time() - started)
            if time_remaining>0:
                time.sleep(time_remaining)

