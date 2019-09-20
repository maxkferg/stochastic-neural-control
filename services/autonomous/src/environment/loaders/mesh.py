import os
import math
import time
import yaml
import json
import urllib
import shutil
import logging
import argparse
from urllib.error import HTTPError
from http.client import InvalidURL
from graphqlclient import GraphQLClient
from kafka import KafkaProducer, KafkaConsumer
from .graphql import getCurrentGeometry

logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)


class MeshLoader():
    """
    Loads Mesh Data into a PyBullet environment
    Can refetch mesh data periodically
    """

    def __init__(self, config):
        self.robots = {}
        self.geometry_endpoint = config["Geometry"]["host"]
        self.graphql_client = GraphQLClient(config["API"]["host"])
        self.kafka_consumer = self._setup_kafka_consumer(config["Kafka"]["host"])
        #self._setup_geometry()


    def _setup_kafka_consumer(self, bootstrap_servers):
        topic = "robot.events.odom"
        return KafkaConsumer(topic, bootstrap_servers=bootstrap_servers)


    def fetch(self):
        result = self.graphql_client.execute(getCurrentGeometry)
        result = json.loads(result)
        geometry = []
        for mesh in result['data']['meshesCurrent']:
            logging.info('Loading {}'.format(mesh['name']))
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
        logging.info("{} -> {}".format(url, local_filepath))
        os.makedirs(os.path.dirname(local_filepath), exist_ok=True)
        with urllib.request.urlopen(url) as response, open(local_filepath, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)


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


