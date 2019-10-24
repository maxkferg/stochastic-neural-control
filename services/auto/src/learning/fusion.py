import ray
import tensorflow as tf
from ray.rllib.models import ModelCatalog
from ray.rllib.models.tf.tf_modelv2 import TFModelV2

class Box():

    def __init__(self, shape):
        self.shape = shape


class FusionModel(TFModelV2):

    def __init__(self, obs, obs_space, action_space, num_outputs, config, name=None, state_in=None, seq_lens=None):
        super(FusionModel, self).__init__(obs, obs_space, action_space, num_outputs, config)
        #activation = get_activation_fn(model_config.get("conv_activation"))
        #filters = model_config.get("conv_filters")

        obs_space = {
            "map": Box((48,48,1)),
            "robot_theta": Box((2,)),
            "robot_velocity": Box((2,)),
            "target": Box((10,)),
            "ckpts": Box((10,)),
        }


        inputs = [
            tf.keras.layers.Input(shape=obs_space["map"].shape, name="map"),
            tf.keras.layers.Input(shape=obs_space["robot_theta"].shape, name="robot_theta"),
            tf.keras.layers.Input(shape=obs_space["robot_velocity"].shape, name="robot_velocity"),
            tf.keras.layers.Input(shape=obs_space["target"].shape, name="target"),
            tf.keras.layers.Input(shape=obs_space["ckpts"].shape, name="ckpts"),
        ]

        # Convolutional block
        x = tf.keras.layers.Conv2D(
            16,
            (3,3),
            strides=(1, 1),
            activation="relu",
            padding="same",
            name="conv1")(inputs[0])

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

        x = tf.keras.layers.Conv2D(
            32,
            (3,3),
            strides=(2, 2),
            activation="relu",
            padding="same",
            name="conv4")(x)

        x = tf.keras.layers.Flatten()(x)

        # Concatenate all inputs together
        x = tf.keras.layers.Concatenate(axis=-1)(
            [x] + inputs[1:]
        )

        hidden_layer = tf.keras.layers.Dense(128, activation="relu")(x)
        output_layer = tf.keras.layers.Dense(128, activation=None)(hidden_layer)
        value_layer = tf.keras.layers.Dense(1, activation=None)(hidden_layer)

        self.base_model = tf.keras.Model(inputs, [output_layer, value_layer])
        self.register_variables(self.base_model.variables)
        self.outputs = self.base_model.outputs
        self.last_layer = output_layer
        self.state_out = state_in


    def _validate_output_shape(self):
        print("Outputs:", self.outputs)

    """
    def forward(self, input_dict, state, seq_lens):
        # explicit cast to float32 needed in eager
        model_out, self._value_out = self.base_model([
            tf.cast(input_dict["map"], tf.float32),
            tf.cast(input_dict["robot_theta"], tf.float32),
            tf.cast(input_dict["robot_velocity"], tf.float32),
            tf.cast(input_dict["target"], tf.float32),
            tf.cast(input_dict["ckpts"], tf.float32),
        ])
        return tf.squeeze(model_out, axis=[1, 2]), state


    def value_function(self):
        return tf.reshape(self._value_out, [-1])
    """