import os
import math
import time
import yaml
import json
import urllib
import shutil
import logging
import argparse
import threading
from urllib.error import HTTPError
from http.client import InvalidURL
from graphqlclient import GraphQLClient
from kafka import KafkaProducer, KafkaConsumer
from .graphql import getCurrentGeometry


class MeshLoader():
    """
    Loads Mesh Data into a PyBullet environment
    Can refetch mesh data periodically
    """

    def __init__(self, config):
        self.robots = {}
        self.subscription_ids = []
        self.geometry_endpoint = config["Geometry"]["host"]
        self.graphql_client = GraphQLClient(config["API"]["host"])
        self.kafka_endpoint = config["Kafka"]["host"]
        self.kafka_client = None
        self.robot_positions = {}
        self.threads = []


    def __del__(self):
        """Stop all the threads"""
        for t in self.threads:
            t.join()


    def fetch(self):
        result = self.graphql_client.execute(getCurrentGeometry)
        result = json.loads(result)
        geometry = []
        for mesh in result['data']['meshesCurrent']:
            logging.debug('Loading {}'.format(mesh['name']))
            directory = mesh['geometry']['directory']
            filename = mesh['geometry']['filename']
            if directory is None:
                logging.error("Could not load {}:\nDirectory was invalid".format(name))
                continue            
            if filename is None:
                logging.error("Could not load {}:\nFilename was invalid".format(name))
                continue            
            relative_url = os.path.join(directory, filename)
            relative_url = relative_url.strip('./')
            position = self._convert_position(mesh)
            name = mesh['name']
            url = os.path.join(self.geometry_endpoint, relative_url)
            fp = os.path.join('tmp/', relative_url)
            try:
                self._download_geometry_resource(url, fp)
            except HTTPError as e:
                logging.error("Could not load {}:\n{}".format(name, e))
                continue
            except InvalidURL as e:
                logging.error("Could not load {}:\n{}".format(name, e))
                continue
            geometry.append({
                'id': mesh['id'],
                'name': name,
                'type': mesh['type'],
                'scale': mesh['scale'],
                'mesh_path': fp,
                'position': position,
                'is_stationary': mesh['physics']['stationary'],
                'is_simulated': mesh['physics']['simulated'],
                'orientation': mesh['theta'],
            })
        return geometry


    def _convert_position(self, position):
        """
        Convert the position from GraphQL form to PyBullet
        """ 
        return [
            position['x'],
            position['z'],
            position['y']
        ]


    def _download_geometry_resource(self, url, local_filepath):
        """
        Download the file from `url` and save it locally under `file_name`
        """
        if os.path.exists(local_filepath):
            logging.debug("Defaulting to cached file {}".format(local_filepath))
            return
        logging.debug("{} -> {}".format(url, local_filepath))
        os.makedirs(os.path.dirname(local_filepath), exist_ok=True)
        with urllib.request.urlopen(url) as response, open(local_filepath, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)


    def subscribe_robot_position(self):
        """
        Setup subscription to robot positions
        Must be called before getting robot position
        """
        args = (self.robot_positions, self.kafka_endpoint)
        t = threading.Thread(target=kafka_robot_worker, args=args)
        t.start()
        self.threads.append(t)


    def get_robot_position(self, robot_id):
        """
        Return the last seen position of this robot
        Uses Kafka to minimize latency
        """
        if robot_id in self.robot_positions:
            return self.robot_positions[robot_id]
        return None


def kafka_robot_worker(robot_positions, kafka_endpoint):
    topic = "robot.events.odom"
    kafka_consumer = KafkaConsumer(topic, bootstrap_servers=kafka_endpoint)
    kafka_consumer.subscribe("robot.events.odom")
    for msg in kafka_consumer:
        command = json.loads(msg.value)
        robot_id = command["robot"]["id"]
        position = command["pose"]["pose"]["position"].values()
        orientation = command["pose"]["pose"]["orientation"].values()
        robot_positions[robot_id] = {
            "position": list(position),
            "orientation": list(orientation),
        }



