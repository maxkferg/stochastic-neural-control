"""
Robot Simulator 
    Run simulators for every environment in the database.
    Simulators push observations at 50 ms intervals, or directly after an action is received. 
    At each step, the robot fetches the most recent action. If there are no more actions, 
    the null action is applied. Target locations are randomly selected.

    Example Usage:
        python main.py auto simulate --all


Robot Controller
    Execute a learned policy. Takes the most recent observation from mobile robot,
    computes a response and sends it to the robot.

    Example Usage:
        python main.py auto control --all

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
from graphqlclient import GraphQLClient
from graphql import getCurrentGeometry
from environment import Environment
from kafka import KafkaProducer, KafkaConsumer
from robots.robot_models import Turtlebot
from robots.robot_messages import get_odom_message

logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)

parser = argparse.ArgumentParser(description='Simulate robot movement.')
parser.add_argument('--headless', action='store_true', help='run without GUI components')


KAFKA_HOST = 'kafka-0.digitalpoints.io:19092'





class Simulator():
    """
    Run simulators for every environment in the database.
    Simulators push observations at 50 ms intervals, or directly after an action is received. 
    At each step, the robot fetches the most recent action. If there are no more actions, 
    the null action is applied. Target locations are randomly selected.
    """

    def __init__(self):
        building_ids = ['5d97edec93a71c81fb0fbbf1']
        self.kafka_consumer = self._setup_kafka_consumer(KAFKA_HOST)
        self.kafka_producer = self._setup_kafka_producer(KAFKA_HOST)
        for building_id in building_ids:
            self._setup_simulator(building_id)

    def _setup_kafka_consumer(self, bootstrap_servers):
        topic = "robot.events.observation"
        return KafkaConsumer(topic, bootstrap_servers=bootstrap_servers)

    def _setup_kafka_producer(self, bootstrap_servers):
        return KafkaProducer(bootstrap_servers=bootstrap_servers)

    def _setup_simulator(self, building_id):
        """
        Create a Pybullet env to generate observations
        """
        config = {
            'headless': True,
            'reset_on_target': False,
            'building_id': building_id,
        }
















class RobotController():
    """
    Execute a learned policy. Takes the most recent observation from mobile robot,
    computes a response and sends it to the robot.
    """
    def __init__(self, checkpoint_file):
        self.kafka_consumer = self._setup_kafka_consumer(KAFKA_HOST)
        self.kafka_producer = self._setup_kafka_producer(KAFKA_HOST)
        self.control_agent = self._setup_control_agent()


    def _setup_kafka_consumer(self, bootstrap_servers):
        topic = "robot.events.observation"
        return KafkaConsumer(topic, bootstrap_servers=bootstrap_servers)


    def _setup_kafka_producer(self, bootstrap_servers):
        return KafkaProducer(bootstrap_servers=bootstrap_servers)


    def _setup_control_agent(self, checkpoint_file):
        checkpoint_file = os.path.expanduser(checkpoint_file)
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
        config['evaluation_interval'] = 0
        config['exploration_enabled'] = False

        ray.init()

        cls = get_agent_class(args.run)
        agent = cls(env=args.env, config=config)
        agent.restore(checkpoint_file)
        return agent


    def run(args, parser):
        while True:
            result = self.kafka_consumer.poll()
            for partition, messages in result.items():
                for msg in messages:
                    observation = json.loads(msg.value)
                    action = self.agent.get_action(observation)
                    self._send_control_action(action)
                    


























