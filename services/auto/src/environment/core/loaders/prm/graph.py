import math
from astar import AStar

class Graph(AStar):

    def __init__(self, *args, **kwargs):
        self.nodes = {}
        super().__init__(*args, **kwargs)


    def add_node(self, i, x, y, connections, connect=False):
        """
        Add a node to the graph
        If @connect is True, then make sure the connections are bidirectional
        """
        self.nodes[i] = (x, y, connections)
        if connect:
            for node in connections:
                nx,ny,nc = self.nodes[node]
                self.nodes[node] = (nx, ny, nc + [i])


    def heuristic_cost_estimate(self, current, goal):
        """
        Computes the estimated (rough) distance between a node and the goal
        The second parameter is always the goal.
        """
        sx, sy, _ = self.nodes[current]
        gx, gy, _ = self.nodes[goal]
        return math.sqrt((sx-gx)**2 + (sy-gy)**2)


    def distance_between(self, n1, n2):
        """
        Gives the real distance between two adjacent nodes n1 and n2 (i.e n2 belongs to the list of n1's neighbors).
        n2 is guaranteed to belong to the list returned by the call to neighbors(n1).
        """
        sx, sy, connections = self.nodes[n1]
        for j in connections:
            if j == n2:
                gx, gy, _ = self.nodes[j]
                dist = math.sqrt((sx-gx)**2 + (sy-gy)**2)
                return dist
        

    def neighbors(self, node):
        """
        For a given node, returns (or yields) the list of its neighbors
        """
        _, _, neighbors = self.nodes[node]
        return neighbors


    def is_goal_reached(self, current, goal):
        return current == goal


    def copy(self):
        g = Graph()
        g.nodes = self.nodes.copy()
        return g


if __name__=="__main__":
    graph = Graph()
    graph.add_node(0, x=21, y=42, connections=[1])
    graph.add_node(1, x=22, y=42, connections=[2])
    graph.add_node(2, x=23, y=42, connections=[3])
    graph.add_node(3, x=24, y=42, connections=[1])
    assert list(graph.astar(0,3))==[0,1,2,3]
    print("A* works")

