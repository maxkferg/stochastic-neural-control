"""
Base environment is a single Pybullet world
The base environment handles the loading of world geometry
A base environment can be shared between multiple gym environments
"""

import time
import random
import logging
import pybullet
import os, inspect
import numpy as np
from shapely import geometry
from random import randrange
from ..utils.geometry import min_distance
from ..loaders.geometry import GeometryLoader
from ..bullet.bullet_client import BulletClient
from ..robots.robot_models import Turtlebot
from ..robots.robot_messages import get_odom_message



class BaseEnvironment():

    def __init__(self,
      planner="prm",
      config={},
    ):
        """
        A environment for simulating robot movement
        @planner: The planner used for checkpointing. Either "rrt" or "prm"
        @config: Environment config
        @config.headless: Does not show a GUI if headless is True
        @confg.building_id: The building geometry to use
        """
        timestep = config.get('base_timestep', 0.1) # 100 milliseconds
        substeps = int(timestep/0.008)

        #choose connection method: GUI, DIRECT, SHARED_MEMORY
        self.headless = config["headless"]
        if self.headless:
          self.physics = BulletClient(pybullet.DIRECT)
        else:
          self.physics = BulletClient(pybullet.GUI)
        self.timestep = timestep
        self.planner = planner
        self.loader = GeometryLoader(config)
        self.physics.setPhysicsEngineParameter(numSubSteps=substeps)
        self.physics.setTimeStep(timeStep=timestep)
        self.robots = []
        self.robot_ids = []
        self.walls = []
        self.floors = []
        self.objects = []
        self.build()

        # Setup the PRM planner. Used for target selection and checkpoints
        # Solve a simple search problem to prebuild the roadmap
        default_start = config['default_start']
        default_target = config['default_target']
        self.building_map = self.loader.map.cached()
        self.roadmap = self.loader.roadmap_planner
        self.roadmap.set_map(self.building_map)

        for i in range(10):
          rx,ry = self.roadmap.solve(default_start, default_target)
          print("Path:", rx)
          if len(rx):  
            return
          else:
            print("Failed to find a path from {} to {}".format(default_start, default_target))
        raise ValueError("Could not find a suitable roadmap")          


    def build(self):
        """
        Reset the environment to match the API data
        """
        for obj in self.loader.mesh.cached():
          position = obj['position']
          scale = obj['scale']
          is_stationary = obj['is_stationary']
          if position is None or None in position:
            logging.error("Got bad position for %s. Defaulting to [0,0,0]"%obj['name'])
            position = [0,0,0]
          if obj['type'] == 'robot':
            m = self.create_turtlebot(obj['id'], position, name=obj['name'])
          else:
            m = self.create_geometry(obj['mesh_path'], position, scale=scale, stationary=is_stationary)

          # Record this element for later
          if obj['type']=='robot':
            self.robots.append(m)
            self.robot_ids.append(m.racecarUniqueId)
          elif obj['type']=='wall':
            self.walls.append(m)
          elif obj['type']=='floor':
            self.floors.append(m)
          elif obj['type']=='object':
            self.objects.append(m)


    def start(self):
        self.physics.setGravity(0, 0, -10)


    def step(self):
        self.physics.stepSimulation()


    def create_geometry(self, filename, position, scale=1, stationary=False):
        meshScale = [scale, scale, scale]
        if stationary:
            baseMass = 0
        else:
            baseMass = 1

        visualShapeId = self.physics.createVisualShape(
          shapeType=pybullet.GEOM_MESH,
          fileName=filename,
          rgbaColor=[1, 1, 1, 1],
          specularColor=[0.4, .4, 0],
          meshScale=meshScale)

        collisionShapeId = self.physics.createCollisionShape(
          shapeType=pybullet.GEOM_MESH,
          flags=pybullet.GEOM_FORCE_CONCAVE_TRIMESH,
          fileName=filename,
          meshScale=meshScale)

        mb = self.physics.createMultiBody(baseMass=baseMass,
          baseOrientation=[1,0,0,1],
          baseInertialFramePosition=[0, 0, 0],
          baseCollisionShapeIndex=collisionShapeId,
          baseVisualShapeIndex=visualShapeId,
          basePosition=position,
          useMaximalCoordinates=True)
        return mb


    def create_target(self, position, color):
        return self.create_shape(pybullet.GEOM_BOX, position, size=0.2, color=color)


    def create_turtlebot(self, id, position, name):
        position[2] = max(0, position[2])
        config = {
            "is_discrete": False,
            "initial_pos": position,
            "target_pos": [0,0,0],
            "resolution": 0.05,
            "power": 1.0,
            "linear_power": float(os.environ.get('LINEAR_SPEED', 50)),
            "angular_power": float(os.environ.get('ANGULAR_SPEED', 10)),
        }
        logging.debug("Creating Turtlebot at: {}".format(position))
        turtlebot = Turtlebot(self.physics, config)
        turtlebot.id = id
        turtlebot.name = name
        turtlebot.set_position(position)
        return turtlebot


    def create_shape(self, shape, position, color=[1,0,0,1], specular=[1,1,1,1], **kwargs):
        """
        Create a s/cube than only collides with the building
        Robots can travel right through the cube.
        Return the PyBullet BodyId
        """
        if shape == pybullet.GEOM_BOX and not "halfExtents" in kwargs:
            size = kwargs.pop('size')
            kwargs['halfExtents'] = [size,size,size]

        length = 1
        if "length" in kwargs:
            length = kwargs.pop("length")

        mass = 1
        if 'mass' in kwargs:
          mass = kwargs.pop('mass')

        vid = self.physics.createVisualShape(shape, rgbaColor=color, specularColor=specular, length=length, **kwargs);
        cid = self.physics.createCollisionShape(shape, height=length, **kwargs)
        bid = self.physics.createMultiBody(baseMass=mass, baseVisualShapeIndex=cid, baseCollisionShapeIndex=cid, basePosition=position)

        collision_filter_group = 0
        collision_filter_mask = 0
        self.physics.setCollisionFilterGroupMask(bid, -1, collision_filter_group, collision_filter_mask)

        enable_collision = 1
        for plane in self.walls+self.floors:
            self.physics.setCollisionFilterPair(plane, bid, -1, -1, enable_collision)
        return bid


    def get_robot_positions(self):
      return [self.physics.getBasePositionAndOrientation(i)
          for i in self.robot_ids]


    def sync_robot_position(self):
        """
        Sync the robot position to Kafka
        """
        for robot in self.robots:
          pose = self.loader.mesh.get_robot_position(robot.id)
          if pose is None:
            logging.error("Failed to pull position for {}".format(robot.name))
          else:
            robot.set_pose(pose['position'], pose['orientation'])


    def _sample_floor_point(self, start, min_distance=None, max_distance=None, ntries=10):
      """
      Return a point that is reachable from the start point.
      Works by finding what map polygon the point lays within. Creates a
      traversable region by subtracting other polygons. Selects a random
      point in the traversable region.
      @start: The point to start at
      @min_distance: The minimum distance to the sampled point
      @max_distance: The maximum distance to the sampled point
      @threshold(depreciated): The minimum distance between the output and the polygon edge
      """
      #if min_distance is None:
      min_distance = 0

      #if max_distance is None:
      max_distance = 1000

      planner = self.roadmap.planner
      points = list(zip(planner.sample_x, planner.sample_y))

      close_points = []
      for point in points:
        distance = np.sum((np.array(start)-np.array(point))**2)
        if distance > min_distance**2 and distance < max_distance**2:
          close_points.append(point)

      if len(close_points):
        for i in range(ntries):
          pnt = random.choice(close_points)
          rx, _ = self.roadmap.solve(start, pnt)
          if len(rx):
            return list(pnt)


    def get_reachable_point(self, start, min_distance=None, max_distance=None, threshold=0.3):
      """
      Return a point that is probably reachable from the start point.
      Works by finding what map polygon the point lays within. Creates a
      traversable region by subtracting other polygons. Selects a random
      point in the traversable region.
      @start: The point to start at
      @min_distance: The minimum distance to the target
      @max_distance: The maximum distance to the target
      @threshold: The minimum distance between the output and the polygon edge
      """
      start_point = geometry.Point(start[0], start[1])
      building_map = self.loader.map.cached()
      external_polygons = []

      # Try a quick hack. Uses the motion planner points
      point = self._sample_floor_point(start, min_distance, max_distance, ntries=20)
      if point:
        return point
      print("Failed to find point with motion planner")

      for obj in building_map:
        for polygon in obj['external_polygons']:
          poly = geometry.Polygon(polygon['points'])
          external_polygons.append(poly)

      # Now find which one the start is in
      start_polygon = None
      for poly in external_polygons:
        # Subtract every polygon that is fully contained
        for subshape in external_polygons:
          if subshape.within(poly):
            poly = poly.difference(subshape)
        if start_point.within(poly):
          start_polygon = poly
          break

      if start_polygon is None:
        raise ValueError("Can not find start position in any polygon")

      if start_polygon.area<=0:
        raise ValueError("Start polygon has zero area")

      # Brute force select a random point in start polygon
      minx, miny, maxx, maxy = start_polygon.bounds
      while True:
          pnt = geometry.Point(random.uniform(minx, maxx), random.uniform(miny, maxy))
          if pnt.within(start_polygon) and min_distance(start_polygon, pnt) > threshold:
            break

      return [pnt.x, -pnt.y] # Map geometry uses incorrect y



    def get_path_to_goal(self, start, goal):
      """
      Return a point that is probably reachable from the start point.
      Works by finding what map polygon the point lays within. Creates a
      traversable region by subtracting other polygons. Selects a random
      point in the traversable region
      """
      building_map = self.loader.map.cached()
      if self.planner=="rrt":
        trajectory = self.loader.trajectory_builder.solve(building_map, start, goal)
      elif self.planner=="prm":
        rx, ry = self.roadmap.solve(start, goal)
        trajectory = [tuple(p) for p in zip(rx, ry)]
      else:
        raise ValueError("Unknown planner %s"%self.planner)
      return trajectory



    def __del__(self):
      if hasattr(self, 'physics'):
        self.physics.resetSimulation()
        self.physics.disconnect()
