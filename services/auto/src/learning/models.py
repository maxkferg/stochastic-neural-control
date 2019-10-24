import numpy as np
import torch
from rlpyt.utils.tensor import infer_leading_dims, restore_leading_dims
from rlpyt.models.mlp import MlpModel


class PiMlpModel(torch.nn.Module):

    def __init__(
            self,
            observation_shape,
            hidden_sizes,
            action_size,
            ):
        super().__init__()
        self._obs_ndim = len(observation_shape)
        self._action_size = action_size
        self.mlp = MlpModel(
            input_size=8,
            hidden_sizes=hidden_sizes,
            output_size=action_size * 2,
        )

    def forward(self, observation, prev_action, prev_reward):
        observation = observation.ckpts
        #obs_ndim = self._obs_ndim
        obs_ndim = len(observation.shape)
        lead_dim, T, B, _ = infer_leading_dims(observation, obs_ndim)
        output = self.mlp(observation.view(T * B, -1))
        mu, log_std = output[:, :self._action_size], output[:, self._action_size:]
        mu, log_std = restore_leading_dims((mu, log_std), lead_dim, T, B)
        mu = torch.unsqueeze(mu,dim=0)
        log_std = torch.unsqueeze(log_std,dim=0)
        return mu, log_std


class QofMuMlpModel(torch.nn.Module):

    def __init__(
            self,
            observation_shape,
            hidden_sizes,
            action_size,
            ):
        super().__init__()
        self._obs_ndim = len(observation_shape)
        self.mlp = MlpModel(
            input_size=8 + action_size,
            hidden_sizes=hidden_sizes,
            output_size=1,
        )

    def forward(self, observation, prev_action, prev_reward, action):
        observation = observation.ckpts
        obs_ndim = len(observation.shape)
        lead_dim, T, B, _ = infer_leading_dims(observation,
            obs_ndim)
        q_input = torch.cat(
            [observation.view(T * B, -1), action.view(T * B, -1)], dim=1)
        q = self.mlp(q_input).squeeze(-1)
        q = restore_leading_dims(q, lead_dim, T, B)
        return q

