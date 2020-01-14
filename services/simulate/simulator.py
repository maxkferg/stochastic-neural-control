import os
import math
import time
import json
import urllib
import shutil
import logging
import pybullet
from kafka import KafkaProducer, KafkaConsumer
from environment.core.env.base import BaseEnvironment
from environment.core.robots.robot_models import Turtlebot
from environment.core.robots.robot_messages import get_odom_message


logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)

KAFKA_ACTION_TOPIC = "robot.commands.velocity"
KAFKA_GROUP_NAME = "Simulator Service"
NULL_ACTION = [0,0]
MAX_ACTION_LIFE = 0.3 # seconds


class Simulator():
    """
    Simulate physics using the model geometry.
    Pulls Model Geometry from GraphQL API, continuously run physics simulations

    Listens to control commands for each object in Kafka
    Publishes updated object locations to Kafka
    """
    def __init__(self, config, timestep=0.1):
        self.robots = {}
        self.timestep = timestep
        self.kafka_producer = self._setup_kafka_producer(config["Kafka"]["host"])
        self.kafka_consumer = self._setup_kafka_consumer(config["Kafka"]["host"])
        self.kafka_consumer.poll()
        self.kafka_consumer.seek_to_end()
        logging.info("Created TurtleBot Simulator:")
        logging.info(json.dumps(config, indent=2))
        self.env = BaseEnvironment(config=config)
        self.env.start()
        self.action_repeat = int(self.timestep / self.env.timestep)
        logging.info("Using base timestep %.3f"%self.env.timestep)
        logging.info("Using action_repeat %i"%self.action_repeat)
        for robot in self.env.robots:
            self.robots[robot.id] = robot


    def _setup_kafka_consumer(self, bootstrap_servers):
        return KafkaConsumer(KAFKA_ACTION_TOPIC,
            bootstrap_servers=bootstrap_servers,
            group_id=KAFKA_GROUP_NAME)


    def _setup_kafka_producer(self, bootstrap_servers):
        return KafkaProducer(bootstrap_servers=bootstrap_servers)


    def _publish_robot_states(self):
        for robot_id, robot in self.robots.items():
            state = robot.get_state()
            position = state["position"]
            orientation = state["orientation"]
            message = get_odom_message(robot_id, position, orientation)
            message = json.dumps(message).encode('utf-8')
            future = self.kafka_producer.send('robot.events.odom', message)
            logging.info("Sent robot.events.odom message for robot %s"%robot_id)


    def run_sync(self):
        logging.info("\n\n --- Starting simulation loop (sync) --- \n")
        linear_velocity = 0
        angular_velocity = 0
        last_message_time = {}
        start = time.time()
        steps = 0

        while True:
            result = self.kafka_consumer.poll()
            for partition, messages in result.items():
                for msg in messages:
                    command = json.loads(msg.value)
                    robot_id = command["robot"]["id"]
                    linear_velocity = command["velocity"]["linear"]["x"]
                    angular_velocity = command["velocity"]["angular"]["z"]
                    action = (angular_velocity, linear_velocity)
                    last_message_time[robot_id] = time.time()
                    if not robot_id in self.robots:
                        logging.error("No robot with id %s"%robot_id)
                    else:
                        robot = self.robots[robot_id]
                        robot.applyAction(action)
                        logging.info("Robot {} action {}".format(robot_id, action))

            # Stop moving the robot if messages are not flowing
            for robot_id in self.robots:
                last_message_received = last_message_time.get(robot_id, 0)
                if time.time() - last_message_received > MAX_ACTION_LIFE:
                    robot = self.robots[robot_id]
                    robot.applyAction(NULL_ACTION)

            for i in range(self.action_repeat):
                self.env.step()
                self._publish_robot_states()
                print(".", end="", flush=True)
            print()
            steps += 1
            time.sleep(0.1)


    def run(self):
        self.run_sync()


    def _run(self):
        logging.info("\n\n --- Starting simulation loop --- \n")
        linear_velocity = 0
        angular_velocity = 0
        last_message_time = {}
        start = time.time()
        steps = 0

        while True:
            result = self.kafka_consumer.poll()
            for partition, messages in result.items():
                for msg in messages:
                    command = json.loads(msg.value)
                    robot_id = command["robot"]["id"]
                    linear_velocity = command["velocity"]["linear"]["x"]
                    angular_velocity = command["velocity"]["angular"]["z"]
                    action = (angular_velocity, linear_velocity)
                    last_message_time[robot_id] = time.time()
                    if not robot_id in self.robots:
                        logging.error("No robot with id %s"%robot_id)
                    else:
                        robot = self.robots[robot_id]
                        robot.applyAction(action)
                        logging.info("Robot {} action {}".format(robot_id, action))

            # Stop moving the robot if messages are not flowing
            for robot_id in self.robots:
                last_message_received = last_message_time.get(robot_id, 0)
                if time.time() - last_message_received > MAX_ACTION_LIFE:
                    robot = self.robots[robot_id]
                    robot.applyAction(NULL_ACTION)

            for i in self.action_repeat:
                self.env.step()
                print(".", end="", flush=True)
            steps+=1

            # Push robot position at about 20 Hz
            if steps%24==0:
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




