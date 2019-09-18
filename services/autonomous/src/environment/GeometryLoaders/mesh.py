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


class MeshLoader():
    """
    Loads Mesh Data into a PyBullet environment
    Can refetch mesh data periodically
    """

    def __init__(self, world, config):
        self.world = world
        self.robots = {}
        self.graphql_endpoint = config["API"]["host"]
        self.geometry_endpoint = config["Geometry"]["host"]
        self.graphql_client = GraphQLClient(self.graphql_endpoint)
        self.kafka_consumer = self._setup_kafka_consumer(config["Kafka"]["host"])
        self._setup_geometry()


    def _setup_kafka_consumer(self, bootstrap_servers):
        topic = "robot.events.odom"
        return KafkaConsumer(topic, bootstrap_servers=bootstrap_servers)


    def _setup_geometry(self):
        result = self.graphql_client.execute(getCurrentGeometry)
        result = json.loads(result)
        for mesh in result['data']['meshesCurrent']:
            logging.info('Loading {}'.format(mesh['name']))
            relative_url = os.path.join(mesh['geometry']['directory'], mesh['geometry']['filename'])
            relative_url = relative_url.strip('./')
            position = [mesh['x'], mesh['y'], mesh['z']]
            is_stationary = mesh['physics']['stationary']
            is_simulated = mesh['physics']['simulated']
            mesh_id = mesh['id']
            if mesh['type']=='robot':
                self.robots[mesh_id] = self._setup_turtlebot(position)
            else:
                url = os.path.join(self.geometry_endpoint, relative_url)
                fp = os.path.join('tmp/', relative_url)
                self._download_geometry_resource(url, fp)
                self.env.load_geometry(fp, position, scale=mesh["scale"], stationary=is_stationary)


    def _setup_turtlebot(self, position):
        position[2] = max(0,position[2])
        physics = {}
        config = {
            "is_discrete": False,
            "initial_pos": position,
            "target_pos": [0,0,0],
            "resolution": 0.05,
            "power": 1.0,
            "linear_power": float(os.environ.get('LINEAR_SPEED', 50)),
            "angular_power": float(os.environ.get('ANGULAR_SPEED', 10)),
        }
        logging.info("Creating Turtlebot at: {}".format(position))
        turtlebot = Turtlebot(physics, config)
        turtlebot.set_position(position)
        return turtlebot


    def _download_geometry_resource(self, url, local_filepath):
        """
        Download the file from `url` and save it locally under `file_name`
        """
        logging.info("{} -> {}".format(url, local_filepath))
        os.makedirs(os.path.dirname(local_filepath), exist_ok=True)
        with urllib.request.urlopen(url) as response, open(local_filepath, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)


    def fetch(self):
        """
        Refetch environment geometry
        """
        self._setup_geometry()


    def sync(self):
        """
        Sync robot position
        """
        result = self.kafka_consumer.poll()
        for partition, messages in result.items():
            for msg in messages:
                command = json.loads(msg.value)
                robot_id = command["robot"]["id"]
                robot = self.robots.get(robot_id)
                if robot is None:
                    logging.error("No robot with id %s"%robot_id)
                    continue
                position = command["pose"]["pose"]["position"].values()
                orientation = command["pose"]["pose"]["orientation"].values()
                robot.set_position(position, orientation)


