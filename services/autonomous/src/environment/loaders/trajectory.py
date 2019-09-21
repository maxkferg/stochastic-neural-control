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
from .rrt.rrt.rrt import RRT
from .rrt.rrt.rrt_star_bid_h import RRTStarBidirectionalHeuristic
from .rrt.search_space.search_space import SearchSpace
from .rrt.utilities.plotting import Plot
from .graphql import getMapGeometry, getTrajectory, updateTrajectory


logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)


class TrajectoryError(Exception):
    pass


class TrajectoryLoader():
    """
    A Trajectory through the building
    """
    def __init__(self, config):
        self.client = GraphQLClient(config["API"]["host"])

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

    def __init__(self, config):
        self.headless = config.get("headless", True)


    def _polygon_to_lines(self, polygon):
        first_point = polygon[0]
        lines = []
        for point in polygon:
            lines.append([first_point, point])
            first_point = point
        lines.append([point, polygon[0]])
        return lines


    def _correct_map(self, building_map):
        """
        The map users the wrong y direction
        """
        for ob in building_map:
            for polygon in ob['external_polygons']:
                line = np.array(polygon['points'])
                line[:,1] = -line[:,1]
                polygon['points'] = line.tolist()
        return building_map


    def solve(self, building_map, start_point, end_point):
        """
        Solve the path planning problem
        """
        obstacles = []
        search_space = None
        building_map = self._correct_map(building_map)

        if len(building_map)==0:
            raise TrajectoryError("No obstacles in the building")

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
                        xmax+=0.4
                    if ymin==ymax:
                        ymax+=0.4
                    obstacles.append((xmin, ymin, xmax, ymax))
                    if search_space is None:
                        search_space = np.array([[xmin, xmax], [ymin, ymax]])
                    else:
                        search_space[0][0] = min(search_space[0][0], xmin)
                        search_space[0][1] = max(search_space[0][1], xmax)
                        search_space[1][0] = min(search_space[1][0], ymin)
                        search_space[1][1] = max(search_space[1][1], ymax)

        # Our map uses the wrong y direction
        x_start = tuple(start_point)  # starting location
        x_goal = tuple(end_point)  # goal location

        if x_start==x_goal:
            logging.error("Trajectory: Start position and end position must be different")
            return None

        # Multiply everything by 100 so we are working in cm
        scale = 100
        search_space = scale*search_space
        obstacles = scale*np.array(obstacles)
        x_start = tuple(scale*np.array(x_start))
        x_goal = tuple(scale*np.array(x_goal))

        Q = np.array([(50, 50)])  # length of tree edges
        r = 10  # length of smallest edge to check for intersection with obstacles
        max_samples = 1000  # max number of samples to take before timing out
        prc = 0.01  # probability of checking for a connection to goal

        # create search space
        X = SearchSpace(search_space, obstacles)

        # create rrt_search
        rrt = RRTStarBidirectionalHeuristic(X, Q, x_start, x_goal, max_samples, r, prc)
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
            logging.error("Could not find path from start to goal")
            return None

        # Divide by scale again
        path = np.array(path)/scale
        return path
