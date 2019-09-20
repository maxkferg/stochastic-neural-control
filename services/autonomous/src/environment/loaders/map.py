import os
import math
import time
import yaml
import json
import trimesh
import urllib
import shutil
import kafka
import logging
import argparse
import numpy as np
import transforms3d
import numpy as np
from kafka import KafkaProducer, KafkaConsumer
from graphqlclient import GraphQLClient
from .graphql import getMapGeometry, getTrajectory, updateTrajectory
from .rrt.rrt.rrt import RRT
from .rrt.search_space.search_space import SearchSpace
from .rrt.utilities.plotting import Plot


logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)


class MapLoader():
    """
    A 2D Map of the building
    """
    def __init__(self, config):
        self.client = GraphQLClient(config["API"]["host"])

    def fetch(self):
        result = self.client.execute(getMapGeometry)
        result = json.loads(result)
        return result['data']['mapGeometry']

    def update(self):
        pass


