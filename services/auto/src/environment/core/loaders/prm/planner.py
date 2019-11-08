"""

Probablistic Road Map (PRM) Planner

author: Atsushi Sakai (@Atsushi_twi)

"""

import math
import random
import numpy as np
import scipy.spatial
from .graph import Graph


# parameter
N_SAMPLE = 500  # number of sample_points
N_KNN = 10  # number of edge from one sampled point
MAX_EDGE_LEN = 2.0  # [m] Maximum edge length

show_animation = False


class Node:
    """
    Node class for dijkstra search
    """

    def __init__(self, x, y, cost, pind):
        self.x = x
        self.y = y
        self.cost = cost
        self.pind = pind

    def __str__(self):
        return str(self.x) + "," + str(self.y) + "," + str(self.cost) + "," + str(self.pind)


class KDTree:
    """
    Nearest neighbor search class with KDTree
    """

    def __init__(self, data):
        # store kd-tree
        self.tree = scipy.spatial.cKDTree(data)

    def search(self, inp, k=1):
        """
        Search NN

        inp: input data, single frame or multi frame

        """

        if len(inp.shape) >= 2:  # multi input
            index = []
            dist = []

            for i in inp.T:
                idist, iindex = self.tree.query(i, k=k)
                index.append(iindex)
                dist.append(idist)

            return index, dist

        dist, index = self.tree.query(inp, k=k)
        return index, dist

    def search_in_distance(self, inp, r):
        """
        find points with in a distance r
        """

        index = self.tree.query_ball_point(inp, r)
        return index


class PRM():

    def __init__(self):
        self.graph = None
        self.sample_x = []
        self.sample_y = []

    def solve(self, sx, sy, gx, gy, ox, oy, rr):
        """
        Solve the path planning problem
        """
        if self.graph is None:
            self._setup(sx, sy, gx, gy, ox, oy, rr)
        graph = self.graph.copy()
        
        # Add in the new start and end nodes
        start_node = len(self.sample_x)
        goal_node = len(self.sample_x) + 1
        start_connections = self.get_nearest_nodes(sx, sy, rr)
        goal_connections = self.get_nearest_nodes(gx, gy, rr)
        graph.add_node(start_node, sx, sy, start_connections, connect=True)
        graph.add_node(goal_node, gx, gy, goal_connections, connect=True)

        if not len(start_connections) or not len(goal_connections):
            return [], [] 

        path = graph.astar(start_node, goal_node)
        if path is None:
            return [], []

        path = list(path)
        path.remove(start_node)
        path.remove(goal_node)
        rx = [self.sample_x[i] for i in path]
        ry = [self.sample_y[i] for i in path]
        #print(list(zip(rx,ry)))

        return rx, ry


    def _setup(self, sx, sy, gx, gy, ox, oy, rr):
        obkdtree = KDTree(np.vstack((ox, oy)).T)
        sample_x, sample_y = sample_points(sx, sy, gx, gy, rr, ox, oy, obkdtree)
        skdtree = KDTree(np.vstack((sample_x, sample_y)).T)
        road_map = generate_roadmap(sample_x, sample_y, rr, obkdtree)

        # Convert roadmap to a cost-weighted graph
        graph = Graph()
        for i, connections in enumerate(road_map):
            graph.add_node(i, sample_x[i], sample_y[i], connections)
        
        self.graph = graph
        self.sample_x = sample_x
        self.sample_y = sample_y
        self.obkdtree = obkdtree
        self.skdtree = skdtree


    def reset(self, sx, sy, gx, gy, ox, oy, rr):
        obkdtree = KDTree(np.vstack((ox, oy)).T)
        sample_x, sample_y = sample_points(sx, sy, gx, gy, rr, ox, oy, obkdtree)
        skdtree = KDTree(np.vstack((sample_x, sample_y)).T)
        road_map = generate_roadmap(sample_x, sample_y, rr, obkdtree)

        # Convert roadmap to a cost-weighted graph
        graph = Graph()
        for i, connections in enumerate(road_map):
            graph.add_node(i, sample_x[i], sample_y[i], connections)
        
        self.graph = graph
        self.sample_x = sample_x
        self.sample_y = sample_y
        self.obkdtree = obkdtree
        self.skdtree = skdtree



    def get_nearest_nodes(self, px, py, rr):
        """
        Return a list of nodes that are near (px,py)
        """
        neighbors = []
        index, dist = self.skdtree.search(np.array([px, py]).reshape(2, 1), N_KNN)
        for i in index[0]:
            sx, sy = self.sample_x[i], self.sample_y[i] 
            if not is_collision(sx, sy, px, py, rr, self.obkdtree):
                neighbors.append(i)
        return neighbors



def is_collision(sx, sy, gx, gy, rr, okdtree):
    x = sx
    y = sy
    dx = gx - sx
    dy = gy - sy
    yaw = math.atan2(gy - sy, gx - sx)
    d = math.sqrt(dx**2 + dy**2)

    if d >= MAX_EDGE_LEN:
        return True

    D = rr
    nstep = round(d / D)

    for i in range(nstep):
        idxs, dist = okdtree.search(np.array([x, y]).reshape(2, 1))
        if dist[0] <= rr:
            return True  # collision
        x += D * math.cos(yaw)
        y += D * math.sin(yaw)

    # goal point check
    idxs, dist = okdtree.search(np.array([gx, gy]).reshape(2, 1))
    if dist[0] <= rr:
        return True  # collision

    return False  # OK


def generate_roadmap(sample_x, sample_y, rr, obkdtree):
    """
    Road map generation

    sample_x: [m] x positions of sampled points
    sample_y: [m] y positions of sampled points
    rr: Robot Radius[m]
    obkdtree: KDTree object of obstacles
    """

    road_map = []
    nsample = len(sample_x)
    skdtree = KDTree(np.vstack((sample_x, sample_y)).T)

    for (i, ix, iy) in zip(range(nsample), sample_x, sample_y):

        index, dists = skdtree.search(
            np.array([ix, iy]).reshape(2, 1), k=nsample)
        inds = index[0]
        edge_id = []
        #  print(index)

        for ii in range(1, len(inds)):
            nx = sample_x[inds[ii]]
            ny = sample_y[inds[ii]]

            if not is_collision(ix, iy, nx, ny, rr, obkdtree):
                edge_id.append(inds[ii])

            if len(edge_id) >= N_KNN:
                break

        road_map.append(edge_id)

    #  plot_road_map(road_map, sample_x, sample_y)

    return road_map


def plot_road_map(road_map, sample_x, sample_y):  # pragma: no cover

    for i, _ in enumerate(road_map):
        for ii in range(len(road_map[i])):
            ind = road_map[i][ii]

            plt.plot([sample_x[i], sample_x[ind]],
                     [sample_y[i], sample_y[ind]], "-k")


def sample_points(sx, sy, gx, gy, rr, ox, oy, obkdtree):
    maxx = max(ox)
    maxy = max(oy)
    minx = min(ox)
    miny = min(oy)

    sample_x, sample_y = [], []

    while len(sample_x) <= N_SAMPLE:
        tx = (random.random() * (maxx - minx)) + minx
        ty = (random.random() * (maxy - miny)) + miny

        index, dist = obkdtree.search(np.array([tx, ty]).reshape(2, 1))

        if dist[0] >= rr:
            sample_x.append(tx)
            sample_y.append(ty)

    sample_x.append(sx)
    sample_y.append(sy)
    sample_x.append(gx)
    sample_y.append(gy)

    return sample_x, sample_y
