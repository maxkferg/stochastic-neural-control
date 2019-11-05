from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

from agents.sacq.sacq import SACQTrainer, DEFAULT_CONFIG
from ray.rllib.utils import renamed_agent

SACQAgent = renamed_agent(SACQTrainer)

__all__ = [
    "SACQTrainer",
    "DEFAULT_CONFIG",
]