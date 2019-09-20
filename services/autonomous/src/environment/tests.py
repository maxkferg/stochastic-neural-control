"""
Test than a simulator can be set up to track the real building
"""
import yaml
import time
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



if __name__=="__main__":
    with open('configs/test.yaml') as cfg:
        config = yaml.load(cfg, Loader=yaml.Loader)
    test_startup(config)