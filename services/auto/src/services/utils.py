import os
import math
import time
import yaml
import json
import urllib
import shutil
import logging
import argparse
import numpy as np
from kafka import KafkaProducer, KafkaConsumer

logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)



class KafkaBuffer():
    """
    Keep track of the last message in a Kafka stream
    Only tracks messages for @robot_ids
    """
    def __init__(self, topic, robot_ids, kafka_host, kafka_group_name):
        self.topic = topic
        self.robot_ids = robot_ids
        self.msg_buffer = {}
        self.msg_received = {}
        self.consumer = KafkaConsumer(topic,
            bootstrap_servers=kafka_host,
            group_id=kafka_group_name)
        # Seek to the end of the kafka stream
        self.consumer.poll()
        self.consumer.seek_to_end()


    def get_last_message(self, robot_id):
        """
        Return the last message for a robot
        """
        if robot_id not in self.msg_buffer:
            raise ValueError(f"No data for robot {robot_id} on {self.topic}")
        lag = time.time() - self.msg_received[robot_id]
        if lag > 10:
            logging.warn(f"Data for {robot_id} is {lag:i} seconds old")
        return self.msg_buffer[robot_id], lag


    def tick(self):
        result = self.consumer.poll()
        for partition, messages in result.items():
            for msg in messages:
                message = json.loads(msg.value)
                robot_id = message["robot"]["id"]
                if robot_id in self.robot_ids:
                    self.msg_buffer[robot_id] = message
                    self.msg_received[robot_id] = time.time()



class NumpyEncoder(json.JSONEncoder):
    """
    Keep track of the last message in a Kafka stream
    Only trackes messages for @robot_ids
    """
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.bool_):
            return bool(obj)
        return json.JSONEncoder.default(self, obj)

