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
from rrt.rrt.rrt import RRT
from kafka import KafkaProducer, KafkaConsumer
from rrt.search_space.search_space import SearchSpace
from rrt.utilities.plotting import Plot
from graphqlclient import GraphQLClient
from graphql import getMapGeometry, getTrajectory, updateTrajectory


logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)


class MapService():
    """
    A 2D Map of the building
    """
    def __init__(self, graphql_client):
        self.client = graphql_client

    def fetch(self):
        result = self.client.execute(getMapGeometry)
        result = json.loads(result)
        return result['data']['mapGeometry']

    def update(self):
        pass


