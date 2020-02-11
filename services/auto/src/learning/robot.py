import ray
import numpy as np
import tensorflow as tf
from ray.rllib.models import ModelCatalog
from ray.rllib.models.tf.tf_modelv2 import TFModelV2
from ray.rllib.utils import try_import_tf, try_import_tfp
from ray.rllib.agents.sac.sac_model import SACModel
from ray.rllib.models.tf.misc import flatten

MAP_MEAN = 4 
MAP_STD = 8
DIST_STD = 5


class Box():

    def __init__(self, shape):
        self.shape = shape


class RobotModel(SACModel):

    def __init__(self, obs_space, action_space, num_outputs, *args, **kwargs):
        super(RobotModel, self).__init__(obs_space, action_space, num_outputs, *args, **kwargs)

        obs_space = {
            "maps": Box((48,48)),
            "robot_theta": Box((1,)),
            "robot_velocity": Box((3,)),
            "target": Box((2,)),
            "ckpts": Box((4,2)),
        }

        maps_input = tf.keras.layers.Input(shape=obs_space["maps"].shape, dtype="float32", name="map")
        target_input = tf.keras.layers.Input(shape=obs_space["target"].shape, dtype="float32", name="target")
        robot_theta_input = tf.keras.layers.Input(shape=obs_space["robot_theta"].shape, dtype="float32", name="robot_theta")
        robot_velocity_input = tf.keras.layers.Input(shape=obs_space["robot_velocity"].shape, dtype="float32", name="robot_velocity")
        ckpt_input = tf.keras.layers.Input(shape=obs_space["ckpts"].shape, dtype="float32", name="ckpts")

        inputs = [
            maps_input,
            target_input,
            robot_theta_input,
            robot_velocity_input,
            ckpt_input,
        ]

        x = (maps_input - MAP_MEAN)/MAP_STD
        x = tf.keras.backend.expand_dims(x, -1)

        # Convolutional block
        x = tf.keras.layers.Conv2D(
            16,
            (3,3),
            strides=(1, 1),
            activation="relu",
            padding="same",
            name="conv1")(x)

        x = tf.keras.layers.BatchNormalization(momentum=0.999)(x)
        x = tf.keras.layers.MaxPooling2D(pool_size=(2, 2))(x)

        x = tf.keras.layers.Conv2D(
            32,
            (3,3),
            strides=(2, 2),
            activation="relu",
            padding="same",
            name="conv2")(x)

        x = tf.keras.layers.Conv2D(
            32,
            (3,3),
            strides=(1, 1),
            activation="relu",
            padding="same",
            name="conv3")(x)

        x = tf.keras.layers.BatchNormalization(momentum=0.999)(x)
        x = tf.keras.layers.MaxPooling2D(pool_size=(2, 2))(x)

        x = tf.keras.layers.Conv2D(
            32,
            (3,3),
            strides=(2, 2),
            activation="relu",
            padding="same",
            name="conv4")(x)

        x = tf.keras.layers.BatchNormalization(momentum=0.999)(x)
        x = flatten(x)
        metrics = x

        # Concatenate all inputs together
        sensors = [
            target_input/DIST_STD,
            robot_theta_input/DIST_STD,
            robot_velocity_input/DIST_STD,
            flatten(ckpt_input)/DIST_STD,
        ]

        x = tf.keras.layers.Concatenate(axis=-1, name="sensor_concat")(sensors+[x])
        x = tf.keras.layers.Dense(num_outputs-14)(x)
        x = tf.keras.layers.BatchNormalization(center=False, scale=False, momentum=0.999)(x)
        output_layer = tf.keras.layers.Concatenate(axis=-1, name="robot_concat")(sensors+[x])

        self.base_model = tf.keras.Model(inputs, [output_layer, metrics])
        self.register_variables(self.base_model.variables)
        #self.base_model.summary()
        

    def forward(self, input_dict, state, seq_lens=None):
        model_out, metrics = self.base_model([
            tf.cast(input_dict["obs"]["maps"], tf.float32),
            tf.cast(input_dict["obs"]["robot_theta"], tf.float32),
            tf.cast(input_dict["obs"]["robot_velocity"], tf.float32),
            tf.cast(input_dict["obs"]["target"], tf.float32),
            tf.cast(input_dict["obs"]["ckpts"], tf.float32),
        ])

        #print("IMAGE", tf.reduce_mean(metrics))
        ##print("OUT", tf.reduce_mean(model_out))
        #print("OUT ABS", tf.reduce_mean(tf.abs(model_out)))

        return model_out, state

    def policy_variables(self):
        return super().policy_variables()

    def q_variables(self):
        return self.base_model.variables + super().q_variables()

    #def metrics(self):
    #    return {
    #        'conv_mean': tf.reduce_mean(self.pooling),
    #        'conv_magnitude': tf.reduce_mean(tf.abs(self.pooling))
    #    }



