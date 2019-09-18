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

parser = argparse.ArgumentParser(description='Convert 3D geometry to 2D geometry.')
parser.add_argument('--headless', action='store_true', help='run without GUI components')
parser.add_argument('--height', type=float, default=0.1, help='height to generate map')


class TrajectoryError(Exception):
    pass


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
        result = json.loads(result)
        return result['data']['trajectory']

    def update(self, trajectory):
        result = self.client.execute(updateTrajectory, trajectory)
        result = json.loads(result)
        return result['data']



class TrajectoryBuilder():
    """
    Build a 2D map from 3D object mesh
    Publishes updates to the 2D map as the 3D map changes
    """

    def __init__(self, furniture_height, config, headless=False):
        graphql_endpoint = config["API"]["host"]
        graphql_client = GraphQLClient(graphql_endpoint)
        self.headless = headless
        self.kafka_consumer = self._setup_kafka_consumer(config["Kafka"]["host"])
        self.map_service = MapService(graphql_client)
        self.trajectory_service = TrajectoryService(graphql_client)


    def _setup_kafka_consumer(self, bootstrap_servers):
        topic = "trajectory.commands.build"
        return KafkaConsumer(topic, 
            bootstrap_servers=bootstrap_servers,
            auto_offset_reset='latest')


    def _polygon_to_lines(self, polygon):
        first_point = polygon[0]
        lines = []
        for point in polygon:
            lines.append([first_point, point])
            first_point = point
        lines.append([point, polygon[0]])
        return lines


    def _build_trajectory(self, building_map, trajectory):
        obstacles = []
        search_space = None

        if len(building_map)==0:
            raise TrajectoryError("No obstacles in the building")

        if trajectory is None:
            raise TrajectoryError("Invalid trajectory object")

        for ob in building_map:
            for polygon in ob['external_polygons']:
                for line in self._polygon_to_lines(polygon['points']):
                    x0,y0 = line[0]
                    x1,y1 = line[1]
                    xmin = min(x0,x1)
                    xmax = max(x0,x1)
                    ymin = min(y0,y1)
                    ymax = max(y0,y1)
                    if xmin==xmax:
                        xmax+=0.2
                    if ymin==ymax:
                        ymax+=0.2
                    obstacles.append((xmin, ymin, xmax, ymax))
                    if search_space is None:
                        search_space = np.array([[xmin, xmax], [ymin, ymax]])
                    else:
                        search_space[0][0] = min(search_space[0][0], xmin)
                        search_space[0][1] = max(search_space[0][1], xmax)
                        search_space[1][0] = min(search_space[1][0], ymin)
                        search_space[1][1] = max(search_space[1][1], ymax)

        x_start = tuple(trajectory["startPoint"])  # starting location
        x_goal = tuple(trajectory["endPoint"])  # goal location
        print("Building path from {} to {}".format(x_start, x_goal))

        if x_start==x_goal:
            raise TrajectoryError("Start position and end position must be different")

        # Multiply everything by 100 so we are working in cm
        scale = 100
        search_space = scale*search_space
        obstacles = scale*np.array(obstacles)
        x_start = tuple(scale*np.array(x_start))
        x_goal = tuple(scale*np.array(x_goal))

        Q = np.array([(50, 50)])  # length of tree edges
        r = 1  # length of smallest edge to check for intersection with obstacles
        max_samples = 10000  # max number of samples to take before timing out
        prc = 0.1  # probability of checking for a connection to goal

        # create search space
        X = SearchSpace(search_space, obstacles)

        # create rrt_search
        rrt = RRT(X, Q, x_start, x_goal, max_samples, r, prc)
        path = rrt.rrt_search()

        if not self.headless:
            plot = Plot("rrt_2d")
            plot.plot_tree(X, rrt.trees)
            if path is not None:
                plot.plot_path(X, path)
            plot.plot_obstacles(X, obstacles)
            plot.plot_start(X, x_start)
            plot.plot_goal(X, x_goal)
            plot.draw(auto_open=True)

        if path is None:
            raise TrajectoryError("Could not find path from start to goal")

        # Divide by scale again
        path = np.array(path)/scale
        print("Found trajectory",path)

        return path


    def run(self):
        logging.info("\n\n --- Starting trajectory builder --- \n")
        while True:
            for message in self.kafka_consumer:
                data = json.loads(message.value)
                print ("Building trajectory: ", data["trajectoryId"])
                try:
                    trajectory = self.trajectory_service.fetch(data["trajectoryId"])
                    building_map = self.map_service.fetch()
                except Exception as e:
                    print("Failed to setup trajectory build", e)
                    continue 
                try:
                    trajectory_points = self._build_trajectory(building_map, trajectory)
                    trajectory_points = trajectory_points.tolist()
                    trajectory_points.append(trajectory["endPoint"])
                    params = {}
                    params['id'] = data["trajectoryId"]
                    params['points'] = trajectory_points
                    params['isReady'] = True
                    params['isSafe'] = True
                    self.trajectory_service.update(params)
                except TrajectoryError:
                    print("Trajectory creation failed", TrajectoryError)
                    params = {}
                    params['id'] = data["trajectoryId"]
                    params['isReady'] = False
                    params['isSafe'] = False
                    self.trajectory_service.update(params)


if __name__=="__main__":
    args = parser.parse_args()
    with open('config.yaml') as cfg:
        config = yaml.load(cfg, Loader=yaml.Loader)
    builder = TrajectoryBuilder(args.height, config, args.headless)
    builder.run()




