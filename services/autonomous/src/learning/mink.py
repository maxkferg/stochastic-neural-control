import tensorflow as tf
from ray.rllib.models import Model


class MinkModel(Model):
    def _build_layers_v2(self, input_dict, num_outputs, options):
        """Define the layers of a custom model.

        Arguments:
            input_dict (dict): Dictionary of input tensors, including "obs",
                "prev_action", "prev_reward", "is_training".
            num_outputs (int): Output tensor must be of size
                [BATCH_SIZE, num_outputs].
            options (dict): Model options.

        Returns:
            (outputs, feature_layer): Tensors of size [BATCH_SIZE, num_outputs]
                and [BATCH_SIZE, desired_feature_size].

        When using dict or tuple observation spaces, you can access
        the nested sub-observation batches here as well:

        Examples:
            >>> print(input_dict)
            {'prev_actions': <tf.Tensor shape=(?,) dtype=int64>,
             'prev_rewards': <tf.Tensor shape=(?,) dtype=float32>,
             'is_training': <tf.Tensor shape=(), dtype=bool>,
             'obs': OrderedDict([
                ('sensors', OrderedDict([
                    ('front_cam', [
                        <tf.Tensor shape=(?, 10, 10, 3) dtype=float32>,
                        <tf.Tensor shape=(?, 10, 10, 3) dtype=float32>]),
                    ('position', <tf.Tensor shape=(?, 3) dtype=float32>),
                    ('velocity', <tf.Tensor shape=(?, 3) dtype=float32>)]))])}
        """
        obs = input_dict["obs"]
        #self.summarize_observation(obs)

        # Convolutional block
        scale = 255
        x = tf.expand_dims(obs['maps'], -1)
        x = x/scale
        x = tf.keras.layers.Conv2D(
            16,
            (3,3),
            strides=(2, 2),
            activation="relu",
            padding="same",
            name="mink_conv1")(x)

        x = tf.keras.layers.BatchNormalization(name="mink_bn1")(x)

        x = tf.keras.layers.Conv2D(
            32,
            (3,3),
            strides=(2, 2),
            activation="relu",
            padding="same",
            name="mink_conv2")(x)

        x = tf.keras.layers.MaxPooling2D(
            pool_size=(2, 2),
            name="pooling")(x)

        x = tf.keras.layers.Conv2D(
            32,
            (3,3),
            strides=(1, 1),
            activation="relu",
            padding="same",
            name="mink_conv3")(x)

        x = tf.keras.layers.Conv2D(
            32,
            (3,3),
            strides=(2, 2),
            activation="relu",
            padding="same",
            name="mink_conv4")(x)

        x = tf.keras.layers.BatchNormalization(name="mink_bn2")(x)
        x = tf.keras.layers.Flatten(name="mink_flatten")(x)
        ckpts = tf.keras.layers.Flatten(name="ckpts_flatten")(obs['ckpts'])

        # Concatenate all inputs together
        x = tf.keras.layers.Concatenate(axis=-1, name="mink_cat")([
            x,
            obs['target'],
            obs['robot_theta'],
            obs['robot_velocity'],
            ckpts
        ])

        x = tf.keras.layers.Dense(256, activation="relu", name="mink_last")(x)
        last_layer = x#tf.keras.layers.BatchNormalization(name="mink_bn3")(x)
        output_layer = tf.keras.layers.Dense(num_outputs, activation=None, name="mink_out")(last_layer)

        return output_layer, last_layer


    def summarize_observation(self, obs):
        tf.summary.scalar("maps/max",
            tf.reduce_max(obs["maps"]))

        tf.summary.scalar("maps/min",
            tf.reduce_min(obs["maps"]))

        tf.summary.scalar("maps/mean",
            tf.reduce_min(obs["maps"]))

        tf.summary.scalar("robot_theta/mean",
            tf.reduce_min(obs["robot_theta"]))

        tf.summary.scalar("robot_velocity/mean",
            tf.reduce_min(obs["robot_velocity"]))

        tf.summary.scalar("target/mean",
            tf.reduce_min(obs["target"]))

        tf.summary.scalar("ckpts/mean",
            tf.reduce_min(obs["ckpts"]))


    def custom_stats(self):
        stats = {
            "action_min": tf.reduce_min(self.output_actions),
            "action_max": tf.reduce_max(self.output_actions),
            "action_norm": tf.norm(self.output_actions),
            "critic_loss": tf.reduce_mean(self.critic_loss),
            "actor_loss": tf.reduce_mean(self.actor_loss),
            "td_error": tf.reduce_mean(self.td_error)
        }
        print("custom stats",stats)
        return stats

