import numpy as np
import torch
import random
from torch import nn
from torch.nn import functional as F
from rlpyt.utils.tensor import infer_leading_dims, restore_leading_dims
from rlpyt.models.mlp import MlpModel
from rlpyt.utils.collections import namedarraytuple_like



class StateEncoder(torch.nn.Module):
    """
    Encode the state into a single vector
    """
    # Define the number of dimensions returned by 
    # the state encoder excluding the time and batch dimensions
    map_ndim = 2
    output_ndim = 1
    output_channels = 256
    input_sensor_channels = 14

    def __init__(self):
        super(StateEncoder, self).__init__()
        self.conv1 = nn.Conv2d(1, 8, kernel_size=3, padding=1)
        self.norm1 = nn.BatchNorm2d(num_features=8)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv2 = nn.Conv2d(8, 16, kernel_size=3, stride=2, padding=2)
        self.norm2 = nn.BatchNorm2d(num_features=16)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv3 = nn.Conv2d(16, 16, kernel_size=3, padding=1)
        self.norm3 = nn.BatchNorm2d(num_features=16)
        #self.norm_state = nn.BatchNorm1d(num_features=158, momentum=0.001, affine=False)
        self.dense_state = nn.Linear(158, self.output_channels - self.input_sensor_channels)

    def normalize_observation(self, observation):
        MAP_MEAN = 2
        MAP_SCALE = 10
        DIST_SCALE = 5
        ANGLE_SCALE = 3
        VELOCITY_SCALE = 0.1
        ObservationCls = namedarraytuple_like(observation)
        # Scale all variables to mean=0 and std=1
        return ObservationCls(
            maps=(observation.maps - MAP_MEAN)/MAP_SCALE,
            ckpts=observation.ckpts/DIST_SCALE,
            target=observation.target/DIST_SCALE,
            robot_theta=observation.robot_theta/ANGLE_SCALE,
            robot_velocity=observation.robot_velocity/VELOCITY_SCALE,
        )

    def forward(self, observation, prev_action, prev_reward):
        lead_dim, T, B, _ = infer_leading_dims(observation.maps, self.map_ndim)
        assert T==1
        observation = self.normalize_observation(observation)
        x = observation.maps.view(T*B, 1, 48, 48)
        x = self.pool(F.relu(self.conv1(x)))
        x = self.norm1(x)
        x = self.pool(F.relu(self.conv2(x)))
        x = self.pool(F.relu(self.conv3(x)))
        x = self.norm3(x)
        x = x.view(T*B, -1)
        
        sensors = torch.cat([
            observation.ckpts.view(T*B,-1),
            observation.target.view(T*B,-1),
            observation.robot_theta.view(T*B,-1),
            observation.robot_velocity.view(T*B,-1)
        ], dim=1)

        if random.random()<0.001:
            print("Conv mean,std:", torch.abs(torch.mean(x)).item(), torch.std(x).item())
            print("Sensor mean,std:", torch.abs(torch.mean(sensors)).item(), torch.std(sensors).item())

        x = torch.cat([x, sensors], dim=1)
        x = F.relu(self.dense_state(x))
        x = torch.cat([x, sensors], dim=1)

        x = restore_leading_dims(x, lead_dim, T, B)
        return x



class PiModel(torch.nn.Module):
    """
    Policy Model
    - MLP model with 128 channel state input
    - State encoder is not trainable
    """
    def __init__(
            self,
            observation_shape,
            hidden_sizes,
            action_size,
            state_encoder,
            ):
        super().__init__()

        self.state_encoder = state_encoder
        self.obs_ndim = self.state_encoder.output_ndim
        self._action_size = action_size
        self.mlp = MlpModel(
            input_size=state_encoder.output_channels,
            hidden_sizes=hidden_sizes,
            output_size=action_size * 2,
        )

    def forward(self, observation, prev_action, prev_reward):
        observation = self.state_encoder(observation,  prev_action, prev_reward)
        #observation = observation.detach() # Disable encoder gradient
        lead_dim, T, B, _ = infer_leading_dims(observation, self.obs_ndim)
        output = self.mlp(observation.view(T * B, -1))
        mu, log_std = output[:, :self._action_size], output[:, self._action_size:]
        mu, log_std = restore_leading_dims((mu, log_std), lead_dim, T, B)
        return mu, log_std


class QofMuModel(torch.nn.Module):
    """
    Q Model
    - MLP model with 128 channel state input
    - State encoder is trainable
    """

    def __init__(
            self,
            observation_shape,
            hidden_sizes,
            action_size,
            state_encoder,
            ):
        super().__init__()

        self.state_encoder = state_encoder
        self.obs_ndim = self.state_encoder.output_ndim
        
        self.mlp = MlpModel(
            input_size=state_encoder.output_channels + action_size,
            hidden_sizes=hidden_sizes,
            output_size=1,
        )

    def forward(self, observation, prev_action, prev_reward, action):
        observation = self.state_encoder(observation,  prev_action, prev_reward)
        lead_dim, T, B, _ = infer_leading_dims(observation, self.obs_ndim)
        q_input = torch.cat(
            [observation.view(T * B, -1), action.view(T * B, -1)], dim=1)
        q = self.mlp(q_input).squeeze(-1)
        q = restore_leading_dims(q, lead_dim, T, B)
        return q

