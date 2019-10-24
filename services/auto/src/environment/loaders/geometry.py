"""
A geometry loader loads raw geometry from the API
Mesh loaders can also load geometry into PyBullet environments
"""

from .map import MapLoader
from .mesh import MeshLoader
from .trajectory import TrajectoryLoader
from .trajectory import RoadmapPlanner, RRTPlanner


class GeometryLoader():
	"""
	Generate Purpose Loader for mesh, geometry and trajectories
	"""
	def __init__(self, config):
		self.map = MapLoader(config)
		self.mesh = MeshLoader(config)
		self.trajectory = TrajectoryLoader(config)
		self.trajectory_builder = RRTPlanner(config)
		self.roadmap_planner = RoadmapPlanner(config)