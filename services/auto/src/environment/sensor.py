"""
Single agent environment with simple sensor readings

Can be wrapped by multi.MultiEnvironment
"""
import gym
import numpy as np
import pybullet as p
from gym import spaces
from pyquaternion import Quaternion
from collections import OrderedDict
from .core.env.single import SingleEnvironment
from .core.utils.vector import *



class SensorEnvironment(SingleEnvironment, gym.Env):
    """
    Environment where the observations are
    Lidar readings from nearby objects
    """

    def __init__(self, base_env, robot, config):
        self.init_lidar()
        self.must_delete = []
        super().__init__(base_env=base_env, robot=robot, config=config)
        self.pointcloud_size = len(self.rays)
        self.observation_space = spaces.Dict({
            'robot_theta': spaces.Box(low=-math.pi, high=math.pi, shape=(1,), dtype=np.float32),
            'robot_velocity': spaces.Box(low=-10, high=10, shape=(3,), dtype=np.float32),
            'target': spaces.Box(low=-20, high=20, shape=(2,), dtype=np.float32),
            'ckpts': spaces.Box(low=-20, high=20, shape=(self.ckpt_count,2), dtype=np.float32),
            'pointcloud': spaces.Box(low=-20, high=20, shape=(self.pointcloud_size,), dtype=np.float32),
        })


    def init_lidar(self):
        """
        Generate the sensor rays so we don't have to do it repeatedly
        """
        ray_count = 12                    # 12 rays of 30 degrees each
        ray_angle = 2. * np.pi / ray_count
        print("Lidar Ray Angle:", ray_angle)

        self.rays = []
        for i in range(ray_count):
            q = Quaternion(axis=[0, 0, 1], angle=i*ray_angle)
            self.rays.append(q)


    def read_lidar_values(self, robot_pos, robot_orn):
        """
        Read values from the laser scanner
        """
        self.read_3D_lidar_values(robot_pos, robot_orn)
        # The total length of the ray emanating from the LIDAR
        ray_len = 10

        robot_orn = Quaternion(
            a=robot_orn[3],
            b=robot_orn[0],
            c=robot_orn[1],
            d=robot_orn[2])

        lidar_pos = add_vec(robot_pos, [0, 0, .23])
        collision_robots = self.base.walls + self.base.robots + self.base.objects

        # Rotate the ray vector and determine intersection
        intersections = []
        ray_from = []
        ray_to = []
        robot_radius = 0.2
        for ray in self.rays:
            rot = robot_orn*ray
            dir_vec = rot.rotate([1, 0, 0])
            start_pos = add_vec(lidar_pos, scale_vec(robot_radius, dir_vec))
            end_pos = add_vec(lidar_pos, scale_vec(ray_len, dir_vec))
            ray_from.append(start_pos)
            ray_to.append(end_pos)


        # Test as a batch for improved performance
        ray_hits = self.physics.rayTestBatch(ray_from, ray_to)
        for ray in ray_hits:
            if ray[0] in self.base.walls + self.base.robots:
                intersections.append(ray[2]*ray_len)
            else:
                intersections.append(ray_len)
        return intersections


    def read_3D_lidar_values(self, robot_pos, robot_orn):
        # The total length of the ray emanating from the LIDAR
        ray_len = 6

        robot_orn = Quaternion(
            a=robot_orn[3],
            b=robot_orn[0],
            c=robot_orn[1],
            d=robot_orn[2])

        lidar_pos = add_vec(robot_pos, [0, 0, .25])

        # 360 rays of 1 degrees each
        ray_count = 120
        ray_angle = 2. * np.pi / ray_count
        print("Lidar Ray Angle:", ray_angle)

        my_rays = []
        for i in range(ray_count):
            q = Quaternion(axis=[0, 0, 1], angle=i*ray_angle)
            my_rays.append(q)

        # Rotate the ray vector and determine intersection
        intersections = []
        ray_from = []
        ray_to = []
        robot_radius = 0.2
        for ray in my_rays:
            rot = robot_orn*ray
            dir_vec = rot.rotate([1, 0, 0])
            start_pos = add_vec(lidar_pos, scale_vec(robot_radius, dir_vec))
            end_pos = add_vec(lidar_pos, scale_vec(ray_len, dir_vec))
            ray_from.append(start_pos)
            ray_to.append(end_pos)

        # RGB-D Camera
        for i in range(240):
            theta = 0.8*random() - 0.4
            alpha = 0.8*random() - 0.4
            ray_theta = Quaternion(axis=[0, 0, 1], angle=theta)
            ray_alpha = Quaternion(axis=[0, 1, 0], angle=alpha)
            rot = robot_orn*ray_theta*ray_alpha
            dir_vec = rot.rotate([1, 0, 0])
            start_pos = add_vec(lidar_pos, scale_vec(robot_radius, dir_vec))
            end_pos = add_vec(lidar_pos, scale_vec(ray_len, dir_vec))
            ray_from.append(start_pos)
            ray_to.append(end_pos)

        # Test as a batch for improved performance
        ray_hits = self.physics.rayTestBatch(ray_from, ray_to)
        self.create_ray_intersections(ray_hits)
        for ray in ray_hits:
            if ray[0] in collision_robots:
                intersections.append(ray[2]*ray_len)
            else:
                intersections.append(ray_len)
        return intersections


    def create_ray_intersections(self, ray_hits):
        import pybullet
        SIZE = 0.03
        COLOR = [0, .3, .9, 0.8]
        for o in self.must_delete:
            pybullet.removeBody(o)
        for ray in ray_hits:
            position = ray[3]
            o = self.base.create_shape(pybullet.GEOM_SPHERE, position, radius=SIZE, color=COLOR, mass=0)
            self.must_delete.append(o)


    def get_state(self, robot_pos, robot_orn):
        state = super().get_state(robot_pos, robot_orn)
        state["pointcloud"] = self.read_lidar_values(robot_pos, robot_orn)
        return state


    def get_observation(self, state):
        obs = super().get_observation(state)
        obs["pointcloud"] = np.array(state["pointcloud"], dtype=np.float32)
        # Important that the order is the same as observation space
        obs = OrderedDict((k, obs[k]) for k in self.observation_space.spaces.keys())
        return obs



