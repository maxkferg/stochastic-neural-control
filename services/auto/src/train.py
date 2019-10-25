
"""
Runs one instance of the environment and optimizes using the Soft Actor
Critic algorithm. Can use a GPU for the agent (applies to both sample and
train). No parallelism employed, everything happens in one python process; can
be easier to debug.

Example Usage:

python train.py --cuda_idx=0

"""
from rlpyt.envs.gym import make as gym_make
from rlpyt.utils.launching.affinity import encode_affinity
from rlpyt.utils.launching.affinity import affinity_from_code
from rlpyt.samplers.parallel.cpu.sampler import CpuSampler
from rlpyt.algos.qpg.sac import SAC
from rlpyt.agents.qpg.sac_agent import SacAgent
from rlpyt.runners.minibatch_rl import MinibatchRlEval
from rlpyt.runners.async_rl import AsyncRlEval
from rlpyt.utils.logging.context import logger_context
from gym.envs.registration import register
from learning.models import PiMlpModel
from learning.models import QofMuMlpModel


register(
    id='Seeker-v0',
    entry_point='environment.env.simple:SimpleEnvironment',
)

def build_and_train(env_id="Seeker-v0", run_ID=0, cuda_idx=None):
    env_config = dict(
        headless=True
    )

    eval_env_config = dict(
        headless=True
    )
 
    sampler = CpuSampler(
        EnvCls=gym_make,
        env_kwargs=dict(id=env_id, config=env_config),
        eval_env_kwargs=dict(id=env_id, config=eval_env_config),
        batch_T=1,  # One time-step per sampler iteration.
        batch_B=1,  # One environment (i.e. sampler Batch dimension).
        max_decorrelation_steps=0,
        eval_n_envs=4,
        eval_max_steps=int(10e3),
        eval_max_trajectories=10,
    )

    algo = SAC()
    agent = SacAgent(
        ModelCls=PiMlpModel,
        QModelCls=QofMuMlpModel,
    )
    runner = MinibatchRlEval(
        algo=algo,
        agent=agent,
        sampler=sampler,
        n_steps=1e5,
        affinity=dict(cuda_idx=cuda_idx, workers_cpus=[1,2,3,4]),
        log_interval_steps=1e3
    )
    config = dict(env_id=env_id)
    name = "sac_" + env_id
    log_dir = "example_1"
    with logger_context(log_dir, run_ID, name, config):
        runner.train()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument('--env_id', help='environment ID', default='Seeker-v0')
    parser.add_argument('--run_ID', help='run identifier (logging)', type=int, default=0)
    parser.add_argument('--cuda_idx', help='gpu to use ', type=int, default=None)
    args = parser.parse_args()
    build_and_train(
        env_id=args.env_id,
        run_ID=args.run_ID,
        cuda_idx=args.cuda_idx,
    )