import os
import stat
import math
import time
import yaml
import json
import random
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
        self.building_id = config["building_id"]
        self.geometry_endpoint = config["Geometry"]["host"]
        self.graphql_client = GraphQLClient(config["API"]["host"])
        self.token = config["API"]["token"]
        self.kafka_endpoint = config["Kafka"]["host"]
        self.kafka_client = None
        self.robot_positions = {}
        self.threads = []


    def __del__(self):
        """Stop all the threads"""
        for t in self.threads:
            t.join()



    def fetch(self):
        result = self._get_current_geometry(backoff=10, nfailures=5)
        result = json.loads(result)
        geometry = []
        if result['data']['meshesOfBuilding'] is None:
            raise ValueError("Geometry API returned bad geometry data")
        for mesh in result['data']['meshesOfBuilding']:
            logging.debug('Loading {}'.format(mesh['name']))
            directory = mesh['geometry']['directory']
            filename = mesh['geometry']['filename']
            # Hack to avoid None errors
            if mesh["type"]=="robot":
                filename = "turtlebot.obj"
                directory = "./geometry/robots/turtlebot2/"
            # End hack
            if directory is None:
                raise ValueError("Could not load {}: Directory was invalid".format(name))
            if filename is None:
                raise ValueError("Could not load {}: Filename was invalid".format(name))
            # PyBullet can not load GLTF
            if mesh['geometry']['filetype'] in ['gltf', 'glb']:
                filename = filename.replace('.glb','.dae')
                filename = filename.replace('.gltf','.dae')
            relative_url = os.path.join(directory, filename)
            relative_url = relative_url.strip('./')
            position = self._convert_position(mesh)
            name = mesh['name']
            url = os.path.join(self.geometry_endpoint, relative_url)
            fp = os.path.join('tmp/', relative_url)
            try:
                print("Downloading",url,fp)
                self._download_geometry_resource(url, fp)
            except HTTPError as e:
                logging.error("Could not load {}:\n{}".format(name, e))
                continue
            except InvalidURL as e:
                logging.error("Could not load {}:\n{}".format(name, e))
                continue
            except Exception as e:
                print(e)
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



    def cached(self, max_age=120):
        """
        Return the cached (potentially old) geometry data
        @max_age: The maximum age to cache this data (in seconds)
        """
        pathname = '/tmp/geometry_cache.json'
        if os.path.exists(pathname):
            age = time.time() - os.stat(pathname)[stat.ST_MTIME]
            if age < max_age:
                logging.warn("Returning cached geometry from {0:.1f}s ago".format(age))
                with open(pathname) as fp:
                    try:
                        return json.load(fp)
                    except json.decoder.JSONDecodeError:
                        logging.warn("Invalid geometry cache file")

        geometry = self.fetch()
        with open(pathname,'w') as fp:
            json.dump(geometry, fp)
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


    def _get_current_geometry(self, backoff=10, nfailures=5):
        """
        Fetch the current geometry resource
        Supports exponential backoff
        @backoff: Time to wait before trying again
        @nfailures: Number of failues before throwing an error
        """
        for i in range(nfailures):
            try:
                params = {"building_id": self.building_id}
                return self.graphql_client.execute(getCurrentGeometry, params)
            except HTTPError:
                wait = backoff*1.5**i + backoff*random.random()
                logging.warning("Geometry request failed. Trying again in %i seconds"%wait)
                time.sleep(backoff*1.5**i)
        # Try one last time and let any errors throw
        return self.graphql_client.execute(getCurrentGeometry)


    def _download_geometry_resource(self, url, local_filepath):
        """
        Download the file from `url` and save it locally under `file_name`
        """
        if os.path.exists(local_filepath):
            logging.debug("Defaulting to cached file {}".format(local_filepath))
            return
        logging.debug("{} -> {}".format(url, local_filepath))
        os.makedirs(os.path.dirname(local_filepath), exist_ok=True)
        print("MADE:",os.path.dirname(local_filepath), "from", os.getcwd() )
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



