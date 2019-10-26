import numpy as np
import torch
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


    def __init__(self):
        super(StateEncoder, self).__init__()
        self.conv1 = nn.Conv2d(1, 8, kernel_size=3, padding=1)
        self.norm1 = nn.GroupNorm(num_groups=2, num_channels=8)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv2 = nn.Conv2d(8, 16, kernel_size=3, padding=1)
        self.norm2 = nn.GroupNorm(num_groups=4, num_channels=16)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv3 = nn.Conv2d(16, 16, kernel_size=3, padding=1)
        self.norm3 = nn.GroupNorm(num_groups=4, num_channels=16)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv4 = nn.Conv2d(16, 16, kernel_size=3, padding=1)
        self.norm4 = nn.GroupNorm(num_groups=4, num_channels=16)

    def normalize_observation(self, observation):
        MAP_MEAN = 2
        MAP_SCALE = 10
        DIST_SCALE = 6
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
        x = self.pool(F.relu(self.conv4(x)))
        x = self.norm4(x)
        x = x.view(T*B, -1)
        
        sensors = torch.cat([
            observation.ckpts.view(T*B,-1),
            observation.target.view(T*B,-1),
            observation.robot_theta.view(T*B,-1),
            observation.robot_velocity.view(T*B,-1)
        ], dim=1)

        x = torch.cat([x, sensors], dim=1)
        x = restore_leading_dims(x, lead_dim, T, B)
        return x



class PiModel(torch.nn.Module):
    """
    Policy Model
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
            input_size=158,
            hidden_sizes=hidden_sizes,
            output_size=action_size * 2,
        )

    def forward(self, observation, prev_action, prev_reward):
        observation = self.state_encoder(observation,  prev_action, prev_reward)
        observation = observation.detach() # Disable encoder gradient
        lead_dim, T, B, _ = infer_leading_dims(observation, self.obs_ndim)
        output = self.mlp(observation.view(T * B, -1))
        mu, log_std = output[:, :self._action_size], output[:, self._action_size:]
        mu, log_std = restore_leading_dims((mu, log_std), lead_dim, T, B)
        return mu, log_std


class QofMuModel(torch.nn.Module):
    """
    Q Model
    """

    def __init__(
            self,
            observation_shape,
            hidden_sizes,
            action_size,
            state_encoder,
            ):
        super().__init__()

        with torch.no_grad():
            self.state_encoder = state_encoder
            self.obs_ndim = self.state_encoder.output_ndim
        
        self.mlp = MlpModel(
            input_size=158 + action_size,
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

