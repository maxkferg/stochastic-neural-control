import os
import math
import time
import yaml
import json
import urllib
import shutil
import logging
import argparse
from graphqlclient import GraphQLClient
from graphql import getCurrentGeometry
from environment import Environment
from kafka import KafkaProducer, KafkaConsumer
from robots.robot_models import Turtlebot
from robots.robot_messages import get_odom_message

logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)

parser = argparse.ArgumentParser(description='Simulate robot movement.')
parser.add_argument('--headless', action='store_true', help='run without GUI components')




class MapBuilder():
    """
    Build a 2D map from 3D object mesh
    Publishes updates to the 2D map as the 3D map changes
    """


    def __init__(self, env, config):
        self.env = env
        self.robots = {}
        self.graphql_endpoint = config["API"]["host"]
        self.geometry_endpoint = config["Geometry"]["host"]
        self.graphql_client = GraphQLClient(self.graphql_endpoint)
        #self.kafka_consumer = self._setup_kafka_consumer(config["Kafka"]["host"])
        self.kafka_producer = self._setup_kafka_producer(config["Kafka"]["host"])
        self._setup_geometry()
        self.env.start()


    #def _setup_kafka_consumer(self, bootstrap_servers):
    #    topic = "robot.commands.velocity"
    #    return KafkaConsumer(topic, bootstrap_servers=bootstrap_servers)


    def _setup_kafka_producer(self, bootstrap_servers):
        return KafkaProducer(bootstrap_servers=bootstrap_servers)


    def _get_initial_geometry(self):
        result = self.graphql_client.execute(getCurrentGeometry)
        result = json.loads(result)
        robot_geometry = []
        building_geometry = []

        for mesh in result['data']['meshesCurrent']:
            logging.info('Loading {}'.format(mesh['name']))
            relative_url = os.path.join(mesh['geometry']['directory'], mesh['geometry']['filename'])
            relative_url = relative_url.strip('./')
            position = [mesh['x'], mesh['y'], mesh['z']]
            is_stationary = mesh['physics']['stationary']
            is_simulated = mesh['physics']['simulated']
            mesh_id = mesh['id']
            url = os.path.join(self.geometry_endpoint, relative_url)
            fp = os.path.join('tmp/', relative_url)
            self._download_geometry_resource(url, fp)
            if mesh['type']=='robot' and is_simulated:
                robot_geometry.append(fp)
            else:
                building_geometry.append(fp)
        return building_geometry, robot_geometry


    def _convert_to_polygons(self, mesh, furniture_height):
        """
        Convert a 3D object to a 2D polygon
        Slices the mesh at self.furniture_height and then returns all polygons on this plane
        """
        v_min = np.min(mesh.vertices, axis=-1)
        v_max = np.max(mesh.vertices, axis=-1)
        box_min = np.array([2*v_min[0], 2*v_min[1], furniture_height])
        box_max = np.array([2*v_max[0], 2*v_max[1], 2*v_max[2]])
        box = pymesh.generate_box_mesh(box_min, box_max)
        sliced = pymesh.boolean(box, mesh, "difference")
        sliced.enable_connectivity()
        seen = set()
        polygons = []
        for seed_index in range(mesh.num_vertices):
            if seed_index in seen:
                continue
            seen.add(seed_index)
            if mesh.vertices[seed_index,2] != furniture_height:
                continue
            # We can find a polygon connected to this index
            polygon, indices = _trace_polygon(mesh, seed_index)
            seen += indices
            polygons.append(polygon)
        return polygons


    def _trace_polygon(self, mesh, seed_index):
        """
        Trace a polygon starting at seed_index
        Return a list of polygon coordinates and a list of seed indices
        """
        polygon = []
        polygon.append(mesh.vertices[seed_index])
        vi = seed_index
        polygon_done = False

        while not polygon_done:
            next_vi = None
            for adjacent_index in mesh.get_vertex_adjacent_vertices(seed_index):
                if adjacent_index in polygon:
                    polygon_done = True # Loop closure
                    break
                if mesh.vertices[adjacent_index, 2] == self.furniture_height:
                    polygon.append(adjacent_index)
                    next_vi = adjacent_index # New node found
                    break
            if next_vi is None:
                print("Polygon construction failed")
                polygon_done = True
            vi = next_vi

        seen = polygon
        polygon = [mesh.vertices[i] for i in polygon]
        return polygon, seen


    def _transform_mesh(self, mesh, offset, theta, scale):
        offset = np.array(offset);
        axis = np.array([0,0,1]);
        angle = math.radians(theta);
        rot = pymesh.Quaternion.fromAxisAngle(axis, angle);
        rot = rot.to_matrix();

        vertices = mesh.vertices;
        bbox = mesh.bbox;
        #centroid = 0.5 * (bbox[0] + bbox[1]);
        vertices = np.dot(rot, (vertices).T).T + offset;
        return pymesh.form_mesh(vertices, mesh.faces)



    def _get_map(self, geometry_object):
        for mesh in meshes:
            mesh = pymesh.load_mesh("pymesh.ply")




    def _download_geometry_resource(self, url, local_filepath):
        """
        Download the file from `url` and save it locally under `file_name`
        """
        logging.info("{} -> {}".format(url, local_filepath))
        os.makedirs(os.path.dirname(local_filepath), exist_ok=True)
        with urllib.request.urlopen(url) as response, open(local_filepath, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)


    def _publish_map_state(self):
        for robot_id, robot in self.robots.items():
            state = robot.get_state()
            position = state["position"]
            orientation = state["orientation"]
            message = get_odom_message(robot_id, position, orientation)
            message = json.dumps(message).encode('utf-8')
            future = self.kafka_producer.send('robot.events.odom', message)
            logging.info("Sent robot.events.odom message for robot %s"%robot_id)


    def run(self):
        logging.info("\n\n --- Starting map loop --- \n")
        geometry = self._get_initial_geometry()



if __name__=="__main__":
    args = parser.parse_args()
    with open('config.yaml') as cfg:
        config = yaml.load(cfg, Loader=yaml.Loader)
    env = Environment(headless=args.headless)
    simulator = Simulator(env, config)
    simulator.run()




