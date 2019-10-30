"""
A geometry loader loads raw geometry from the API
Mesh loaders can also load geometry into PyBullet environments
"""
import os
import yaml
from .map import MapLoader
from .mesh import MeshLoader
from .trajectory import TrajectoryLoader
from .trajectory import RoadmapPlanner, RRTPlanner


def merge(config, defaults={}):
    """
    Merge @config and @defaults
    In the case of a conflict, the key from config will
    overide the one in config.
    """
    return dict(defaults, **config)


class GeometryLoader():
    """
    Generate Purpose Loader for mesh, geometry and trajectories
    """
    def __init__(self, config):
        defaults = self.get_default_config()
        config = merge(config, defaults)
        self.map = MapLoader(config)
        self.mesh = MeshLoader(config)
        self.trajectory = TrajectoryLoader(config)
        self.trajectory_builder = RRTPlanner(config)
        self.roadmap_planner = RoadmapPlanner(config)

    def get_default_config(self):
        dir_path = os.path.dirname(os.path.realpath(__file__))
        config_path = os.path.join(dir_path, "configs/default.yaml")
        with open(config_path) as cfg:
            return yaml.load(cfg, Loader=yaml.Loader)

    