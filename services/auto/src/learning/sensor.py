import ray
import random
import numpy as np
import tensorflow as tf
from ray.rllib.models import ModelCatalog
from ray.rllib.models.tf.tf_modelv2 import TFModelV2
from ray.rllib.utils import try_import_tf, try_import_tfp
from ray.rllib.models.tf.misc import flatten
from agents.sacq.sacq_model import SACQModel

POINTCLOUD_MEAN = 4
POINTCLOUD_STD = 4
DIST_STD = 5
ANGLE_STD = 3
VELOCITY_STD = 0.1


class Box():

    def __init__(self, shape):
        self.shape = shape


class SensorModel(SACQModel):

    def __init__(self, obs_space, action_space, num_outputs, *args, **kwargs):
        super().__init__(obs_space, action_space, num_outputs, *args, **kwargs)

        obs_space = {
            "pointcloud": Box((12,)),
            "robot_theta": Box((1,)),
            "robot_velocity": Box((3,)),
            "target": Box((2,)),
            "ckpts": Box((4,2)),
        }

        pointcloud_input = tf.keras.layers.Input(shape=obs_space["pointcloud"].shape, dtype="float32", name="pointcloud")
        target_input = tf.keras.layers.Input(shape=obs_space["target"].shape, dtype="float32", name="target")
        robot_theta_input = tf.keras.layers.Input(shape=obs_space["robot_theta"].shape, dtype="float32", name="robot_theta")
        robot_velocity_input = tf.keras.layers.Input(shape=obs_space["robot_velocity"].shape, dtype="float32", name="robot_velocity")
        ckpt_input = tf.keras.layers.Input(shape=obs_space["ckpts"].shape, dtype="float32", name="ckpts")

        inputs = [
            pointcloud_input,
            robot_theta_input,
            robot_velocity_input,
            target_input,
            ckpt_input,
        ]

        # Flatten layers that have structure
        ckpt = tf.keras.layers.Flatten()(ckpt_input)

        # Noise
        pointcloud = tf.keras.layers.GaussianNoise(stddev=0.01)(pointcloud_input)
        robot_velocity = tf.keras.layers.GaussianNoise(stddev=0.0001)(robot_velocity_input)
        robot_theta = tf.keras.layers.GaussianNoise(stddev=0.01)(target_input)
        target = tf.keras.layers.GaussianNoise(stddev=0.01)(target_input)
        ckpt = tf.keras.layers.GaussianNoise(stddev=0.01)(ckpt)

        # Concatenate all inputs together
        sensors = [
            (pointcloud-POINTCLOUD_MEAN)/POINTCLOUD_STD,
            robot_theta/ANGLE_STD,
            robot_velocity/VELOCITY_STD,
            target/DIST_STD,
            ckpt/DIST_STD,
        ]

        # Layers
        num_sensors = np.sum([tensor.shape[-1] for tensor in sensors])
        x = tf.keras.layers.Concatenate(axis=-1, name="sensor_input")(sensors)
        x = tf.keras.layers.Dense(num_outputs - num_sensors)(x)
        x = tf.keras.layers.LayerNormalization()(x)
        x = tf.keras.layers.Concatenate(axis=-1, name="sensor_concat")(sensors+[x])
        output_layer = x

        # Metrics to print
        metrics = [
            tf.reduce_mean(x),
            tf.math.reduce_std(x),
            tf.reduce_mean(output_layer),
            tf.math.reduce_std(output_layer),
            tf.math.reduce_std(robot_velocity)
        ]

        self.base_model = tf.keras.Model(inputs, [output_layer, metrics])
        self.register_variables(self.base_model.variables)
        #self.base_model.summary()


    def forward(self, input_dict, state, seq_lens=None):
        model_out, metrics = self.base_model([
            tf.cast(input_dict["obs"]["pointcloud"], tf.float32),
            tf.cast(input_dict["obs"]["robot_theta"], tf.float32),
            tf.cast(input_dict["obs"]["robot_velocity"], tf.float32),
            tf.cast(input_dict["obs"]["target"], tf.float32),
            tf.cast(input_dict["obs"]["ckpts"], tf.float32),
        ])

        if random.random() > 0.99:
            print("x mean:", metrics[0]),
            print("x std:", metrics[1]),
            print("out mean:", metrics[2]),
            print("out std:", metrics[3])
            print("velocity std:", metrics[3])

        return model_out, state


    def policy_variables(self):
        return super().policy_variables()


    def q_variables(self):
        return self.base_model.variables + super().q_variables()




