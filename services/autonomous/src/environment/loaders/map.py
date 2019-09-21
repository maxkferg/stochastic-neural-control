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
        self._cache = None


    def fetch(self):
        result = self.client.execute(getMapGeometry)
        result = json.loads(result)
        self._cache = result['data']['mapGeometry']
        return self._cache


    def cached(self):
        """
        Return the current representation of the map geometry
        Does not update the cached representation
        """
        if self._cache is None:
            return self.fetch()
        return self._cache


    def update(self):
        pass




