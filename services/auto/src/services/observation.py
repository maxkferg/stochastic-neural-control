"""
Observation Generator
    Generate observations for each robot in a building
    Provides a solid abstraction over real and simulated robots
    - Subscribes to robot.events.odom to track robot positions
    - Subscribes to robot.events.pointcloud to track robot sensors
    - Arranges simulated environment to match Kafka stream
    - Publishes observations to robot.events.observation
"""

import os
import math
import time
import yaml
import json
import urllib
import shutil
import logging
import argparse
from ..environment.sensor import SensorEnvironment
from ..environment.core.env.base import BaseEnvironment
from kafka import KafkaProducer, KafkaConsumer

logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)

KAFKA_HOST = 'kafka-0.digitalpoints.io:19092'
NULL_ACTION = [0,0]

ODOM_READ_TOPIC = 'robot.events.odom'
SENSOR_READ_TOPIC = 'robot.events.pointcloud'
OBSERVATION_PUBLISH_TOPIC = 'robot.events.observation'



class KafkaBuffer():
    """
    Keep track of the last message in a Kafka stream
    Only trackes messages for @robot_ids 
    """

    def __init__(self, topic, robot_ids):
        self.robot_ids = robot_ids
        self.consumer = KafkaConsumer(topic, bootstrap_servers=KAFKA_HOST)


    def get_last_message(self, robot_id):
        """
        Return the last message for a robot
        """
        if robot_id not in self.msg_buffer:
            logging.error(f"No data for robot ", robot_id)
            return None, None
        lag = time.time() - self.msg_received[robot_id]
        if lag > 10:
            logging.warn(f"Data for {robot_id} is {lag:i} seconds old")
        return self.msg_buffer[robot_id], lag


    def tick():
        result = self.kafka_consumer.poll()
        for partition, messages in result.items():
            for msg in messages:
                message = json.loads(msg.value)
                robot_id = command["robot"]["id"]
                if robot_id in self.robot_ids:
                    self.msg_buffer[robot_id] = message
                    self.msg_received[robot_id] = time.time()



class ObservationGenerator():
    """
    Generate observations for every robot in @building_id

    This generator provides an abstraction over real and simulated 
    robots, allowing the learner to be totally agnostic to the underlying hardware
    """

    def __init__(self, building_id, min_timestep=0.1):
        """ 
        @building_id: The building to simulate
        @min_timestep: The minimum time between observations
        """
        self.robot_ids = []
        self.building_id = building_id
        self.min_timestep = min_timestep
        self.kafka_producer = self._setup_kafka_producer(KAFKA_HOST)
        self._setup_simulator(building_id)
        self.odom_buffer = KafkaBuffer(ODOM_READ_TOPIC, self.robot_ids)
        #self.pointcloud_buffer = KafkaBuffer(ODOM_READ_TOPIC, self.robot_ids)


    def _setup_kafka_producer(self, bootstrap_servers):
        return KafkaProducer(bootstrap_servers=bootstrap_servers)


    def _setup_simulator(self, building_id):
        """
        Create a Pybullet env to generate observations
        """
        config = {
            'headless': True,
            'reset_on_target': False,
            'building_id': self.building_id
        }
        # Create PyBullet environment
        base_env = BaseEnvironment(config=config)
        self.robots = base_env.robots
        for i,robot in enumerate(self.robots):
            self.env[i] = SensorEnvironment(base_env, robot=robot, config=config)


    def _sync_simulator(self):
        """
        Sync the simulator with the Kafka stream
        """
        for env in self.env:
            self.odom_buffer.tick()
            message, _ = self.odom_buffer.get_last_message(env.robot.id)
            if message is not None:
                position = message["pose"]["pose"]["position"]
                orientation = message["pose"]["pose"]["orientation"]
                env.robot.set_pose(position, orientation)


    def _publish_robot_observation(self, robot_id, observation):
        """
        Publish RL observation to kafka
        """
        message = {
            robot_id: self.robot_id,
            building_id: self.building_id,
            observation: observation,
            timestamp: time.time()
        }
        message = json.dumps(observation).encode('utf-8')
        future = self.kafka_producer.send(OBSERVATION_PUBLISH_TOPIC, message)
        logging.info(f"Sent {OBSERVATION_PUBLISH_TOPIC} message for robot %s"%robot_id)



    def run(self):       
        """
        Continuously poll Kafka for new actions and apply them immediately
        to their environment. After a timestep observe the environment and publish
        the current (action,observation) pair.
        """
        while True:
            started = time.time()
            self._sync_simulator()
            for env in self.env:
                observation = env.observe()
                self._publish_robot_observation(env.robot.id, observation)
            time_remaining = self.min_timestep - (time.time() - started)
            if time_remaining>0:
                time.sleep(time_remaining)





"""

class RobotController():

    Execute a learned policy. Takes the most recent observation from mobile robot,
    computes a response and sends it to the robot.
    def __init__(self, checkpoint_file):
        self.kafka_consumer = self._setup_kafka_consumer(KAFKA_HOST)
        self.kafka_producer = self._setup_kafka_producer(KAFKA_HOST)
        self.control_agent = self._setup_control_agent()


    def _setup_kafka_consumer(self, bootstrap_servers):
        topic = "robot.events.observation"
        return KafkaConsumer(topic, bootstrap_servers=bootstrap_servers)


    def _setup_kafka_producer(self, bootstrap_servers):
        return KafkaProducer(bootstrap_servers=bootstrap_servers)


    def _setup_control_agent(self, checkpoint_file):
        checkpoint_file = os.path.expanduser(checkpoint_file)
        config_dir = os.path.dirname(checkpoint_file)
        config_dir = os.path.expanduser(config_dir)
        config_path = os.path.join(config_dir, "params.pkl")
        if not os.path.exists(config_path):
            config_path = os.path.join(config_dir, "../params.pkl")
        if not os.path.exists(config_path):
            if not args.config:
                raise ValueError(
                    "Could not find params.pkl in either the checkpoint dir or "
                    "its parent directory.")

        with open(config_path, "rb") as f:
            config = pickle.load(f)

        if "num_workers" in config:
            config["num_workers"] = min(1, config["num_workers"])
        if "horizon" in config:
            del config["horizon"]

        # Stop all the actor noise
        config['evaluation_interval'] = 0
        config['exploration_enabled'] = False

        ray.init()

        cls = get_agent_class(args.run)
        agent = cls(env=args.env, config=config)
        agent.restore(checkpoint_file)
        return agent


    def run(args, parser):
        while True:
            result = self.kafka_consumer.poll()
            for partition, messages in result.items():
                for msg in messages:
                    observation = json.loads(msg.value)
                    action = self.agent.get_action(observation)
                    self._send_control_action(action)
                    


"""






"""
KAFKA_HOST = 'kafka-0.digitalpoints.io:19092'
NULL_ACTION = [0,0]
OBSERVATION_PUBLISH_TOPIC = 'sim.events.observation'
ODOM_PUBLISH_TOPIC = 'sim.events.odom'
ODOM_READ_TOPIC = 'robot.events.odom'
ACTION_READ_TOPIC = 'robot.commands.velocity'


class ObservationGenerator():

    def __init__(self, building_id, timestep=0.1):
        self.robot_ids = []
        self.timestep = timestep
        self.building_id = building_id
        self.kafka_producer = self._setup_kafka_producer(KAFKA_HOST)
        self._setup_simulator(building_id)

        self.action_buffer = {}
        self.action_received = {}
        for rid in self.robot_ids:
            self.action_buffer[rid] = NULL_ACTION
            self.action_received[rid] = time.time()


    def _setup_kafka_producer(self, bootstrap_servers):
        return KafkaProducer(bootstrap_servers=bootstrap_servers)


    def _setup_simulator(self, building_id):
        config = {
            'headless': True,
            'reset_on_target': False,
            'building_id': building_id,
        }
        # set self.robotsd

 
    def _publish_robot_odom(self, robot):
        state = robot.get_state()
        position = state["position"]
        orientation = state["orientation"]
        message = get_odom_message(robot_id, position, orientation)
        message = json.dumps(message).encode('utf-8')
        future = self.kafka_producer.send(ODOM_PUBLISH_TOPIC, message)
        logging.info(f"Sent {ODOM_PUBLISH_TOPIC} message for robot {robot.id}")


    def _publish_robot_observation(self, robot_id, observation):
        state = robot.get_state()
        position = state["position"]
        orientation = state["orientation"]
        message = get_odom_message(robot_id, position, orientation)
        message = json.dumps(message).encode('utf-8')
        future = self.kafka_producer.send(OBSERVATION_PUBLISH_TOPIC, message)
        logging.info(f"Sent {OBSERVATION_PUBLISH_TOPIC} message for robot %s"%robot_id)


    def _read_action_messages(self):
        robot_ids = [robot.id for robot in self.robots]
        result = self.kafka_consumer.poll()

        for partition, messages in result.items():
            for msg in messages:
                command = json.loads(msg.value)
                robot_id = command["robot"]["id"]
                linear_velocity = command["velocity"]["linear"]["x"]
                angular_velocity = command["velocity"]["angular"]["z"]
                action = (angular_velocity, linear_velocity)
                if robot_id in self.robot_ids:
                    self.action_buffer[robot_id] = action
                    self.action_received[robot_id] = time.time()
        # Stop robots after two timesteps
        for robot_id, delay in self.action_received.items():
            if delay > 2*self.timestep:
                self.action_buffer[robot_id] = NULL_ACTION


    def run_eval_loop(self, substep=0.1):
        substep = min(substep, self.timestep)
        while True:
            step_started = time.time()
            substep_started = time.time()
            self._read_action_messages()
            for robot_id in self.robots:
                action = self.action_buffer[robot_id]
                env = self.environment_map[robot_id]
                env.act(action)
                if time.time() - substep_started > substep:
                    substep_started = time.time()
                    self._publish_robot_odom(robot)
                    _publish_robot_observation      



    def run():       
        while True:
            for robot_id in self.robots:
                action = self.action_buffer[robot_id]
                env = self.environment_map[robot_id]
                env.act(action)
            
            # Read actions from Kafka while waiting for timestep to pass
            started = time.time()
            while time.time() - started < self.timestep:
                self._read_action_messages()
            
            # Publish observations
            for robot_id in self.robots:
                env = self.environment_map[robot_id]
                observation = env.observe()
                self._publish_robot_observation(observation)





            # Push robot position at about 20 Hz
            if steps%24==0:
                logging.info("Publishing robot state")
                self._publish_robot_states()

            # Try and maintain 240 FPS to match the bullet simulation speed
            duration = time.time()-start
            fps = steps/duration
            if fps<240:
                self.env.step()
                steps +=1
            if fps>240:
                time.sleep(max(0, steps/240-duration))
            if steps%240==0:
                logging.info("Current simulation speed  {:.3f}".format(fps))





class RobotController():
    Execute a learned policy. Takes the most recent observation from mobile robot,
    computes a response and sends it to the robot.
    def __init__(self, checkpoint_file):
        self.kafka_consumer = self._setup_kafka_consumer(KAFKA_HOST)
        self.kafka_producer = self._setup_kafka_producer(KAFKA_HOST)
        self.control_agent = self._setup_control_agent()


    def _setup_kafka_consumer(self, bootstrap_servers):
        topic = "robot.events.observation"
        return KafkaConsumer(topic, bootstrap_servers=bootstrap_servers)


    def _setup_kafka_producer(self, bootstrap_servers):
        return KafkaProducer(bootstrap_servers=bootstrap_servers)


    def _setup_control_agent(self, checkpoint_file):
        checkpoint_file = os.path.expanduser(checkpoint_file)
        config_dir = os.path.dirname(checkpoint_file)
        config_dir = os.path.expanduser(config_dir)
        config_path = os.path.join(config_dir, "params.pkl")
        if not os.path.exists(config_path):
            config_path = os.path.join(config_dir, "../params.pkl")
        if not os.path.exists(config_path):
            if not args.config:
                raise ValueError(
                    "Could not find params.pkl in either the checkpoint dir or "
                    "its parent directory.")

        with open(config_path, "rb") as f:
            config = pickle.load(f)

        if "num_workers" in config:
            config["num_workers"] = min(1, config["num_workers"])
        if "horizon" in config:
            del config["horizon"]

        # Stop all the actor noise
        config['evaluation_interval'] = 0
        config['exploration_enabled'] = False

        ray.init()

        cls = get_agent_class(args.run)
        agent = cls(env=args.env, config=config)
        agent.restore(checkpoint_file)
        return agent


    def run(args, parser):
        while True:
            result = self.kafka_consumer.poll()
            for partition, messages in result.items():
                for msg in messages:
                    observation = json.loads(msg.value)
                    action = self.agent.get_action(observation)
                    self._send_control_action(action)
"""                    











































