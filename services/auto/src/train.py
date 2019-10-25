
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
from rlpyt.utils.launching.affinity import prepend_run_slot, affinity_from_code
#from rlpyt.samplers.parallel.cpu.sampler import CpuSampler
from rlpyt.samplers.async_.cpu_sampler import AsyncCpuSampler
#from rlpyt.samplers.async_.gpu_sampler import AsyncGpuSampler
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
    affinity_code = encode_affinity(
        n_cpu_core=8,
        n_gpu=1,
        #contexts_per_gpu=2,
        async_sample=True,
        #hyperthread_offset=2,
    )
    slot_affinity_code = prepend_run_slot(0, affinity_code)
    affinity = affinity_from_code(slot_affinity_code)
    print("Affinity:", affinity)

    env_config = dict(
        headless=True
    )

    eval_env_config = dict(
        headless=True
    )
 
    sampler = AsyncCpuSampler(
        EnvCls=gym_make,
        env_kwargs=dict(id=env_id, config=env_config),
        eval_env_kwargs=dict(id=env_id, config=eval_env_config),
        batch_T=1,  # One time-step per sampler iteration.
        batch_B=6,  # One environment (i.e. sampler Batch dimension).
        max_decorrelation_steps=0,
        eval_n_envs=4,
        eval_max_steps=int(10e3),
        eval_max_trajectories=10,
    )

    algo = SAC(
        reward_scale=1,
        n_step_return=3,
        learning_rate=1e-4,
        target_update_tau=0.002,
        target_entropy="auto",
    )

    agent = SacAgent(
        ModelCls=PiMlpModel,
        QModelCls=QofMuMlpModel,
    )

    runner = AsyncRlEval(
        algo=algo,
        agent=agent,
        sampler=sampler,
        n_steps=1e7,
        affinity=affinity,
        log_interval_steps=10e3
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
