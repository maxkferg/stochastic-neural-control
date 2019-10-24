"""
Run and record a RL reollout

Copying checkpoint files from the server
gcloud compute --project "stanford-projects" scp --zone "us-west1-b" --recurse "ray-trainer:~/ray_results/*" ~/ray_results

ray rsync-down cluster.yaml ray_results ~/


python rollout.py --steps 1000 \
    --checkpoint=checkpoints/October2c/checkpoint_120/checkpoint-120

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
from matplotlib import cm
from pprint import pprint
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
from learning.mink import MinkModel
from learning.preprocessing import DictFlatteningPreprocessor
from environment.loaders.geometry import GeometryLoader
from environment.env.base import BaseEnvironment # Env type
from environment.env.multi import MultiEnvironment # Env type
colored_traceback.add_hook()

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
video = cv2.VideoWriter(filename, video_FourCC, fps=20, frameSize=(RENDER_WIDTH,RENDER_HEIGHT))
viridis = cm.get_cmap('viridis')


# Load API Config
with open('environment/configs/prod.yaml') as cfg:
    api_config = yaml.load(cfg, Loader=yaml.Loader)


def train_env_factory(args):
    """
    Create an environment that is linked to the communication platform
    @env_config: Environment configuration from config file
    @args: Command line arguments for overriding defaults
    """
    with open('environment/configs/prod.yaml') as cfg:
        api_config = yaml.load(cfg, Loader=yaml.Loader)
        api_config['building_id'] = '5d984a7c6f1886dacf9c730d'

    def train_env(cfg):
        if args.headless:
            cfg.headless = True
        cfg['headless'] = False
        loader = GeometryLoader(api_config) # Handles HTTP
        base = BaseEnvironment(loader, headless=cfg["headless"])
        return MultiEnvironment(base, verbosity=0, creation_delay=0, env_config=cfg)

    return train_env



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
        default="APEX_DDPG",
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
        "--headless",
        default=False,
        action="store_const",
        const=True,
        help="Surpress rendering of the environment.")
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


class PID():
    """
    Creates a 2-d trajectory of a robot.
    Arguments:
        tau_p: Float, controls importance of proportionality
        tau_d: Float, controls importance of derivative
        tau_i: Float, controls importance of integral
        n: Integer, number of steps the robot should take.
        speed: Float, how many seconds pass per timestep.
    Returns:
        x_trajectory, y_trajectory: A 2d list containing the
        path taken by the robot.
    """
    def __init__(self, tau_p=0.02, tau_d=0.3, tau_i=0.0001, speed=0.3):
        self.tau_p = tau_p
        self.tau_d = tau_d
        self.tau_i = tau_i
        self.speed = speed
        self.integral = 0.0
        self.cte = 0

    def eval(self, theta, dist):
        diff = (theta - self.cte) / self.speed
        self.cte = theta
        self.integral += self.cte
        steer = (-self.tau_p * self.cte) - (self.tau_d * diff) - (self.tau_i * self.integral)
        return steer, self.speed


def default_policy_agent_mapping(unused_agent_id):
    return DEFAULT_POLICY_ID


def rollout(agent, env_name, num_steps, out=None, headless=True, render_q=False, save_q=False):
    pid = PID()
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
                    #if agent_id==0:
                    #    theta, dist = a_obs["target"][0], a_obs["target"][1]
                    #    action_dict[agent_id] = pid.eval(theta, dist) # PID
                    prev_actions[agent_id] = a_action
            action = action_dict

            action = action if multiagent else action[_DUMMY_AGENT_ID]
            print(action)

            #action = {
            #    0: np.array([0.1, 0.1], dtype=np.float32),
            #    1: np.array([0.1, 0], dtype=np.float32)
            #}

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
            if not headless:
                env.render()
            if out is not None:
                rollout.append([obs, action, next_obs, reward, done])
            steps += 1
            obs = next_obs
        if out is not None:
            rollouts.append(rollout)
        print("Episode reward", reward_total)


def run(args, parser):
    config = args.config
    ModelCatalog.register_custom_model("mink", MinkModel)
    register_env(ENVIRONMENT, train_env_factory(args))

    config_dir = os.path.dirname(args.checkpoint)
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
    config['exploration_ou_noise_scale'] = 0
    config['exploration_gaussian_sigma'] = 0
    config['per_worker_exploration'] = False
    config['schedule_max_timesteps'] = 0
    config['num_workers'] = 0

    ray.init()

    if not args.headless:
        config["monitor"] = True

    pprint(config)
    cls = get_agent_class(args.run)
    agent = cls(env=args.env, config=config)
    agent.restore(args.checkpoint)
    num_steps = int(args.steps)
    rollout(agent, args.env, num_steps, args.out, args.headless, args.render_q, args.save_q)
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

