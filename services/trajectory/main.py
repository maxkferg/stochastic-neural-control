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
#from utilities.plotting import Plot
from graphqlclient import GraphQLClient
from graphql import getMapGeometry, getTrajectory, updateTrajectory

logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)

parser = argparse.ArgumentParser(description='Convert 3D geometry to 2D geometry.')
parser.add_argument('--headless', action='store_true', help='run without GUI components')
parser.add_argument('--height', type=float, default=0.1, help='height to generate map')



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



class TrajectoryService():
    """
    A Trajectory through the building
    """
    def __init__(self, graphql_client):
        self.client = graphql_client

    def fetch(self, trajectoryId):
        params = {"id": trajectoryId}
        result = self.client.execute(getTrajectory, params)
        print(result)
        result = json.loads(result)
        return result['data']['trajectory']

    def update(self):
        pass



class TrajectoryBuilder():
    """
    Build a 2D map from 3D object mesh
    Publishes updates to the 2D map as the 3D map changes
    """

    def __init__(self, furniture_height, config):
        graphql_endpoint = config["API"]["host"]
        graphql_client = GraphQLClient(graphql_endpoint)
        self.kafka_consumer = self._setup_kafka_consumer(config["Kafka"]["host"])
        self.map_service = MapService(graphql_client)
        self.trajectory_service = TrajectoryService(graphql_client)


    def _setup_kafka_consumer(self, bootstrap_servers):
        topic = "trajectory.commands.build"
        return KafkaConsumer(topic, bootstrap_servers=bootstrap_servers)


    def _build_trajectory(self, building_map, trajectory):
        obstacles = []
        search_space = [(None, None), (None, None)]

        if len(building_map)==0:
            raise TrajectoryError("No obstacles in the building")

        for polygon in building_map['external_polygons']:
            points = np.array(points)
            xmin, ymin = np.min(points)
            xmax, ymax = np.max(points)
            if xmin==xmax:
                xmax+=0.01
            if ymin==ymax:
                ymax+=0.01
            obstacles.append(xmin, ymin, xmax, ymax)
            search_space[0][0] = min(search_space[0][0], xmin)
            search_space[0][1] = min(search_space[0][1], ymin)
            search_space[1][0] = max(search_space[1][0], xmax)
            search_space[1][1] = max(search_space[1][1], xmax)

        x_start = trajectory["startPoint"]  # starting location
        x_goal = trajectory["endPoint"]  # goal location

        Q = np.array([(8, 4)])  # length of tree edges
        r = 1  # length of smallest edge to check for intersection with obstacles
        max_samples = 1024  # max number of samples to take before timing out
        prc = 0.1  # probability of checking for a connection to goal

        # create search space
        X = SearchSpace(search_space, obstacles)

        # create rrt_search
        rrt = RRT(X, Q, x_init, x_goal, max_samples, r, prc)
        path = rrt.rrt_search()

        # plot
        plot = Plot("rrt_2d")
        plot.plot_tree(X, rrt.trees)
        if path is not None:
            plot.plot_path(X, path)
        plot.plot_obstacles(X, Obstacles)
        plot.plot_start(X, x_init)
        plot.plot_goal(X, x_goal)
        plot.draw(auto_open=True)
        return path


    def run(self):
        logging.info("\n\n --- Starting trajectory builder --- \n")
        while True:
            for message in self.kafka_consumer:
                data = json.loads(message.value)
                print ("Building trajectory: ", data)
                trajectory = self.trajectory_service.fetch(data["trajectoryId"])
                print(trajectory)
                building_map = self.map_service.fetch()
                trajectory_points = self._build_trajectory(building_map, trajectory)
                try:
                    trajectory['points'] = trajectory_points
                    trajectory['isReady'] = True
                    trajectory['isSafe'] = True
                    self.trajectory_service.update(trajectory)
                except TrajectoryError:
                    print("Trajectory creation failed", TrajectoryError.message)
                    trajectory['isReady'] = False
                    trajectory['isSafe'] = False
                    self.trajectory_service.update(trajectory)



if __name__=="__main__":
    args = parser.parse_args()
    with open('config.yaml') as cfg:
        config = yaml.load(cfg, Loader=yaml.Loader)
    builder = TrajectoryBuilder(args.height, config)
    builder.run()




