import os
import sys
import gym
import time
import math
import time
import scipy
import skimage
import random
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
TARGET_DISTANCE_THRESHOLD = 0.6 # Max distance to the target
HOST, PORT = "localhost", 9999
COUNT = 0



class SingleEnvironment():

    def __init__(self, base_env, robot=None, config={}):
        print("Initializing new Single Robot Environment")
        print("Environment Config:",config)
        super().__init__()

        self.base = base_env
        self.physics = base_env.physics

        self.color = random_color()
        self.actionRepeat = config.get("actionRepeat", 2) # Choose an action every 0.2 seconds
        self.resetOnTarget = config.get("resetOnTarget", True)
        self.debug = config.get("debug", False)
        self.renders = config.get("renders",False)
        self.isDiscrete = config.get("isDiscrete",False)
        self.previous_state = None
        self.ckpt_count = 4

        self.targetUniqueId = -1
        self.robot = robot              # The controlled robot
        self.checkpoints = []           # Each checkpoint is given an id. Closest checkpoints are near zero index
        self.dead_checkpoints = []      # List of checkpoints that are not active
        self.collision_objects = []     # Other objects that can be collided with
        self.buildingIds = []           # Each plane is given an id
        
        # Building Map
        self.building_map = self.base.loader.map.fetch()
        self.pixel_state = PixelState(self.building_map)

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
            'robot_velocity': spaces.Box(low=-1, high=1, shape=(3,), dtype=np.float32),
            'target': spaces.Box(low=-10, high=10, shape=(2,), dtype=np.float32),
            'ckpts': spaces.Box(low=-10, high=10, shape=(2*self.ckpt_count,), dtype=np.float32),
            'maps': spaces.Box(low=0, high=1, shape=(48, 48, 4), dtype=np.uint8),
        })

        if self.isDiscrete:
            self.action_space = spaces.Discrete(9)
        else:
            action_dim = 2
            self._action_bound = 1
            action_high = np.array([self._action_bound] * action_dim)
            self.action_space = spaces.Box(-action_high, action_high, dtype=np.float32)

        self.viewer = None


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

        # Reset the target and robot position
        self.reset_robot_position()
        self.reset_target_position()
        self.reset_checkpoints()

        # Allow all the objects to reach equilibrium
        for i in range(10):
            self.physics.stepSimulation()

        robot_pos, robot_orn = self.physics.getBasePositionAndOrientation(self.robot.racecarUniqueId)
        state = self.get_state(robot_pos, robot_orn)
        return self.get_observation(state)


    def reset_robot_position(self):
        """Move the robot to a new position"""
        #car_pos = gen_start_position(.3, self.world.floor) + [.25]
        self.robot.set_position(car_pos)


    def reset_target_position(self, target_pos=None):
        """Move the target to a new position"""
        if target_pos is None:
            print("Using default target position")
            #target_pos = gen_start_position(.25, self.world.floor) + [.25]
            target_pos = [0, 0.1, 2]
        if self.targetUniqueId<0:
            self.targetUniqueId = self.base.create_target(target_pos, self.color)
        _, target_orn = self.physics.getBasePositionAndOrientation(self.targetUniqueId)
        self.physics.resetBasePositionAndOrientation(self.targetUniqueId, np.array(target_pos), target_orn)
        self.pixel_state.set_target(target_pos)


    def reset_checkpoints(self):
        """Create new checkpoints at [(vx,yy)...] locations"""
        return
        path = os.path.join(self.urdf_root, "checkpoint.urdf")

        # Remove old checkpoints
        for ckpt in self.checkpoints:
            self.remove_checkpoint(ckpt)

        # Use AStar to find checkpoint locations
        base_pos, carorn = self.physics.getBasePositionAndOrientation(self.robot.racecarUniqueId)
        target_pos, target_orn = self.physics.getBasePositionAndOrientation(self.targetUniqueId)
        #nodes = self.world.grid.get_path(base_pos, target_pos)

        # Create new checkpoints
        if nodes is None:
            print("AStar Failed")
        else:
            for i,node in enumerate(nodes):
                if i>0 and i%3 == 0:
                    position = (node.x, node.y, 0.5)
                    self.create_checkpoint(position)

        # Remap the position of the checkpoints
        self.remap_checkpoints()


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
                self.remap_checkpoints()
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
            'robot_theta': np.array(state["robot_theta"], dtype=np.float32),
            'robot_velocity': np.array([
                state["robot_vx"],
                state["robot_vy"],
                state["robot_vt"]
            ], dtype=np.float32),
            'target': np.array([
                state["rel_target_orientation"],
                state["rel_target_distance"]
            ], dtype=np.float32),
            'ckpts': state["rel_ckpt_positions"],
            'maps': state["map"]
        }
        # Important that the order is the same as observation space
        return OrderedDict((k, obs[k]) for k in self.observation_space.spaces.keys())


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

        return observation, reward, done, {}


    def is_crashed(self):
        contact = []
        print(self.base.walls)
        for wall in self.base.walls:
            a = self.physics.getContactPoints(self.robot.racecarUniqueId, wall)
            print("collisiobn",a)
            contact += self.physics.getContactPoints(self.robot.racecarUniqueId, wall)
                    
        return len(contact)>0


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
        self.map = np.zeros((self.ny, self.nx, 1), dtype=np.uint8)
        self.checkpoints = np.zeros((self.ny, self.nx, 1), dtype=np.uint8)
        self.target = np.zeros((self.ny, self.nx, 1), dtype=np.uint8)
        self.robot = np.zeros((self.ny, self.nx, 1), dtype=np.uint8)


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
        return stacked


    def save_image(self, robot_pos, filename=None):
        observation = self.observe(robot_pos)
        h,w,_ = observation.shape
        image = np.zeros((h,w,3))
        # Walls
        image[:,:,0] += observation[:,:,0]
        image[:,:,1] += observation[:,:,0]
        image[:,:,2] += observation[:,:,0]
        # robots (r), targets (g), checkpoints (b)  
        image[:,:,0] += observation[:,:,0]
        image[:,:,1] += observation[:,:,1]
        image[:,:,2] += observation[:,:,2]
        image = image.clip(0,255)
        if filename is not None:
            skimage.io.imsave(filename, image)
        return image


    def set_map(self, building_map):
        """
        Return a full map of the environment floor
        Usable floor space is colored 0. Walls are colored 1
        """
        height, width, _ = self.map.shape
        img = Image.new('L', (width, height), 0)
        for shape in building_map:
            for polygon in shape['external_polygons']:
                ImageDraw.Draw(img).polygon(polygon, outline=1, fill=1)
        self.map = numpy.array(img)
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
            ckpt_x, ckpt_y = self._to_pixel_coords(ckpt_pos)
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
            self.map_checkpoints[ymin:ymax, xmin:xmax] = 1
        return self.map_checkpoints


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
        y = int(self.scale*(pos[2]-self.ymin) + self.padding)
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


