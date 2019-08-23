import os
import math
import time
import yaml
import json
import trimesh
import pymesh
import urllib
import shutil
import kafka
import logging
import argparse
import meshcut
import numpy as np
import transforms3d
import plotly.graph_objs as go
from graphqlclient import GraphQLClient
from graphql import getCurrentGeometry
from kafka import KafkaProducer

logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)

parser = argparse.ArgumentParser(description='Convert 3D geometry to 2D geometry.')
parser.add_argument('--headless', action='store_true', help='run without GUI components')
parser.add_argument('--height', type=float, default=0.1, help='height to generate map')


class MapBuilder():
    """
    Build a 2D map from 3D object mesh
    Publishes updates to the 2D map as the 3D map changes
    """

    def __init__(self, furniture_height, config):
        self.furniture_height = furniture_height
        self.graphql_endpoint = config["API"]["host"]
        self.geometry_endpoint = config["Geometry"]["host"]
        self.graphql_client = GraphQLClient(self.graphql_endpoint)
        #self.kafka_consumer = self._setup_kafka_consumer(config["Kafka"]["host"])
        self.kafka_producer = self._setup_kafka_producer(config["Kafka"]["host"])
        self.canvas = go.Figure()

    #def _setup_kafka_consumer(self, bootstrap_servers):
    #    topic = "robot.commands.velocity"
    #    return KafkaConsumer(topic, bootstrap_servers=bootstrap_servers)


    def _setup_kafka_producer(self, bootstrap_servers):
        return KafkaProducer(bootstrap_servers=bootstrap_servers)


    def _get_initial_geometry(self):
        result = self.graphql_client.execute(getCurrentGeometry)
        result = json.loads(result)
        return result['data']['meshesCurrent']


    def _convert_to_polygons(self, mesh, furniture_height, offset):
        """
        Convert a 3D object to a 2D polygon
        Slices the mesh at self.furniture_height and then returns all polygons on this plane
        """
        #print(mesh.vertices)
        #print(mesh.aces)
        plane_origin = np.array([0, furniture_height, 0])
        plane_normal = np.array([0, 1, 0])
        print("Water",mesh.is_watertight)

        lines = mesh.section(plane_normal, plane_origin)
        if lines is None:
            return []
        print(lines)
        print(lines.paths)
        print(lines.paths.tostring())
        planar, _ = lines.to_planar()
        polygons = planar.polygons_closed
        return [list(p.exterior.coords) for p in polygons]


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
        axis = np.array([0,1,0]);
        angle = math.radians(theta);
        rot = transforms3d.axangles.axangle2aff(axis, angle)
        mesh.apply_scale(scale)
        mesh.apply_transform(rot)
        mesh.apply_translation(offset)
        return mesh

    def _download_geometry_resource(self, geometry_object):
        """
        Download the file from `url` and save it locally under `file_name`
        Return a PyMesh mesh object
        """
        print("-->", geometry_object['geometry']['filename'])
        relative_url = os.path.join(geometry_object['geometry']['directory'], geometry_object['geometry']['filename'])
        relative_url = relative_url.strip('./')
        url = os.path.join(self.geometry_endpoint, relative_url)
        fp = os.path.join('tmp/', relative_url)
        logging.info("{} -> {}".format(url, fp))
        os.makedirs(os.path.dirname(fp), exist_ok=True)
        with urllib.request.urlopen(url) as response, open(fp, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)
        mesh = trimesh.load(fp, process=True)
        #trimesh.repair.fix_inversion(mesh, multibody=True)
        #trimesh.repair.fill_holes(mesh)
        return mesh


    def _create_map_message(self, geometry_object, polygons):
        message = {
            "mesh_id": geometry_object["id"],
            "polygons": polygons,
        }
        message = json.dumps(message).encode('utf-8')
        return message


    def draw(self, mesh):
        """
        Draw a MeshPy Mesh
        """
        x = mesh.vertices[:,0]
        y = mesh.vertices[:,1]
        z = mesh.vertices[:,2]
        i = mesh.faces[:,0]
        j = mesh.faces[:,1]
        k = mesh.faces[:,2]
        triangles = go.Mesh3d(x=x, y=y, z=z, i=i, j=j, k=k)
        fig = go.Figure(data=[triangles])
        fig.show()


    def draw_floorplan(self, polygon, name):
        x = [p[0] for p in polygon]
        y = [p[1] for p in polygon]
        p0 = polygon[0]
        shapes = []
        self.canvas.add_trace(
            go.Scatter(
                x=x, 
                y=y, 
                name=name,
                line_shape='vhv')
            )
        self.canvas.update_layout(shapes)


    def run(self):
        logging.info("\n\n --- Starting map loop --- \n")
        while True:
            for ob in reversed(self._get_initial_geometry()):
                name = ob["name"] 
                if ob["type"]=="robot" or ob["type"]=="floor":
                    continue
                if ob['geometry']['filename'] is None:
                    print("Could not get geometry for ", name)
                    continue
                logging.info('Processing {}'.format(ob['name']))
                try:
                    mesh = self._download_geometry_resource(ob)
                except urllib.error.HTTPError:
                    logging.error("Could not download: %s"%name)
                    continue
                except Exception as e:
                    logging.error("Could not download: %s %s"%(e,name))
                    continue
                if type(mesh) is trimesh.scene.Scene:
                    logging.error("Could not process scene for: %s"%name)
                    continue
                offset = np.array([ob['z'], ob['y'], ob['x']])
                mesh = self._transform_mesh(mesh, offset, ob["theta"], ob["scale"])
                polygons = self._convert_to_polygons(mesh, self.furniture_height)
                [self.draw_floorplan(p, name) for p in polygons]
                message = self._create_map_message(ob, polygons)
                self.kafka_producer.send('map.events.geometry', message)   
            self.canvas.show()
            logging.info("\n\n --- Published map data --- \n")
            time.sleep(20)





if __name__=="__main__":
    args = parser.parse_args()
    with open('config.yaml') as cfg:
        config = yaml.load(cfg, Loader=yaml.Loader)
    builder = MapBuilder(args.height, config)
    builder.run()




