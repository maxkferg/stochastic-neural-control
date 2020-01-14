"""
Copy map data from 3D to 2D
Removes old map data
"""
import os
import math
import time
import yaml
import json
import trimesh
import urllib
import shutil
import kafka
import logging
import argparse
import numpy as np
import transforms3d
import plotly.graph_objs as go
from collections import defaultdict
from graphqlclient import GraphQLClient
from .graphql import getCurrentGeometry, getDeletedGeometry, getMapGeometry, updateMapGeometry, deleteMapGeometry
from kafka import KafkaProducer

logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)


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


    def _get_deleted_mesh(self):
        result = self.graphql_client.execute(getDeletedGeometry)
        result = json.loads(result)
        return result['data']['meshesCurrent']


    def _get_map_geometry(self):
        result = self.graphql_client.execute(getMapGeometry)
        result = json.loads(result)
        return result['data']['mapGeometry']


    def delete_stale_map_geometry(self):
        """
        Delete any map data that does not appear in the building
        """
        logging.info("Deleting stale map geometry")
        meshes = self._get_initial_geometry()
        mesh_lookup = {mesh["id"]:mesh for mesh in meshes}
        maps = self._get_map_geometry()
        for map_object in maps:
            mesh_id = map_object["mesh_id"]
            if map_object["is_deleted"] == "true":
                continue
            if mesh_id in mesh_lookup and mesh_lookup[mesh_id]["type"]=="robot":
                print("Deleting robot from map (%s)"%map_object["name"])
                self.graphql_client.execute(deleteMapGeometry,
                    {"id": map_object["id"]}
                )
            if mesh_id not in mesh_lookup or mesh_lookup[mesh_id]["deleted"]:
                print("Deleting map geometry for %s"%map_object["name"])
                self.graphql_client.execute(deleteMapGeometry,
                    {"id": map_object["id"]}
                )


    def update_map_object(self, map_object):
        """
        Update the polygons in the database
        Creates new polygons if they do not exist
        """
        logging.info("Writing updated map to API: %s"%map_object["mesh_id"])
        params = map_object.copy()
        response = self.graphql_client.execute(updateMapGeometry, params)
        response = json.loads(response)
        if "errors" in response:
            logging.error(response["errors"])


    def _convert_to_polygons(self, mesh, furniture_height):
        """
        Convert a 3D object to a 2D polygon
        Slices the mesh at self.furniture_height and then returns all polygons on this plane
        """
        plane_origin = np.array([0, furniture_height, 0])
        plane_normal = np.array([0, 1, 0])

        lines = mesh.section(plane_normal, plane_origin)
        if lines is None:
            return []
        transform = np.array([[1,0,0,0],[0,0,1,0],[0,1,0,0],[0,0,0,1]])
        planar, _ = lines.to_planar(transform)
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
        relative_url = os.path.join(geometry_object['geometry']['directory'], geometry_object['geometry']['filename'])
        relative_url = relative_url.strip('./')
        url = os.path.join(self.geometry_endpoint, relative_url)
        fp = os.path.join('/tmp/', relative_url)
        logging.info("{} -> {}".format(url, fp))
        os.makedirs(os.path.dirname(fp), exist_ok=True)
        with urllib.request.urlopen(url) as response, open(fp, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)
        mesh = trimesh.load(fp, process=True)
        #trimesh.repair.fix_inversion(mesh, multibody=True)
        #trimesh.repair.fill_holes(mesh)
        return mesh


    def _create_map_object(self, geometry_object, polygons):
        external_polygons = [{'points': p} for p in polygons]
        building_id = geometry_object['building_id']
        if building_id is None:
            building_id = ""
        return {
            "name": geometry_object["name"],
            "mesh_id": geometry_object["id"],
            "building_id": building_id,
            "is_deleted": geometry_object["deleted"],
            "is_traversable": True,
            "internal_polygons":[],
            "visual_polygons":[],
            "external_polygons": external_polygons,
        }


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
                print(80 * "-")
                print(35 * " ", name)
                print(80 * "-")

                if ob["type"]=="robot":
                    continue
                if ob["type"]=="floor":
                    continue
                if ob['geometry']['filename'] is None:
                    print("Failed. Could not get geometry for ", name)
                    continue
                logging.info('Processing {}'.format(ob['name']))
                try:
                    mesh = self._download_geometry_resource(ob)
                except urllib.error.HTTPError:
                    logging.error("Failed. Could not download: %s"%name)
                    continue
                except Exception as e:
                    logging.error("Failed. Could not download: %s %s"%(e,name))
                    continue
                if type(mesh) is trimesh.scene.Scene:
                    logging.error("Failed. Could not process scene for: %s"%name)
                    logging.error("Try installing trimesh==2.38.42")
                    continue
                offset = np.array([ob['x'], ob['y'], ob['z']])
                mesh = self._transform_mesh(mesh, offset, ob["theta"], ob["scale"])
                polygons = self._convert_to_polygons(mesh, self.furniture_height)
                map_object = self._create_map_object(ob, polygons)
                self.update_map_object(map_object)
                time.sleep(0.1)
                #[self.draw_floorplan(p, name) for p in polygons]
                #message = self._create_map_message(ob, polygons)
                #self.kafka_producer.send('debug', message)
            #self.canvas.show()
            logging.info("\n\n --- Published map data --- \n")

            # Delete any extra map geometry
            try:
                self.delete_stale_map_geometry()
            except Exception as e:
                logging.error("Error while deleting geometry: %s"%e)

            time.sleep(20)



