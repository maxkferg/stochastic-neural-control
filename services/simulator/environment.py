import os, inspect
import pybullet
import time



class Environment():

    def __init__(self, headless=False):
        """
        A environment for simulating robot movement
        @headless: Does not show a GUI if headless is True
        """

        #choose connection method: GUI, DIRECT, SHARED_MEMORY
        if headless:
          pybullet.connect(pybullet.DIRECT)
        else:
          pybullet.connect(pybullet.GUI)


    def start(self):
        """
        Must be called before stepping the environment.
        Starts the simulation
        """
        pybullet.setGravity(0, 0, -10)


    def load_geometry(self, filename, position, scale=1, stationary=False):
        meshScale = [scale, scale, scale]
        visualShapeId = pybullet.createVisualShape(
          shapeType=pybullet.GEOM_MESH,
          fileName=filename,
          rgbaColor=[1, 1, 1, 1],
          specularColor=[0.4, .4, 0],
          meshScale=meshScale)

        collisionShapeId = pybullet.createCollisionShape(
          shapeType=pybullet.GEOM_MESH,
          flags=pybullet.GEOM_FORCE_CONCAVE_TRIMESH,
          fileName=filename,
          meshScale=meshScale)

        if stationary:
            baseMass = 0
        else:
            baseMass = 1

        mb = pybullet.createMultiBody(baseMass=baseMass,
          baseOrientation=[1,0,0,1],
          baseInertialFramePosition=[0, 0, 0],
          baseCollisionShapeIndex=collisionShapeId,
          baseVisualShapeIndex=visualShapeId,
          basePosition=position,
          useMaximalCoordinates=True)




    def step(self):
        pybullet.stepSimulation()


    def __del__(self):
        print("finished")
        #remove all objects
        pybullet.resetSimulation()

        #disconnect from the physics server
        pybullet.disconnect()