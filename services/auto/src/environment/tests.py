"""
Test than a simulator can be set up to track the real building
"""
import yaml
import time
from pprint import pprint
from env.base import BaseEnvironment
from env.single import SingleEnvironment
from env.multi import MultiEnvironment
from loaders.geometry import GeometryLoader


def test_startup(config):
    """Test that an environment can be started"""
    loader = GeometryLoader(config) # Handles HTTP
    base = BaseEnvironment(loader, headless=False) # Makes geometry changes
    env = SingleEnvironment(base) # Simulates robot movement
    for i in range(1000):
        env.base.step()
        time.sleep(0.10)
    print("STARTUP TEST PASSED")


def test_actions(config):
    loader = GeometryLoader(config) # Handles HTTP
    base = BaseEnvironment(loader, headless=False) # Makes geometry changes
    env = SingleEnvironment(base, robot=base.robots[0]) # Simulates robot movement
    for i in range(100):
        env.act([1,1])
        env.step()
    print("ACTION TEST PASSED")


def test_state(config):
    cfg = {'debug': True}
    loader = GeometryLoader(config) # Handles HTTP
    base = BaseEnvironment(loader, headless=False) # Makes geometry changes
    env = SingleEnvironment(base, robot=base.robots[0], config=cfg) # Simulates robot movement
    for i in range(20):
        done_count = 0
        for i in range(100):
            env.act([0.0, -0.3])
            env.step()
            obs, reward, done, _ = env.observe()
            maps = obs["maps"]
            obs["maps"] = None
            print("Obs:")
            pprint(obs)
            print("Map Shape", maps.shape)
            print("Reward:", reward)
            print("Done:", done)
            time.sleep(0.4)
            if done:
                done_count += 1
            if done_count > 2:
                env.reset()
                break

    print("STATE TEST PASSED")


def test_state_shape(config):
    cfg = {'debug': True}
    loader = GeometryLoader(config) # Handles HTTP
    base = BaseEnvironment(loader, headless=True) # Makes geometry changes
    env = SingleEnvironment(base, robot=base.robots[0], config=cfg) # Simulates robot movement
    for i in range(10):
        env.act([0.0, -0.3])
        env.step()
        obs, reward, done, _ = env.observe()
        for key in obs:
            true_shape = obs[key].shape
            expected_shape = env.observation_space[key].shape
            if true_shape != expected_shape:
                raise ValueError("Expected {} to have shape {}. Got {}".format(key, expected_shape, true_shape))
    print("STATE SHAPE TEST PASSED")



def test_state_bounds(config):
    cfg = {'debug': True}
    loader = GeometryLoader(config) # Handles HTTP
    base = BaseEnvironment(loader, headless=True) # Makes geometry changes
    env = SingleEnvironment(base, robot=base.robots[0], config=cfg) # Simulates robot movement
    for i in range(10):
        env.act([0.0, -0.3])
        env.step()
        obs, reward, done, _ = env.observe()
        for key in obs:
            state = obs[key]
            box = env.observation_space[key]
            if not box.contains(state):
                raise ValueError("Box {} does not contain {}".format(box, state))
        # Test the whole space
        assert(env.observation_space.contains(obs)) 
    print("STATE BOUNDS TEST PASSED")



def test_reset(config):
    cfg = {'debug': False}
    loader = GeometryLoader(config) # Handles HTTP
    base = BaseEnvironment(loader, headless=False) # Makes geometry changes
    env = SingleEnvironment(base, robot=base.robots[0], config=cfg) # Simulates robot movement
    for i in range(100):
        for j in range(100):
            env.act([0.2, -0.5])
            env.step()
            obs, reward, done, _ = env.observe()
            if done:
                break
        env.reset()
        print("Env reset. Waiting to start...")
        time.sleep(2)
    print("REST TEST PASSED")


def test_kafka_sync(config):
    """Test that we can keep in sync with Kafka"""
    cfg = {'debug': False}
    loader = GeometryLoader(config) # Handles HTTP
    base = BaseEnvironment(loader, headless=False)
    env = SingleEnvironment(base, 
        robot=base.robots[0],  
        robot_policy="subscribe",
        geometry_policy="subscribe",
        config=cfg)

    for i in range(100):
        for j in range(100):
            env.act([0.2, -0.5])
            env.step()
            obs, reward, done, _ = env.observe()
            if done:
                break
        env.reset()
    print("KAFKA SYNC TEST PASSED")



def test_state_image(config):
    cfg = {'debug': True}
    loader = GeometryLoader(config) # Handles HTTP
    base = BaseEnvironment(loader, headless=False) # Makes geometry changes
    env = SingleEnvironment(base, robot=base.robots[0], config=cfg) # Simulates robot movement
    env.act([0.0, -0.3])
    env.step()
    pos = env.robot.get_position()
    env.pixel_state.save_image(pos,"obs.png")



def test_multi(config):
    cfg = {'debug': True}
    loader = GeometryLoader(config) # Handles HTTP
    base = BaseEnvironment(loader, headless=False) # Makes geometry changes
    env = MultiEnvironment(base, env_config=cfg)
    action = {i:[0.2, -0.5] for i in range(len(base.robots))}

    for i in range(100):
        for j in range(100):
            obs, reward, done, _ = env.step(action)
            if done['__all__']:
                break
        env.reset()


def test_multi_stationary(config):
    cfg = {'debug': True}
    loader = GeometryLoader(config) # Handles HTTP
    base = BaseEnvironment(loader, headless=False) # Makes geometry changes
    env = MultiEnvironment(base, env_config=cfg)
   
    a = [0, 0]
    
    for i in range(100):
        env_reward = 0
        done = {i:False for i in range(len(base.robots))}
        for j in range(100):
            action = {i:a for i,d in done.items() if not d and i!='__all__'}
            obs, reward, done, _ = env.step(action)
            for r in reward.values():
                env_reward += r
            if done['__all__']:
                break
        print("Reward:",env_reward)
        env.reset()



if __name__=="__main__":
    with open('configs/test.yaml') as cfg:
        config = yaml.load(cfg, Loader=yaml.Loader)
    #test_startup(config)
    #test_actions(config)
    #test_state(config)
    #test_state_shape(config)
    #test_state_bounds(config)
    #test_state_image(config)
    #test_reset(config)
    #test_kafka_sync(config)
    #test_multi(config)
    test_multi_stationary(config)
    