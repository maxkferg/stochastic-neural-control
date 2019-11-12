"""
Run and record a RL reollout

Copying checkpoint files from the server
gcloud compute --project "stanford-projects" scp --zone "us-west1-b" --recurse "ray-trainer:~/ray_results/*" ~/ray_results

ray rsync-down cluster.yaml ray_results ~/

export CHECKPOINT=../checkpoints/SACQ_MultiRobot-v0_1b51c0e3_2019-11-05_09-10-27g6ibizk2/checkpoint_4000/checkpoint-4000

python rollout.py --steps 1000 \
    --checkpoint=checkpoints/October2c/checkpoint_120/checkpoint-120

python rollout.py --steps 1000 \
    --save-q \
    --checkpoint=~/ray_results/good/seeker-sac/SAC_MultiRobot-v0_bbbac6db_2019-11-02_23-01-41d2tss5p9/checkpoint_500/checkpoint-500


"""
import io
import os
import cv2
import yaml
import json
import time
import pickle
import datetime
import numpy as np
import gym
import ray
import logging
import argparse
import collections
import colored_traceback
from ray import tune
from pprint import pprint
from matplotlib import cm
from gym.spaces import Discrete, Box
from gym.envs.registration import EnvSpec
from gym.envs.registration import registry
from ray.rllib.env import MultiAgentEnv
from ray.tune.registry import register_env
from ray.rllib.models import ModelCatalog
from ray.rllib.evaluation.episode import _flatten_action
from ray.rllib.agents.registry import get_agent_class
from ray.rllib.models.preprocessors import get_preprocessor
from ray.rllib.policy.sample_batch import DEFAULT_POLICY_ID
from common import train_env_factory
from environment.core.utils.config import extend_config
from agents.sacq import SACQAgent

logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)
tune.register_trainable("SACQ", SACQAgent)


EXAMPLE_USAGE = """
Example Usage via RLlib CLI:

python rollout.py --steps 1000 \
    --checkpoint=checkpoints/October2c/checkpoint_120/checkpoint-120
"""


ENVIRONMENT = "MultiRobot-v0"
RESET_ON_TARGET = True
DEFAULT_TIMESTEP = 0.1
FRAME_MULTIPLIER = 1
FRAME_MULTIPLIER = 5
EVAL_TIMESTEP = DEFAULT_TIMESTEP/FRAME_MULTIPLIER

RENDER_WIDTH = 1280
RENDER_HEIGHT = 720

timestamp = datetime.datetime.now().strftime("%I-%M-%S %p")
filename = 'videos/video %s.mp4'%timestamp

video_FourCC = -1#cv2.VideoWriter_fourcc(*"mp4v")
video = cv2.VideoWriter(filename, video_FourCC, fps=20, frameSize=(RENDER_WIDTH, RENDER_HEIGHT))
viridis = cm.get_cmap('viridis')


ENV_OVERIDES = {
    'headless': False,
    'timestep': 0.1,
    'creation_delay': 0,
    'reset_on_target': False,
    'building_id': '5dc3fefb14921a7c18cff7e9'
}




def create_parser(parser_creator=None):
    parser_creator = parser_creator or argparse.ArgumentParser
    parser = parser_creator(
        formatter_class=argparse.RawDescriptionHelpFormatter,
        description="Roll out a reinforcement learning agent "
        "given a checkpoint.",
        epilog=EXAMPLE_USAGE)

    parser.add_argument(
        "--checkpoint",
        type=str,
        required=True,
        help="Checkpoint from which to roll out.")

    required_named = parser.add_argument_group("required named arguments")
    required_named.add_argument(
        "--run",
        type=str,
        required=False,
        default="SACQ",
        help="The algorithm or model to train. This may refer to the name "
        "of a built-on algorithm (e.g. RLLib's DQN or PPO), or a "
        "user-defined trainable function or class registered in the "
        "tune registry.")
    required_named.add_argument(
        "--env",
        type=str,
        default=ENVIRONMENT,
        help="The gym environment to use."
    )
    parser.add_argument(
        "--no-render",
        default=False,
        action="store_const",
        const=True,
        help="Surpress rendering of the environment.")
    parser.add_argument(
        "--headless",
        default=False,
        action="store_true",
        help="Surpress rendering of the environment.")
    parser.add_argument(
        "--render",
        default=False,
        action="store_true",
        help="Render the environment.")
    parser.add_argument(
        "--render-q",
        default=False,
        action='store_true',
        dest='render_q',
        help='Render the q function. Write it to the environment video')
    parser.add_argument(
        "--save-q",
        default=True,
        action='store_true',
        dest='save_q',
        help='Render the q function. Save it as an image file')
    parser.add_argument(
        "--steps", default=10000, help="Number of steps to roll out.")
    parser.add_argument("--out", default=None, help="Output filename.")
    parser.add_argument(
        "--config",
        default="{}",
        type=json.loads,
        help="Algorithm-specific configuration (e.g. env, hyperparams). "
        "Surpresses loading of configuration from checkpoint.")
    return parser


def config_from_args(args):
    """
    Extract experiment args from the command line args
    These can be used to overrided the args in a yaml file
    """
    config = {}
    if args.headless:
        config["env_config"] = dict(headless=True)
    if args.render:
        config["env_config"] = dict(headless=False)
    return config



def get_q_value(env, agent, policy_id, obs):
    """Return the Q value for the current state"""
    state = []
    prev_action=None
    prev_reward=None
    info=None

    policy = agent.get_policy(policy_id)
    preprocessor = agent.workers.local_worker().preprocessors[policy_id]
    preprocessed = preprocessor.transform(obs)
    #obs_batch = obs[None, :]

    filtered_obs = agent.workers.local_worker().filters[policy_id](
        preprocessed, update=False)

    print(dir(agent.get_policy(policy_id)))

    res = agent.get_policy(policy_id).compute_single_action(
        filtered_obs,
        state,
        prev_action,
        prev_reward,
        info,
        clip_actions=True)
    print(res)

    feed_dict = {self.obs_t: observation[i], self.act_t: action[i] }
    feed_dict.update(self.extra_compute_action_feed_dict())
    q_value, q_twin_value = self.sess.run([self.q_t, self.twin_q_t], feed_dict=feed_dict)




    model_out_t, _ = policy.model({
        "obs": obs_batch,
        "is_training": False,
    }, [], None)

    policy_t, log_pis_t = policy.model.get_policy_output(model_out_t)
    q = policy.model.get_q_values(model_out_t, policy_t)
    print(q)
    return q


def render_q_function(env, agent):
    action = np.array([0,0])
    prep = get_preprocessor(env.observation_space)(env.observation_space)

    start = time.time()
    observation, nx, ny = env.default_env.get_observation_array()
    print("Got %i observations in %.3f seconds"%(len(observation),time.time()-start))

    # Reshape action and observation so that the first dimension is the batch
    #nx, ny, ns = observation.shape
    #observation = np.reshape(observation, (-1, ns))
    #action = np.tile(action, (nx*ny,1))
    obs_t = []
    act_t = []
    for i in range(len(observation)):
        act_t.append(np.expand_dims(action, axis=0))
        obs_t.append(np.expand_dims(prep.transform(observation[i]), axis=0))
    print("Prep took %.3f seconds"%(time.time()-start))

    q, qt = agent.get_policy().compute_q(obs_t, act_t)
    q_img = np.reshape(q, (nx,ny,1))
    print("Policy took %.3f seconds"%(time.time()-start))

    q_img = np.tile(q_img, (1,1,3))
    q_img = cv2.blur(q_img, (5,5))
    q_img = np.mean(q_img, axis=-1)
    q_img = 1-(np.clip(q_img, -0.6, 1)+0.6)/1.6
    q_img = 255*viridis(q_img)
    q_img = q_img.astype(np.uint8)
    q_img = q_img[:,:,:3] # Remove alpha
    q_img = q_img[:,:,::-1] # Flip colormap to RGB
    return q_img


class DefaultMapping(collections.defaultdict):
    """default_factory now takes as an argument the missing key."""

    def __missing__(self, key):
        self[key] = value = self.default_factory(key)
        return value


def default_policy_agent_mapping(unused_agent_id):
    return DEFAULT_POLICY_ID


def rollout(agent, env_name, num_steps, out=None, no_render=True, render_q=False, save_q=False):
    policy_agent_mapping = default_policy_agent_mapping
    if hasattr(agent, "workers"):
        env = agent.workers.local_worker().env
        multiagent = isinstance(env, MultiAgentEnv)
        if agent.workers.local_worker().multiagent:
            policy_agent_mapping = agent.config["multiagent"][
                "policy_mapping_fn"]

        policy_map = agent.workers.local_worker().policy_map
        state_init = {p: m.get_initial_state() for p, m in policy_map.items()}
        use_lstm = {p: len(s) > 0 for p, s in state_init.items()}
        action_init = {
            p: _flatten_action(m.action_space.sample())
            for p, m in policy_map.items()
        }
    else:
        env = gym.make(env_name)
        multiagent = False
        use_lstm = {DEFAULT_POLICY_ID: False}

    if out is not None:
        rollouts = []

    steps = 0
    while steps < (num_steps or steps + 1):
        mapping_cache = {}  # in case policy_agent_mapping is stochastic
        if out is not None:
            rollout = []
        obs = env.reset()
        agent_states = DefaultMapping(
            lambda agent_id: state_init[mapping_cache[agent_id]])
        prev_actions = DefaultMapping(
            lambda agent_id: action_init[mapping_cache[agent_id]])
        prev_rewards = collections.defaultdict(lambda: 0.)
        done = False
        reward_total = 0.0
        while not done and steps < (num_steps or steps + 1):
            multi_obs = obs if multiagent else {_DUMMY_AGENT_ID: obs}
            action_dict = {}
            for agent_id, a_obs in multi_obs.items():
                if a_obs is not None:
                    policy_id = mapping_cache.setdefault(
                        agent_id, policy_agent_mapping(agent_id))
                    p_use_lstm = use_lstm[policy_id]
                    if p_use_lstm:
                        a_action, p_state, _ = agent.compute_action(
                            a_obs,
                            state=agent_states[agent_id],
                            prev_action=prev_actions[agent_id],
                            prev_reward=prev_rewards[agent_id],
                            policy_id=policy_id)
                        agent_states[agent_id] = p_state
                    else:
                        a_action = agent.compute_action(
                            a_obs,
                            prev_action=prev_actions[agent_id],
                            prev_reward=prev_rewards[agent_id],
                            policy_id=policy_id)
                    a_action = _flatten_action(a_action)  # tuple actions
                    action_dict[agent_id] = a_action
                    prev_actions[agent_id] = a_action

                    # Custom code for getting Q values
                    #q = get_q_value(env, agent, policy_id, a_obs)
                    #print("Q",q)

            action = action_dict

            action = action if multiagent else action[_DUMMY_AGENT_ID]
            print(action)

            next_obs, reward, done, _ = env.step(action)
            if multiagent:
                for agent_id, r in reward.items():
                    prev_rewards[agent_id] = r
            else:
                prev_rewards[_DUMMY_AGENT_ID] = reward

            if multiagent:
                done = done["__all__"]
                reward_total += sum(reward.values())
            else:
                reward_total += reward
            if not no_render:
                env.render()
            if out is not None:
                rollout.append([obs, action, next_obs, reward, done])
            steps += 1
            obs = next_obs
        if out is not None:
            rollouts.append(rollout)
        print("Episode reward", reward_total)


def run(args, parser):
    checkpoint_file = os.path.expanduser(args.checkpoint)
    config_dir = os.path.dirname(checkpoint_file)
    config_dir = os.path.expanduser(config_dir)
    config_path = os.path.join(config_dir, "params.pkl")
    if not os.path.exists(config_path):
        config_path = os.path.join(config_dir, "../params.pkl")
    if not os.path.exists(config_path):
        if not args.config:
            raise ValueError(
                "Could not find params.pkl in either the checkpoint dir or "
                "its parent directory.")

    with open(config_path, "rb") as f:
        config = pickle.load(f)

    if "num_workers" in config:
        config["num_workers"] = min(1, config["num_workers"])
    if "horizon" in config:
        del config["horizon"]

    # Stop all the actor noise
    config['num_workers'] = 0
    config['evaluation_interval'] = 0
    config['exploration_enabled'] = False
    config = extend_config(config, dict(env_config=ENV_OVERIDES))


    ray.init()

    if not args.no_render:
        config["monitor"] = True

    pprint(config)
    cls = SACQAgent
    print(args.env)
    print(config)
    agent = cls(env=args.env, config=config)
    print(checkpoint_file)
    agent.restore(checkpoint_file)
    num_steps = int(args.steps)
    rollout(agent, args.env, num_steps, args.out, args.no_render, args.render_q, args.save_q)
    cv2.destroyAllWindows()
    video.release()




if __name__ == "__main__":
    parser = create_parser()
    args = parser.parse_args()
    try:
        run(args, parser)
    except Exception as e:
        print(e)
        cv2.destroyAllWindows()
        video.release()
        raise e

