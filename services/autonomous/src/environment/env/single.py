import os
import sys
import gym
import time
import math
import time
import scipy
import skimage
import random
import logging
import pybullet
import numpy as np
from collections import OrderedDict
from gym import spaces
from gym.utils import seeding
from pprint import pprint
from PIL import Image, ImageDraw
from .utils.color import random_color
from .utils.math import positive_component, rotation_change


COUNT = 0
RENDER_WIDTH = 960
RENDER_HEIGHT = 720
RENDER_SIZE = (RENDER_HEIGHT, RENDER_WIDTH)
EPISODE_LEN = 100
ROBOT_DANGER_DISTANCE = 0.8
ROBOT_CRASH_DISTANCE = 0.4
TARGET_REWARD = 1
CHECKPOINT_REWARD = 0.1
CHECKPOINT_DISTANCE = 0.5
BATTERY_THRESHOLD = 0.5
BATTERY_WEIGHT = -0.005
ROTATION_COST = -0.002
CRASHED_PENALTY = -1
MAP_GRID_SCALE = 0.2
NUM_CHECKPOINTS = 10
STATE_BUFFER_SIZE = 100
TARGET_DISTANCE_THRESHOLD = 0.6 # Max distance to the target
HOST, PORT = "localhost", 9999
COUNT = 0



def pad(array, reference_shape, offsets):
    """
    array: Array to be padded
    reference_shape: tuple of size of ndarray to create
    offsets: list of offsets (number of elements must be equal to the dimension of the array)
    will throw a ValueError if offsets is too big and the reference_shape cannot handle the offsets
    """

    # Create an array of zeros with the reference shape
    result = np.zeros(reference_shape)
    # Create a list of slices from offset to offset + shape in each dimension
    insertHere = [slice(offsets[dim], offsets[dim] + array.shape[dim]) for dim in range(array.ndim)]
    # Insert the array in the result at the specified offsets
    result[tuple(insertHere)] = array
    return result


class SingleEnvironment():

    def __init__(
        self,
        base_env,
        robot=None,
        target_policy="random",
        robot_policy="random",
        geometry_policy="initial",
        start_reference=[-1,0],
        action_repeat=10, # Robot makes a decision every 400ms
        verbosity=1,
        config={}
    ):
        """
        Single robot environment

        @base_env: A wrapper around the pybullet simulator. May be shared across
        multiple environents

        @robot: The turtlebot robot that will receive control actions from this env

        @config: Additional enviroment configuration

        @target_policy: Where to put the robot target at the start of the simulation
        If "random" then the target position is set to a random position on restart
        If "api" then the target position is pulled from the API on restart

        @robot_policy: Controls how the robot position is updated
        If "random" then the robot position is set to a random position on restart
        If "api" then the robot position is pulled from the API on restart
        If "subscribe" then the robot position is constant pulled from the API

        @geometry_policy: Controls how the geometry is updated
        If "initial" then the geometry is pulled once from the API
        If "api" then the geometry position is pulled from the API on restart
        If "subscribe" then the geometry is constantly pulled from Kafka

        @verbosity:
        0 - Silent
        1 - Normal logging
        2 - Verbose
        """
        if verbosity>0:
            print("Initializing new Single Robot Environment")
            print("Environment Config:",config)
        super().__init__()

        self.base = base_env
        self.physics = base_env.physics

        self.color = random_color()
        self.verbosity = verbosity
        self.start_reference = start_reference
        self.actionRepeat = config.get("actionRepeat", 2) # Choose an action every 0.2 seconds
        self.resetOnTarget = config.get("resetOnTarget", True)
        self.debug = config.get("debug", False)
        self.renders = config.get("renders",False)
        self.isDiscrete = config.get("isDiscrete",False)
        self.action_repeat = action_repeat
        self.previous_state = None
        self.ckpt_count = 4

        # Environment Policies
        self.robot_policy = robot_policy
        self.target_policy = target_policy
        self.geometry_policy = geometry_policy

        self.targetUniqueId = -1
        self.robot = robot              # The controlled robot
        self.checkpoints = []           # Each checkpoint is given an id. Closest checkpoints are near zero index
        self.dead_checkpoints = []      # List of checkpoints that are not active
        self.collision_objects = []     # Other objects that can be collided with
        self.buildingIds = []           # Each plane is given an id

        # Building Map
        self.building_map = self.base.loader.map.fetch()
        self.pixel_state = PixelState(self.building_map)
        self.state_cache_buffer = []

        # Camera observation
        self.width = 320                # The resolution of the sensor image (320x240)
        self.height = 240
        self.cam_dist = 3.
        self.cam_pitch = 0.
        self.cam_yaw = 0.
        self.cam_roll = 0.

        self.envStepCounter = 0
        self.startedTime = time.time()
        self.base.start()

        # Define the observation space a dict of simpler spaces
        self.observation_space = spaces.Dict({
            'robot_theta': spaces.Box(low=-2*math.pi, high=2*math.pi, shape=(1,), dtype=np.float32),
            'robot_velocity': spaces.Box(low=-10, high=10, shape=(3,), dtype=np.float32),
            'target': spaces.Box(low=-20, high=20, shape=(2,), dtype=np.float32),
            'ckpts': spaces.Box(low=-20, high=20, shape=(2*self.ckpt_count,), dtype=np.float32),
            'maps': spaces.Box(low=0, high=1, shape=(48, 48, 4), dtype=np.float32),
        })

        if self.geometry_policy=="subscribe":
            self.base.loader.mesh.subscribe_robot_position()

        if self.isDiscrete:
            self.action_space = spaces.Discrete(9)
        else:
            action_dim = 2
            self._action_bound = 1
            action_high = np.array([self._action_bound] * action_dim)
            self.action_space = spaces.Box(-action_high, action_high, dtype=np.float32)

        self.viewer = None
        self.reset()


    def __del__(self):
        self.physics = 0


    def reset(self):
        """Reset the environment. Move the target and the car"""
        steps = self.envStepCounter / self.actionRepeat
        duration = time.time() - self.startedTime
        if self.debug:
            print("Reset after %i steps in %.2f seconds"%(steps,duration))

        self.startedTime = time.time()
        self.envStepCounter = 0

        # Restores this setup from cache for speed
        #if len(self.state_cache_buffer)>5 and random.random() < 0.999:
        #    self._restore_cache(random.choice(self.state_cache_buffer))
        #else:
        self.reset_robot_position()
        self.reset_target_position()
        self.reset_checkpoints()
        #self.state_cache_buffer.append(self._get_cache())
    
        # Limit the buffer size
        #if len(self.state_cache_buffer) > STATE_BUFFER_SIZE:
        #    self.state_cache_buffer.pop(0)

        # Allow all the objects to reach equilibrium
        for i in range(10):
            self.physics.stepSimulation()

        robot_pos, robot_orn = self.physics.getBasePositionAndOrientation(self.robot.racecarUniqueId)
        state = self.get_state(robot_pos, robot_orn)
        return self.get_observation(state)


    def _get_cache(self):
        robot_pos, robot_orn = self.physics.getBasePositionAndOrientation(self.robot.racecarUniqueId)
        target_pos, target_orn = self.physics.getBasePositionAndOrientation(self.targetUniqueId)
        checkpoints = [self.physics.getBasePositionAndOrientation(c)[0] for c in self.checkpoints]
        return {
            "robot_pos": robot_pos,
            "robot_orn": robot_orn,
            "target_pos": target_pos,
            "target_orn": target_orn,
            "checkpoint_pos": checkpoints
        }


    def _restore_cache(self, cache):
        self.physics.resetBasePositionAndOrientation(self.targetUniqueId, cache["target_pos"], cache["target_orn"])
        self.physics.resetBasePositionAndOrientation(self.robot.racecarUniqueId, cache["robot_pos"], cache["robot_orn"])
        for checkpoint in self.checkpoints:
            self.remove_checkpoint(checkpoint)
        for checkpoint_pos in cache["checkpoint_pos"]:
            self.create_checkpoint(checkpoint_pos)
        self.pixel_state.set_target(cache["target_pos"])
        self.pixel_state.set_checkpoints(cache["checkpoint_pos"])


    def reset_robot_position(self):
        """Move the robot to a new position"""
        if self.robot_policy=="random":
            start = self.base.get_reachable_point(self.start_reference)
            start = start + [0.1]
            theta = 2*math.pi*random.random()
            orn = pybullet.getQuaternionFromEuler((0, 0, theta))
            self.robot.set_pose(start, orn)
        elif self.robot_policy=="api":
            raise NotImplimentedError("API Robot not implemented")
        elif self.robot_policy=="subscribe":
            self.base.sync_robot_position()
        else:
            raise ValueError("Invalid robot policy", self.robot_policy)


    def reset_target_position(self):
        """Move the target to a new position"""
        if self.target_policy=="random":
            position = self.base.get_reachable_point(self.start_reference)
        elif self.target_policy=="api":
            raise NotImplimentedError("API Target not implemented")
        else:
            raise ValueError("Invalid target policy", self.robot_policy)
        # Create a target if needed
        if self.targetUniqueId<0:
            self.targetUniqueId = self.base.create_target(position, self.color)
        # Move target to new position
        position = position + [0.25]
        _, orn = self.physics.getBasePositionAndOrientation(self.targetUniqueId)
        self.physics.resetBasePositionAndOrientation(self.targetUniqueId, np.array(position), orn)
        self.pixel_state.set_target(position)


    def reset_checkpoints(self):
        """Create new checkpoints at [(vx,yy)...] locations"""

        for checkpoints in reversed(self.checkpoints):
            self.dead_checkpoints.append(self.checkpoints.pop())

        # Use motion planner to find checkpoint locations
        base_pos, carorn = self.physics.getBasePositionAndOrientation(self.robot.racecarUniqueId)
        target_pos, target_orn = self.physics.getBasePositionAndOrientation(self.targetUniqueId)
        start_pos = base_pos[:2]
        goal_pos = target_pos[:2]
        nodes = self.base.get_path_to_goal(goal_pos, start_pos)

        # Create new checkpoints
        if nodes is None or len(nodes)==0:
            if self.verbosity>0:
                logging.info("RRT failed to find trajectory")
            nodes = []
        else:
            last_checkpoint = len(nodes)-1
            indicies = np.linspace(0, last_checkpoint, NUM_CHECKPOINTS)
            for i in indicies:
                node = nodes[int(i)]
                position = (node[0], node[1], 0.2)
                self.create_checkpoint(position)

        # Remap the position of the checkpoints
        self.pixel_state.set_checkpoints(nodes)


    def create_checkpoint(self, position):
        """
        Create a new checkpoint object
        May take the checkpoint from the dead checkpoints list
        """
        orientation = (0,0,0,1)
        if len(self.dead_checkpoints):
            ckpt = self.dead_checkpoints.pop()
            self.physics.resetBasePositionAndOrientation(ckpt, position, orientation)
        else:
            ckpt = self.base.create_shape(pybullet.GEOM_CYLINDER,
                position,
                color=self.color,
                radius=0.15,
                length=0.04,
                specular=[0.3,0.3,0.3,0.3]
            )
        self.checkpoints.append(ckpt)
        return ckpt


    def get_checkpoint_positions(self):
        """
        Return all the checkpoint positions
        """
        return [self.physics.getBasePositionAndOrientation(c)[0] for c in self.checkpoints]


    def remove_checkpoint(self, ckpt):
        """
        Remove a checkpoint from the map, and self.checkpoints
        Also moves the ckpt from self.checkpoints to self.dead_checkpoints
        """
        orientation = (0,0,0,1)
        self.checkpoints.remove(ckpt)
        self.physics.resetBasePositionAndOrientation(ckpt, (10,10,10), orientation)
        self.dead_checkpoints.append(ckpt)


    def get_state(self, robot_pos, robot_orn):
        """
        Return a dict that describes the state of the car
        Calculating the state is computationally intensive and should be done sparingly
        """
        state = {}
        robot_euler = pybullet.getEulerFromQuaternion(robot_orn)
        robot_theta = robot_euler[2]

        #carmat = self.physics.getMatrixFromQuaternion(robot_orn)
        tarpos, tarorn = self.physics.getBasePositionAndOrientation(self.targetUniqueId)
        invCarPos, invCarOrn = self.physics.invertTransform(robot_pos, robot_orn)
        tarPosInCar, tarOrnInCar = self.physics.multiplyTransforms(invCarPos, invCarOrn, tarpos, tarorn)

        # Iterate through checkpoints appending them to the distance list
        # Delete any checkpoints close to the robot, and the subsequent checkpoints
        ckpt_positions = []
        is_at_checkpoint = False
        for ckpt in reversed(self.checkpoints):
            pos, _ = self.physics.getBasePositionAndOrientation(ckpt)
            rel_pos = np.array(pos) - np.array(robot_pos)
            rel_distance = np.linalg.norm(rel_pos)
            if rel_distance < CHECKPOINT_DISTANCE:
                is_at_checkpoint = True
            if is_at_checkpoint:
                self.remove_checkpoint(ckpt)
                self.pixel_state.set_checkpoints(self.get_checkpoint_positions())
            else:
                ckpt_positions.append(tuple(rel_pos[0:2]))

        # Sort checkpoints. Pad with zeros until length n_ckpt
        ckpt_positions = list(reversed(ckpt_positions)) + [(0,0)]*self.ckpt_count
        ckpt_positions = ckpt_positions[:self.ckpt_count]

        state = {
            "robot_pos": robot_pos,
            "robot_orn": robot_orn,
            "robot_theta": robot_theta,
            "robot_vx": 0,
            "robot_vy": 0,
            "robot_vt": 0,
            "rel_ckpt_positions": ckpt_positions,
            "rel_target_orientation": math.atan2(tarPosInCar[1], tarPosInCar[0]),
            "rel_target_distance": math.sqrt(tarPosInCar[1]**2 + tarPosInCar[0]**2),
            "map": self.pixel_state.observe(robot_pos),
            #"lidar": lidar,
            "is_at_checkpoint": is_at_checkpoint,
            "is_crashed": self.is_crashed(),
            "is_at_target": self.is_at_target(),
            "is_broken": False,
        }


        if self.previous_state is not None:
            state["robot_vx"] = robot_pos[0] - self.previous_state["robot_pos"][0]
            state["robot_vy"] = robot_pos[1] - self.previous_state["robot_pos"][1]
            state["robot_vt"] = rotation_change(robot_theta, self.previous_state["robot_theta"])

        # Check if the simulation is broken
        if robot_pos[2] < 0 or robot_pos[2] > 1:
            if self.verbosity>0:
                print("Something went wrong with the simulation")
            state["is_broken"] = True

        # Calculate the distance to other robots
        state["other_robots"] = []
        for i in self.collision_objects:
            other_position, _ = self.physics.getBasePositionAndOrientation(i)
            state["other_robots"].append(np.linalg.norm(np.array(robot_pos) - np.array(other_position)))

        if np.any(np.less(state["other_robots"],[ROBOT_CRASH_DISTANCE])):
            state["is_crashed"] = True

        if self.debug:
            print("Target orientation:", state["rel_target_orientation"])
            print("Target position:", state["rel_target_distance"])

        if self.debug>1:
            print("State:")
            pprint(state)

        return state


    def get_observation(self, state):
        """
        Return the observation that is passed to the learning algorithm
        """
        obs = {
            'robot_theta': np.array([state["robot_theta"]], dtype=np.float32),
            'robot_velocity': np.array([
                state["robot_vx"],
                state["robot_vy"],
                state["robot_vt"]
            ], dtype=np.float32),
            'target': np.array([
                state["rel_target_orientation"],
                state["rel_target_distance"]
            ], dtype=np.float32),
            'ckpts': np.array(state["rel_ckpt_positions"]).flatten(),
            'maps': state["map"]
        }
        # Important that the order is the same as observation space
        obs = OrderedDict((k, obs[k]) for k in self.observation_space.spaces.keys())
        return obs


    def get_observation_array(self):
        """
        Return simulated observations at every point in the grid
        The observation array has dimension (ny, nx, n_observations)
        """
        raise NotImplimentedError("Can not get bulk observations")
        robot_pos, robot_orn = self.physics.getBasePositionAndOrientation(self.robot.racecarUniqueId)
        state = self.get_state(robot_pos, robot_orn)
        obser = self.get_observation(state)

        xlist = np.arange(self.world.grid.min_x, self.world.grid.max_x, self.world.grid.size/4)
        ylist = np.arange(self.world.grid.min_y, self.world.grid.max_y, self.world.grid.size/4)
        nx = len(xlist)
        ny = len(ylist)

        observations = []
        for i in range(nx):
            for j in range(ny):
                robot_pos = (xlist[i], ylist[j], robot_pos[2])
                state = self.get_state(robot_pos, robot_orn)
                observations.append(self.get_observation(state))
        return observations, nx, ny


    def act(self, action):
        """
        Move the simulation one step forward
        @action is the robot action, in the form [rotation, velocity]
        """
        if self.renders:
            basePos, orn = self.physics.getBasePositionAndOrientation(self.robot.racecarUniqueId)
            # Comment out this line to prevent the camera moving with the car
            #self.physics.resetDebugVisualizerCamera(1, 30, -40, basePos)

        if self.isDiscrete:
            fwd = [-1, -1, -1, 0, 0, 0, 1, 1, 1]
            steerings = [-0.6, 0, 0.6, -0.6, 0, 0.6, -0.6, 0, 0.6]
            forward = fwd[action]
            steer = steerings[action]
            realaction = [forward, steer]
        else:
            realaction = action
        self.action = action
        self.robot.applyAction(realaction)


    def step(self):
        """
        Step the physics simulator.
        Steps the simulator forward @self.action_repeat steps

        If robot policy is set to 'subscribe', then we also pull
        robot positions from Kafka. Some steps are applied afterwards for 
        latency compensation
        """
        for i in range(self.action_repeat):
            self.base.step()

        if self.robot_policy=="subscribe":
            self.base.sync_robot_position()
            self.base.step() # Latency compensation


    def observe(self):
        # Keep the simulation loop as lean as possible.
        robot_pos, robot_orn = self.physics.getBasePositionAndOrientation(self.robot.racecarUniqueId)
        action = self.action
        state = self.get_state(robot_pos, robot_orn)
        observation = self.get_observation(state)
        reward = self.reward(state, action)
        done = self.termination(state)

        self.envStepCounter += 1
        self.previous_state = state

        # Respawn the target and clear the isAtTarget flag
        if not self.resetOnTarget and state["is_at_target"]:
            self.reset_target_position()
            self.reset_checkpoints()

        if self.debug:
            self._validate_observation(observation)

        return observation, reward, done, {}


    def is_crashed(self):
        objects = self.base.walls + self.base.objects + self.base.robot_ids
        objects.remove(self.robot.racecarUniqueId)
        for obj in objects:
            contact = self.physics.getContactPoints(self.robot.racecarUniqueId, obj)
            if len(contact):
                return True
        return False


    def is_at_target(self):
        basePos, _ = self.physics.getBasePositionAndOrientation(self.robot.racecarUniqueId)
        targetPos, _ = self.physics.getBasePositionAndOrientation(self.targetUniqueId)
        return np.linalg.norm(np.array(basePos) - np.array(targetPos)) < TARGET_DISTANCE_THRESHOLD


    def termination(self, state):
        """Return True if the episode should end"""
        return state["is_crashed"] or state["is_broken"] or (self.resetOnTarget and state["is_at_target"])


    def reward(self, state, action):
        """
        Return the reward:
            Target Reward: 1 if target reached, else 0
            Collision Reward: -1 if crashed, else 0
            Battery Reward: Penalty if rotation or velocity exceeds 0.5
            Rotation Reward: Small penalty for any rotation
        """
        # Add positive reward if we are near the target
        if state["is_at_target"]:
            target_reward = TARGET_REWARD
        else:
            target_reward = 0

        # End the simulation with negative reward
        if state["is_crashed"]:
            crashed_reward = CRASHED_PENALTY
        else:
            crashed_reward = 0

        # Reward for reaching a checkpoint
        if state["is_at_checkpoint"]:
            checkpoint_reward = CHECKPOINT_REWARD
        else:
            checkpoint_reward = 0

        # Penalty for closeness
        danger_reward = 0
        for other in state["other_robots"]:
            if other < ROBOT_DANGER_DISTANCE:
                danger_reward -= 0.3*math.exp(20*(ROBOT_CRASH_DISTANCE-other))
        danger_reward = max(-1, danger_reward)

        # There is a cost to acceleration and turning
        # We use the squared cost to incentivise careful use of battery resources
        battery_reward = BATTERY_WEIGHT * np.sum(
            positive_component(np.abs(action) - BATTERY_THRESHOLD)
        )

        # There is an additional cost due to rotation
        rotation_reward = ROTATION_COST * abs(state["robot_vt"])

        # Total reward is the sum of components
        reward = target_reward + crashed_reward + battery_reward + rotation_reward + checkpoint_reward + danger_reward

        if self.debug:
            print("---- Step %i Summary -----"%self.envStepCounter)
            print("Action: ", action)
            print("Target Reward:  %.3f"%target_reward)
            print("Checkpoint Reward:  %.3f"%checkpoint_reward)
            print("Crashed Reward: %.3f"%crashed_reward)
            print("Battery Reward: %.3f"%battery_reward)
            print("Rotation Reward: %.3f"%rotation_reward)
            print("Danger Reward: %.3f"%danger_reward)
            print("Total Reward:   %.3f\n"%reward)

        return reward


    def render(self, mode='rgb_array', close=False, width=640, height=480):
        """Render the simulation to a frame"""
        if mode != "rgb_array":
            return np.array([])

        # Move the camera with the base_pos
        base_pos, carorn = self.physics.getBasePositionAndOrientation(self.robot.racecarUniqueId)
        state = self.get_state(base_pos, carorn)

        # Position the camera behind the car, slightly above
        dist = 1
        dir_vec = np.array(rotate_vector(carorn, [2*dist, 0, 0]))
        cam_eye = np.subtract(np.array(base_pos), np.add(dir_vec, np.array([0, 0, -1*dist])))
        cam_up = normalize(self.world.world_up - np.multiply(np.dot(self.world.world_up, dir_vec), dir_vec))

        view_matrix = self.physics.computeViewMatrix(
            cameraEyePosition=cam_eye,
            cameraTargetPosition=base_pos,
            cameraUpVector=cam_up)
        proj_matrix = self.physics.computeProjectionMatrixFOV(
            fov=60, aspect=float(width) / height,
            nearVal=0.1, farVal=100.0)
        (_, _, px, _, seg) = self.physics.getCameraImage(
            width=width, height=height, viewMatrix=view_matrix,
            projectionMatrix=proj_matrix, renderer=pybullet.ER_BULLET_HARDWARE_OPENGL)
        rgb_array = np.array(px, dtype=np.uint8)
        rgb_array = rgb_array.reshape((height, width, 4))

        for i in range(state["map"].shape[2]):
            xmin = 0
            xmax = state["map"].shape[1]
            ymin = i*state["map"].shape[0] + int(10*i)
            ymax = (i+1)*state["map"].shape[0] + int(10*i)
            rgb_array[ymin:ymax, xmin:xmax, :3] = state["map"][:,:,[i]]
            rgb_array[int((ymin+ymax)/2), int((xmin+xmax)/2), :] = [255,0,0,255]

        return rgb_array


    def render_observation(self, width=128, height=128):
        # Move the camera with the base_pos
        base_pos, carorn = self.physics.getBasePositionAndOrientation(self.robot.racecarUniqueId)

        # Position the camera behind the car, slightly above
        dir_vec = np.array(rotate_vector(carorn, [2, 0, 0]))
        cam_eye = np.subtract(np.array(base_pos), np.array([0, 0, -5]))
        cam_up = normalize(self.world.world_up - np.multiply(np.dot(self.world.world_up, dir_vec), dir_vec))

        view_matrix = self.physics.computeViewMatrix(
            cameraEyePosition=cam_eye,
            cameraTargetPosition=base_pos,
            cameraUpVector=cam_up)
        proj_matrix = self.physics.computeProjectionMatrixFOV(
            fov=60, aspect=float(width) / height,
            nearVal=0.1, farVal=100.0)
        (_, _, px, _, seg) = self.physics.getCameraImage(
            width=width, height=height, viewMatrix=view_matrix,
            projectionMatrix=proj_matrix, renderer=pybullet.ER_BULLET_HARDWARE_OPENGL)
        #rgb_array = np.array(px, dtype=np.uint8)
        #rgb_array = rgb_array.reshape((height, width, 4))

        rgb_array = 40*np.array(seg, dtype=np.uint8)
        rgb_array = rgb_array.reshape((height, width, 1))
        rgb_array = np.tile(rgb_array, (1,1,4))

        return rgb_array


    def _validate_observation(self, obs):
        """
        Validate an observation against the observation space
        """
        for key in obs:
            state = obs[key]
            box = self.observation_space[key]
            if not box.contains(state):
                raise ValueError("Box {} does not contain {}".format(box, state))
        # Test the whole space
        assert(self.observation_space.contains(obs)) 



class PixelState():
    """
    State represented using pixel maps
    @gridsize: The size of the grid in pixels
    @padding: The padding size to put around the map
    """

    def __init__(self, map, gridsize=0.1, padding=50):
        xmin, xmax, ymin, ymax = self._get_map_size(map)
        self.scale = 1/gridsize
        self.padding = padding
        self.xmin = xmin
        self.ymin = ymin
        px, py = self._to_pixel_coords((xmax, 0, ymax))
        self.nx = px+padding # Number of pixels in the x direction
        self.ny = py+padding # Number of pixels in the y direction
        self.map = np.zeros((self.ny, self.nx), dtype=np.uint8)
        self.checkpoints = np.zeros((self.ny, self.nx), dtype=np.uint8)
        self.target = np.zeros((self.ny, self.nx), dtype=np.uint8)
        self.robot = np.zeros((self.ny, self.nx), dtype=np.uint8)
        self.set_map(map)


    def observe(self, robot_pos, view_size=24, rotate=False):
        """
        Return an observation of this state as a numpy array
        """
        robot_x, robot_y = self._to_pixel_coords(robot_pos)

        # Pad the image and shift the coordinates
        xmin = robot_x - view_size# + pad_size
        xmax = robot_x + view_size# + pad_size
        ymin = robot_y - view_size# + pad_size
        ymax = robot_y + view_size# + pad_size
        #padding = ((pad_size, pad_size), (pad_size, pad_size), (0,0))

        stacked = np.stack((
            self.map,
            self.target,
            self.robot,
            self.checkpoints
        ), -1)

        #padded = np.pad(
        #    stacked,
        #    pad_width=padding,
        #    mode="constant")

        # Crop out a large square around the center (x,y)
        #cropped = padded[ymin:ymax, xmin:xmax, :]

        # Rotate the panel and crop a square section
        if rotate:
            stacked = scipy.ndimage.rotate(
                255*padded,
                axes=(1,0,0),
                order=0,
                reshape=False,
                angle=state["robot_theta"]*180/math.pi
            )[ymin:ymax, xmin:xmax]
        #eru 255*padded[ymin:ymax, xmin:xmax]
        cropped = stacked[ymin:ymax, xmin:xmax]
        padded = pad(cropped, (48,48,4), (0,0,0))
        return padded



    def save_image(self, robot_pos, filename=None):
        observation = self.observe(robot_pos)
        print(observation.shape)
        h,w,_ = observation.shape
        image = np.zeros((h,w,3))
        # Walls
        image[:,:,0] += observation[:,:,0]
        image[:,:,1] += observation[:,:,0]
        image[:,:,2] += observation[:,:,0]
        # robots (r), targets (g), checkpoints (b)
        image[:,:,0] += observation[:,:,1]
        image[:,:,1] += observation[:,:,2]
        image[:,:,2] += observation[:,:,3]
        image = image*255
        image = image.clip(0,255)
        image = image.astype(np.uint8)
        if filename is not None:
            skimage.io.imsave(filename, image)
        return image


    def set_map(self, building_map):
        """
        Return a full map of the environment floor
        Usable floor space is colored 0. Walls are colored 1
        """
        height, width = self.map.shape
        img = Image.new('L', (width, height), 0)
        draw = ImageDraw.Draw(img)
        for shape in building_map:
            for polygon in shape['external_polygons']:
                # Y axis is wrong.
                points = [(p[0], -p[1], 0) for p in polygon['points']]
                points = [self._to_pixel_coords(p) for p in points]
                draw.polygon(points, outline=1, fill=0)
        self.map = np.array(img)
        return self.map


    def set_target(self, target_pos):
        """
        Return a full map of the environment showing the target location
        Floor space is colored 0. Targets are colored 1.
        """
        #target_pos, _ = self.physics.getBasePositionAndOrientation(self.targetUniqueId)
        target_x, target_y = self._to_pixel_coords(target_pos)
        # Pixels to color
        xmin = target_x - 2
        xmax = target_x + 3
        ymin = target_y - 2
        ymax = target_y + 3
        # Clip
        xmin = max(xmin, 0)
        xmax = min(xmax, self.nx-1)
        ymin = max(ymin, 0)
        ymax = min(ymax, self.ny-1)
        # Color
        self.target.fill(0)
        self.target[ymin:ymax, xmin:xmax] = 1
        return self.target


    def set_checkpoints(self, checkpoints):
        """
        Return a full map of the environment showing the checkpoint locations
        Floor space is colored 0. Checkpoints are colored 1.
        """
        self.checkpoints.fill(0)
        for ckpt in checkpoints:
            ckpt_x, ckpt_y = self._to_pixel_coords(ckpt)
            # Pixels to color
            xmin = int(ckpt_x - 1)
            xmax = int(ckpt_x + 2)
            ymin = int(ckpt_y - 1)
            ymax = int(ckpt_y + 2)
            # Clip
            xmin = max(xmin, 0)
            xmax = min(xmax, self.nx-1)
            ymin = max(ymin, 0)
            ymax = min(ymax, self.ny-1)
            # Color
            self.checkpoints[ymin:ymax, xmin:xmax] = 1
        return self.checkpoints


    def set_robots(self, robots):
        """
        Return a full map of the environment showing the locations of other robots
        Floor space is colored 0. Other robots are colored 1.
        """
        self.robots.fill(0)
        for enemy_pos in robots:
            enemy_x, enemy_y = self._to_pixel_coords(enemy_pos)
            # Pixels to color
            xmin = int(enemy_x - 1)
            xmax = int(enemy_x + 2)
            ymin = int(enemy_y - 1)
            ymax = int(enemy_y + 2)
            # Clip
            xmin = max(xmin,0)
            xmax = min(xmax, self.nx-1)
            ymin = max(ymin, 0)
            ymax = min(ymax, self.nx-1)
            # Color
            self.robots[ymin:ymax, xmin:xmax] = 1
        return self.robots


    def _to_pixel_coords(self, pos):
        x = int(self.scale*(pos[0]-self.xmin) + self.padding)
        y = int(self.scale*(pos[1]-self.ymin) + self.padding)
        return x,y


    def _get_map_size(self, building_map):
        xmin = math.inf
        xmax = -math.inf
        ymin = math.inf
        ymax = -math.inf
        for ob in building_map:
            for polygon in ob['external_polygons']:
                for x,y in polygon['points']:
                    xmin = min(x, xmin)
                    xmax = max(x, xmax)
                    ymin = min(y, ymin)
                    ymax = max(y, ymax)
        return xmin, xmax, ymin, ymax


