from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

from ray.rllib.agents.dqn.apex import APEX_TRAINER_PROPERTIES
from ray.rllib.agents.sac.sac import SACTrainer
from ray.rllib.agents.sac.sac import DEFAULT_CONFIG as SAC_CONFIG
from ray.rllib.utils import merge_dicts

APEX_SAC_DEFAULT_CONFIG = merge_dicts(
    SAC_CONFIG,  # see also the options in ddpg.py, which are also supported
    {
        "optimizer": merge_dicts(
            SAC_CONFIG["optimizer"], {
                "max_weight_sync_delay": 400,
                "num_replay_buffer_shards": 4,
                "debug": False
            }),
        "num_gpus": 0,
        "num_workers": 32,
        "buffer_size": 2000000,
        "learning_starts": 50000,
        "train_batch_size": 512,
        "sample_batch_size": 50,
        "target_network_update_freq": 500000,
        "timesteps_per_iteration": 25000,
        "per_worker_exploration": True,
        "worker_side_prioritization": True,
        "min_iter_time_s": 30,
    },
)

ApexSACTrainer = SACTrainer.with_updates(
    name="APEX_SAC",
    default_config=APEX_SAC_DEFAULT_CONFIG,
    **APEX_TRAINER_PROPERTIES)