"""
# Start both processes at the same time
python main.py --robots=4 --send&\
python main.py --robots=4 --receive
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
import uuid
from graphqlclient import GraphQLClient
from graphql import getCurrentGeometry
from kafka import KafkaProducer, KafkaConsumer
from messages import get_odom_message

logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)

parser = argparse.ArgumentParser(description='Simulate robot movement.')
parser.add_argument('--debug', action='store_true', help='Print logging data')
parser.add_argument('--send', action='store_true', help='Send messages to the cluster')
parser.add_argument('--receive', action='store_true', help='Receive messages from the cluster')
parser.add_argument('--robots', type=int, help='Number of robots')



class LatencyTest():
    """
    Simulate physics using the model geometry.
    Pulls Model Geometry from GraphQL API, continuously run physics simulations

    Listens to control commands for each object in Kafka
    Publishes updated object locations to Kafka
    """


    def __init__(self, config, num_robots=4, debug=False):
        self.debug = debug
        self.graphql_endpoint = config["API"]["host"]
        self.geometry_endpoint = config["Geometry"]["host"]
        self.graphql_client = GraphQLClient(self.graphql_endpoint)
        self.kafka_consumer = self._setup_kafka_consumer(config["Kafka"]["host"])
        self.kafka_producer = self._setup_kafka_producer(config["Kafka"]["host"])
        self.robots = [str(uuid.uuid1()) for i in range(num_robots)]

    def _setup_kafka_consumer(self, bootstrap_servers):
        topic = "tests.robot.position"
        return KafkaConsumer(topic, bootstrap_servers=bootstrap_servers)

    def _setup_kafka_producer(self, bootstrap_servers):
        return KafkaProducer(bootstrap_servers=bootstrap_servers)


    def _publish_robot_states(self):
        for robot_id in self.robots:
            position = [0,0,0]
            orientation = [0,0,0,1]
            message = get_odom_message(robot_id, position, orientation)
            message['sent'] = time.time()
            message = json.dumps(message).encode('utf-8')
            future = self.kafka_producer.send('tests.robot.position', message)
            if self.debug:
                logging.info("Sent robot.events.odom message for robot %s"%robot_id)


    def send(self):
        logging.info("\n\n --- Starting send loop --- \n")
        started = time.time()
        while (time.time() - started)<10:
            self._publish_robot_states()
            time.sleep(0.1)


    def receive(self):
        n = 0
        latency = 0
        started = time.time()
        logging.info("\n\n --- Starting receive loop --- \n")
        while (time.time() - started)<10:
            result = self.kafka_consumer.poll()
            for partition, messages in result.items():
                for msg in messages:
                    data = json.loads(msg.value)
                    sent_time = data['sent']
                    duration = time.time()-sent_time
                    if duration>0.1:
                        print(".", end="")
                        continue
                    n+=1
                    latency+=duration
        print("-------------------------------")
        print("Total messages:", n)
        print("Average latency", latency/n)
        print("-------------------------------")

if __name__=="__main__":
    args = parser.parse_args()
    with open('config.yaml') as cfg:
        config = yaml.load(cfg, Loader=yaml.Loader)
    tester = LatencyTest(config, num_robots=args.robots, debug=args.debug)
    if args.send:
        tester.send()
    if args.receive:
        tester.receive()




