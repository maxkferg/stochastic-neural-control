import time
import logging
import pybullet
import os, inspect
from .utils.bullet_client import BulletClient
from .robots.robot_models import Turtlebot
from .robots.robot_messages import get_odom_message


logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)


class BaseEnvironment():

    def __init__(self, loader, headless=False):
        """
        A environment for simulating robot movement
        @headless: Does not show a GUI if headless is True
        """

        #choose connection method: GUI, DIRECT, SHARED_MEMORY
        if headless:
          self.physics = BulletClient(pybullet.DIRECT)
        else:
          self.physics = BulletClient(pybullet.GUI)
        self.loader = loader
        self.robots = []
        self.walls = []
        self.floors = []
        self.build()


    def build(self):
        """
        Reset the environment to match the API data
        """
        for obj in self.loader.mesh.fetch():
          position = obj['position']
          scale = obj['scale']
          is_stationary = obj['is_stationary']
          if obj['type'] == 'robot':
            m = self.create_turtlebot(position)
          else:
            m = self.create_geometry(obj['mesh_path'], position, scale=scale, stationary=is_stationary)
          
          # Record this element for later
          if obj['type']=='robot':
            self.robots.append(m)
          elif obj['type']=='wall':
            self.walls.append(m)
          elif obj['type']=='floor':
            self.floors.append(m)           


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


    def create_turtlebot(self, position):
        position[2] = max(0,position[2])
        physics = {}
        config = {
            "is_discrete": False,
            "initial_pos": position,
            "target_pos": [0,0,0],
            "resolution": 0.05,
            "power": 1.0,
            "linear_power": float(os.environ.get('LINEAR_SPEED', 50)),
            "angular_power": float(os.environ.get('ANGULAR_SPEED', 10)),
        }
        logging.info("Creating Turtlebot at: {}".format(position))
        turtlebot = Turtlebot(physics, config)
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

        vid = self.physics.createVisualShape(shape, rgbaColor=color, specularColor=specular, length=length, **kwargs);
        cid = self.physics.createCollisionShape(shape, height=length, **kwargs)
        bid = self.physics.createMultiBody(baseMass=1, baseVisualShapeIndex=cid, baseCollisionShapeIndex=cid, basePosition=position)

        collision_filter_group = 0
        collision_filter_mask = 0
        self.physics.setCollisionFilterGroupMask(bid, -1, collision_filter_group, collision_filter_mask)

        enable_collision = 1
        for plane in self.walls+self.floors:
            self.physics.setCollisionFilterPair(plane, bid, -1, -1, enable_collision)
        return bid


    def __del__(self):
        print("finished")
        self.physics.resetSimulation()
        self.physics.disconnect()