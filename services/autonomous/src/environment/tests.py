"""
Test than a simulator can be set up to track the real building
"""
import yaml
import time
from pprint import pprint
from env.base import BaseEnvironment
from env.single import SingleEnvironment
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
        env.base.step()
    print("ACTION TEST PASSED")


def test_state(config):
    cfg = {'debug': True}
    loader = GeometryLoader(config) # Handles HTTP
    base = BaseEnvironment(loader, headless=False) # Makes geometry changes
    env = SingleEnvironment(base, robot=base.robots[0], config=cfg) # Simulates robot movement
    env.reset_target_position(target_pos=[-1,0,0.4])
    for i in range(1000):
        env.act([0.0, -10])
        env.base.step()
        obs, reward, done, _ = env.observe()
        obs["maps"] = None
        print("Obs:")
        pprint(obs)
        print("Reward:", reward)
        print("Done:", done)
        time.sleep(0.4)
    print("STATE TEST PASSED")





if __name__=="__main__":
    with open('configs/test.yaml') as cfg:
        config = yaml.load(cfg, Loader=yaml.Loader)
    #test_startup(config)
    #test_actions(config)
    test_state(config)
