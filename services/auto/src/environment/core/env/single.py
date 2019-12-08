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
from gym import spaces
from gym.utils import seeding
from pprint import pprint
from skimage.transform import rescale
from PIL import Image, ImageDraw
from ..utils.color import random_color
from ..utils.vector import rotate_vector, normalize
from ..utils.math import normalize_angle, positive_component, rotation_change


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
BATTERY_THRESHOLD = 0.6
BATTERY_WEIGHT = -0.01
ROTATION_COST = -0.01
CRASHED_PENALTY = -1
MAP_GRID_SCALE = 0.2
NUM_CHECKPOINTS = 30
STATE_BUFFER_SIZE = 100
MIN_EPISODE_REWARD = -1 # Terminate if the reward gets lower than this
TARGET_DISTANCE_THRESHOLD = 0.6 # Max distance to the target
HOST, PORT = "localhost", 9999
COUNT = 0


DEFAULTS = {
    'is_discrete': False,
    'target_policy': 'random',
    'robot_policy': 'random',
    'geometry_policy': 'initial',
    'reset_on_target': False,
    'start_reference': [-1,0],
    'timestep': 0.4, # Robot makes a decision every 0.4 s
    'verbosity': 0,
    'debug': False,
    'renders': False,
    'headless': False,
}


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
        config={}
    ):
        """
        Single robot environment

        @base_env: A wrapper around the pybullet simulator. May be shared across
        multiple environents

        @robot: The turtlebot robot that will receive control actions from this env

        @config: Additional enviroment configuration

        @config.target_policy: Where to put the robot target at the start of the simulation
        If "random" then the target position is set to a random position on restart
        If "api" then the target position is pulled from the API on restart

        @config.robot_policy: Controls how the robot position is updated
        If "random" then the robot position is set to a random position on restart
        If "api" then the robot position is pulled from the API on restart
        If "subscribe" then the robot position is constant pulled from the API

        @config.geometry_policy: Controls how the geometry is updated
        If "initial" then the geometry is pulled once from the API
        If "api" then the geometry position is pulled from the API on restart
        If "subscribe" then the geometry is constantly pulled from Kafka

        @config.verbosity:
        0 - Silent
        1 - Normal logging
        2 - Verbose
        """
        config = dict(DEFAULTS, **config)
        if config['verbosity']>1:
            print("Initializing new Single Robot Environment")
            print("Environment Config:", config)

        self.base = base_env
        self.physics = base_env.physics

        self.color = random_color()
        self.verbosity = config["verbosity"]
        self.timestep = config["timestep"] 
        self.velocity_multiplier = math.sqrt(DEFAULTS["timestep"]/self.timestep)
        self.start_reference = config["start_reference"]
        self.reset_on_target = config["reset_on_target"]
        self.debug = config["debug"]
        self.renders = config["renders"]
        self.isDiscrete = config["is_discrete"]
        self.action_repeat = int(self.timestep / base_env.timestep)
        self.previous_state = None
        self.ckpt_count = 4
        print("Using velocity multiplier:", self.velocity_multiplier)

        # Environment Policies
        self.robot_policy = config['robot_policy']
        self.target_policy = config['target_policy']
        self.geometry_policy = config['geometry_policy']

        self.targetUniqueId = -1
        self.robot = robot              # The controlled robot
        self.checkpoints = []           # Each checkpoint is given an id. Closest checkpoints are near zero index
        self.dead_checkpoints = []      # List of checkpoints that are not active
        self.collision_objects = []     # Other objects that can be collided with
        self.buildingIds = []           # Each plane is given an id

        # Building Map
        self.building_map = self.base.loader.map.fetch()
        self.state_cache_buffer = []
        self.reward_so_far = 0

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
            'robot_theta': spaces.Box(low=-math.pi, high=math.pi, shape=(1,), dtype=np.float32),
            'robot_velocity': spaces.Box(low=-10, high=10, shape=(3,), dtype=np.float32),
            'target': spaces.Box(low=-50, high=50, shape=(2,), dtype=np.float32),
            'ckpts': spaces.Box(low=-50, high=50, shape=(self.ckpt_count,2), dtype=np.float32),
        })

        if self.geometry_policy=="subscribe":
            self.base.loader.mesh.subscribe_robot_position()

        if self.isDiscrete:
            self.action_space = spaces.Discrete(9)
        else:
            action_min = -1
            action_max = 1
            self.action_space = spaces.Box(low=action_min, high=action_max, shape=(2,), dtype=np.float32)

        self.viewer = None
        self.reset()
        print("Initialized env with %.3f timestep (%i base repeat)"%(self.timestep, self.action_repeat))


    def __del__(self):
        self.physics = 0


    def reset(self):
        """Reset the environment. Move the target and the car"""
        steps = self.envStepCounter
        duration = time.time() - self.startedTime
        if self.debug:
            print("Reset after %i steps in %.2f seconds"%(steps,duration))

        self.startedTime = time.time()
        self.envStepCounter = 0
        self.reward_so_far = 0
        self.action = [0,0]

        self.reset_robot_position()
        self.reset_target_position()
        self.reset_checkpoints()
    
        # Allow all the objects to reach equilibrium
        self.physics.stepSimulation()

        robot_pos, robot_orn = self.physics.getBasePositionAndOrientation(self.robot.racecarUniqueId)
        state = self.get_state(robot_pos, robot_orn)

        self.camera_orn = robot_orn

        # Reset again if the current state is not valid
        if self.termination(state):
            return self.reset()

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


    def reset_robot_position(self):
        """Move the robot to a new position"""
        if self.robot_policy=="random":
            start = self.base.get_reachable_point(self.start_reference)
            start = start + [0.1]
            theta = 2*math.pi*random.random()
            orn = pybullet.getQuaternionFromEuler((0, 0, theta))
            self.robot.set_pose(start, orn)
            # Overwrite the previous state so we do not get huge velocities
            if self.previous_state is not None:
                self.previous_state["robot_pos"] = start
                self.previous_state["robot_theta"] = theta
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
        for ckpt in self.checkpoints:
            pos, _ = self.physics.getBasePositionAndOrientation(ckpt)
            rel_pos = np.array(pos) - np.array(robot_pos)
            rel_distance = np.linalg.norm(rel_pos)
            if rel_distance < CHECKPOINT_DISTANCE:
                is_at_checkpoint = True
            if is_at_checkpoint:
                self.remove_checkpoint(ckpt)
            else:
                ckpt_positions.append(tuple(rel_pos[0:2]))

        # Sort checkpoints. Pad with zeros until length n_ckpt
        ckpt_positions = list(reversed(ckpt_positions)) + [(10,10)]*self.ckpt_count
        ckpt_positions = ckpt_positions[:self.ckpt_count]

        # Write robot positions to the map
        robot_pose = self.base.get_robot_positions()

        state = {
            "robot_pos": robot_pos,
            "robot_orn": robot_orn,
            "robot_theta": robot_theta,
            "robot_vx": 0,
            "robot_vy": 0,
            "robot_vt": 0,
            "other_robots": [],
            "rel_ckpt_positions": ckpt_positions,
            "rel_target_orientation": math.atan2(tarPosInCar[1], tarPosInCar[0]),
            "rel_target_distance": math.sqrt(tarPosInCar[1]**2 + tarPosInCar[0]**2),
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
        for robot_id in self.base.robot_ids:
            if robot_id != self.robot.racecarUniqueId:
                enemy_position, _ = self.physics.getBasePositionAndOrientation(robot_id)
                state["other_robots"].append(np.linalg.norm(np.array(robot_pos) - np.array(enemy_position)))

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
        def encode_checkpoints(ckpts, robot_orn):
            """Encode checkpoints to [theta,r]"""
            encoded = []
            for c in ckpts:
                orn = math.atan2(c[1], c[0]) - robot_orn
                orn = normalize_angle(orn)
                dist = math.sqrt(c[1]**2 + c[0]**2)
                encoded.append([orn,dist])
            return np.array(encoded, dtype=np.float32)

        def encode_target(state):
            """Encode target to [theta,r]"""
            orn = normalize_angle(state["rel_target_orientation"])
            dist = state["rel_target_distance"]
            return np.array([orn, dist], dtype=np.float32)

        obs = {
            'robot_theta': np.array([state["robot_theta"]], dtype=np.float32),
            'robot_velocity': self.velocity_multiplier * np.array([
                state["robot_vx"],
                state["robot_vy"],
                state["robot_vt"]
            ], dtype=np.float32), 
            'target': encode_target(state),
            'ckpts': encode_checkpoints(state["rel_ckpt_positions"], state["robot_theta"]),
        }
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

        self.envStepCounter += 1
        self.previous_state = state
        self.reward_so_far += reward
        done = self.termination(state)
        info = dict(timeout=False)

        # Respawn the target and clear the isAtTarget flag
        if not self.reset_on_target and state["is_at_target"]:
            self.reset_target_position()
            self.reset_checkpoints()

        if self.debug:
            self._validate_observation(observation)

        return observation, reward, done, {}


    def is_crashed(self):
        """
        Return true if the robots have crashed
        Does not check robot-robot collision as this is done using distances
        """
        objects = self.base.walls + self.base.objects
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
        if state["is_crashed"] or state["is_broken"]:
            return True
        if state["is_at_target"] and self.reset_on_target:
            return True
        return self.reward_so_far < MIN_EPISODE_REWARD


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

        # Follow the robot smoothly
        self.camera_orn = 0.99*np.array(self.camera_orn) + 0.01*np.array(carorn)

        # Position the camera behind the car, slightly above
        dist = 2
        world_up = [0,0,1]
        dir_vec = np.array(rotate_vector(self.camera_orn, [2*dist, 0, 0]))
        cam_eye = np.subtract(np.array(base_pos), np.add(dir_vec, np.array([0, 0, -2*dist])))
        cam_up = normalize(world_up - np.multiply(np.dot(world_up, dir_vec), dir_vec))

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


