import numpy as np
import torch
from torch import nn
from torch.nn import functional as F
from rlpyt.utils.tensor import infer_leading_dims, restore_leading_dims
from rlpyt.models.mlp import MlpModel


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
        self.conv1 = nn.Conv2d(1, 6, kernel_size=3)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv2 = nn.Conv2d(6, 16, kernel_size=3)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv3 = nn.Conv2d(16, 32, kernel_size=3)
        #self.fc1 = nn.Linear(16 * 5 * 5, 120)
        #self.fc2 = nn.Linear(120, 84)
        #self.fc3 = nn.Linear(84, 10)

    def forward(self, observation, prev_action, prev_reward):
        lead_dim, T, B, _ = infer_leading_dims(observation.maps, self.map_ndim)
        x = observation.maps.view(B, 1, 48, 48)
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = self.pool(F.relu(self.conv3(x)))
        x = x.view(B, -1)
        
        sensors = torch.cat([
            observation.ckpts.view(B,-1),
            observation.target.view(B,-1),
            observation.robot_theta.view(B,-1),
            observation.robot_velocity.view(B,-1)
        ], dim=1)
        x = torch.cat([x,sensors], dim=1)
        x = x.view(B, -1)
        return x



class PiMlpModel(torch.nn.Module):

    def __init__(
            self,
            observation_shape,
            hidden_sizes,
            action_size,
            ):
        super().__init__()

        self.encoder = StateEncoder()
        self.obs_ndim = self.encoder.output_ndim
        self._action_size = action_size
        self.mlp = MlpModel(
            input_size=526,
            hidden_sizes=hidden_sizes,
            output_size=action_size * 2,
        )

    def forward(self, observation, prev_action, prev_reward):
        observation = self.encoder(observation,  prev_action, prev_reward)
        lead_dim, T, B, _ = infer_leading_dims(observation, self.obs_ndim)
        output = self.mlp(observation.view(T * B, -1))
        mu, log_std = output[:, :self._action_size], output[:, self._action_size:]
        mu, log_std = restore_leading_dims((mu, log_std), lead_dim, T, B)
        return mu, log_std


class QofMuMlpModel(torch.nn.Module):

    def __init__(
            self,
            observation_shape,
            hidden_sizes,
            action_size,
            ):
        super().__init__()

        self.encoder = StateEncoder()
        self.obs_ndim = self.encoder.output_ndim
        self.mlp = MlpModel(
            input_size=526 + action_size,
            hidden_sizes=hidden_sizes,
            output_size=1,
        )

    def forward(self, observation, prev_action, prev_reward, action):
        observation = self.encoder(observation,  prev_action, prev_reward)
        lead_dim, T, B, _ = infer_leading_dims(observation, self.obs_ndim)
        q_input = torch.cat(
            [observation.view(T * B, -1), action.view(T * B, -1)], dim=1)
        q = self.mlp(q_input).squeeze(-1)
        q = restore_leading_dims(q, lead_dim, T, B)
        return q

