import * as React from 'react';
import { Container, Row, Col } from 'reactstrap';
import { Vector3, HemisphericLight, DirectionalLight, CannonJSPlugin, ArcRotateCamera, DepthOfFieldEffectBlurLevel,
    MeshBuilder, DefaultRenderingPipeline, ShadowGenerator, StandardMaterial, PhysicsImpostor, Mesh, Color3 } from 'babylonjs';
import { AdvancedDynamicTexture, Button } from 'babylonjs-gui';
import { Scene, Engine } from 'react-babylonjs';
import ApolloClient from "apollo-boost";
import { gql } from "apollo-boost";

import 'babylonjs-loaders';
import * as BABYLON from 'babylonjs';
import * as CANNON from 'cannon';
window.CANNON = CANNON;

export type SceneEventArgs = {
  scene: BABYLON.Scene,
  canvas: HTMLCanvasElement
};

export type SceneOptions = {
  scene: BABYLON.Scene,
  canvas: HTMLCanvasElement,
  options: {},
};


const WALL_QUERY = gql`
    query GetMesh($type: String!) {
        meshes(type: $type) {
            id,
            name,
            width,
            height,
            depth,
            geometry {
              filetype
              filename
              directory
            }
            physics {
                    collision
              stationary
            }
        }
    }
`;


export default class Home extends React.Component {

    onSceneMount = (e: SceneEventArgs) => {
        const { canvas, scene } = e;
        let engine = scene.getEngine();

        const gravityVector = new Vector3(0, -9.81, 0);

        // update /Views/Shared/_Layout.cshtml to include JS for engine of choice.
        // this.scene.enablePhysics(gravityVector, new OimoJSPlugin())
        scene.enablePhysics(gravityVector, new CannonJSPlugin());

        let light = new HemisphericLight('hemi', new Vector3(0, -1, 0), scene);
        light.intensity = 0.9;

        var lightbulb = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(1, 10, 1), scene);
        lightbulb.intensity = 0.8
        //console.log(lightbulb)

        let shadowLight = new DirectionalLight('dir01', new Vector3(1, -0.75, 1), scene);
        shadowLight.position = new Vector3(-40, 30, -40);
        shadowLight.intensity = 0.4;
        shadowLight.shadowMinZ = 1;
        shadowLight.shadowMaxZ = 2500;

        var camera = new ArcRotateCamera('Camera', Math.PI / -2, Math.PI / 4, 16, Vector3.Zero(), scene);
        // camera.lowerAlphaLimit = -0.0001;
        // camera.upperAlphaLimit = 0.0001;
        camera.lowerRadiusLimit = 8; // zoom right into logo
        camera.upperRadiusLimit = 20;
        camera.upperBetaLimit = Math.PI / 2;
        camera.attachControl(canvas);

        let shadowGenerator: ShadowGenerator = new ShadowGenerator(1024 /* size of shadow map */, shadowLight);
        shadowGenerator.bias = 0.001;
        shadowGenerator.depthScale = 2500;

        shadowGenerator.useBlurExponentialShadowMap = true;
        // for self-shadowing (ie: blocks)
        shadowGenerator.forceBackFacesOnly = true;
        shadowGenerator.depthScale = 100;

        /*BABYLON.SceneLoader.LoadAssetContainer("./geometry/env/labv2/", "walls.obj", scene, function (container) {
            //var axis = new BABYLON.Vector3(1, 0, 0);
            //var angle = -Math.PI / 2;
            //var quaternion = BABYLON.Quaternion.RotationAxis(axis, angle);

            //for (let i = 0; i < container.meshes.length; i++){
            //    container.meshes[i].setPositionWithLocalVector(new BABYLON.Vector3(1, 0, 2));
            //    container.meshes[i].scaling = (new BABYLON.Vector3(20, 20, 20));
            //    container.meshes[i].rotationQuaternion = quaternion;
            //}
            container.addAllToScene();
        });
        */


        var sphere = Mesh.CreateSphere('sphere', 10, 0.4, scene, false);
        sphere.position.y = 5;


        const client = new ApolloClient({
          uri: "http://localhost:8888/graphql"
        });

        client.query({
            query: WALL_QUERY,
            variables: {type: "wall"}
        }).then((assets) => {
            console.log(assets)

            let assetsManager = new BABYLON.AssetsManager(scene);
            let floorTask = assetsManager.addMeshTask("parte", null, "./geometry/env/labv2/", "floors.obj");
            //let wallTask = assetsManager.addMeshTask("parte", null, "./geometry/env/labv2/", "walls.obj");
            let turtleTask = assetsManager.addMeshTask("parte", null, "./geometry/robots/turtlebot2/", "turtlebot.obj");

            for (let i=0; i<assets.data.meshes.length; i++){
                let mesh = assets.data.meshes[i];
                let meshTask = assetsManager.addMeshTask(mesh.name, null, mesh.geometry.directory, mesh.geometry.filename);
                meshTask.onSuccess = function (task) {
                    task.loadedMeshes[0].position = BABYLON.Vector3.Zero();
                    let wallMeshes = task.loadedMeshes.map(function(i){ return i})
                    // @ts-ignore
                    let wallMesh = BABYLON.Mesh.MergeMeshes(wallMeshes);
                    if (wallMesh){
                        wallMesh.physicsImpostor = new PhysicsImpostor(
                            wallMesh,
                            PhysicsImpostor.MeshImpostor,
                            {
                                mass: 0,
                                restitution: 0.9
                            },
                            scene
                        );
                    }
                }
            }


            floorTask.onSuccess = function (task) {
                task.loadedMeshes[0].position = BABYLON.Vector3.Zero();
                let floorMeshes = task.loadedMeshes.map(function(i){ return i})
                // @ts-ignore
                let floorMesh = BABYLON.Mesh.MergeMeshes(floorMeshes);

                if (floorMesh==null){
                    throw new Error("Floor failed to load");
                }
                floorMesh.physicsImpostor = new PhysicsImpostor(
                    floorMesh,
                    PhysicsImpostor.MeshImpostor,
                    {
                        mass: 0,
                        restitution: 0.9
                    },
                    scene
                );
                let redMaterial = new StandardMaterial('Red', scene);
                redMaterial.diffuseColor = Color3.FromInts(0, 255, 0);
                floorMesh.material = redMaterial;
                floorMesh.receiveShadows = true;
            }

            turtleTask.onSuccess = function (task) {
                let scale = 1/1000;
                task.loadedMeshes[0].position = BABYLON.Vector3.Zero();
                let turtleMeshes = task.loadedMeshes.map(function(i){ return i})
                // @ts-ignore
                let turtleMesh = BABYLON.Mesh.MergeMeshes(turtleMeshes);
                console.log(turtleMesh)

                for (let i=0; i<task.loadedMeshes.length; i++){
                    task.loadedMeshes[i].scaling = new BABYLON.Vector3(scale, scale, scale);
                }

                if (turtleMesh==null){
                    throw new Error("Floor failed to load");
                }
                turtleMesh.scaling = new BABYLON.Vector3(scale,0.01,0.01);
                /*
                floorMesh.physicsImpostor = new PhysicsImpostor(
                    floorMesh,
                    PhysicsImpostor.MeshImpostor,
                    {
                        mass: 0,
                        restitution: 0.9
                    },
                    scene
                );
                let redMaterial = new StandardMaterial('Red', scene);
                redMaterial.diffuseColor = Color3.FromInts(0, 255, 0);
                floorMesh.material = redMaterial;
                floorMesh.receiveShadows = true;
                */
            }


            assetsManager.onFinish = function(tasks) {
            }

            //@ts-ignore
            assetsManager.load();


        });
        /*
        BABYLON.SceneLoader.LoadAssetContainer("./geometry/env/labv2/", "floors.obj", scene, function (container) {
            //var axis = new BABYLON.Vector3(1, 0, 0);
            // var angle = -Math.PI / 2;
            //var quaternion = BABYLON.Quaternion.RotationAxis(axis, angle);

            //for (let i = 0; i < container.meshes.length; i++){
            //    container.meshes[i].setPositionWithLocalVector(new BABYLON.Vector3(1, 0, 2));
            //    container.meshes[i].scaling = (new BABYLON.Vector3(20, 20, 20));
            //    container.meshes[i].rotationQuaternion = quaternion;
            //}
            container.addAllToScene();
        });
        */

        var floor = MeshBuilder.CreateBox('ground', { width: 1, height: 0.1, depth: 10 }, scene);
        var darkMaterial = new StandardMaterial('Grey', scene);
        darkMaterial.diffuseColor = Color3.FromInts(255, 255, 255); // Color3.FromInts(200, 200, 200)
        floor.material = darkMaterial;
        floor.receiveShadows = true;

        const radiansFromCameraForShadows = -3 * (Math.PI / 4);

        scene.registerBeforeRender(() => {
            shadowLight.position.x = Math.cos(camera.alpha + radiansFromCameraForShadows) * 40;
            shadowLight.position.z = Math.sin(camera.alpha + radiansFromCameraForShadows) * 40;
            shadowLight.setDirectionToTarget(Vector3.Zero());
        });

        shadowGenerator.getShadowMap()!.renderList!.push(sphere);

        sphere.physicsImpostor = new PhysicsImpostor(
            sphere,
            PhysicsImpostor.SphereImpostor,
            {
                mass: 1,
                restitution: 0.9
            },
            scene
        );
        floor.physicsImpostor = new PhysicsImpostor(
            floor,
            PhysicsImpostor.BoxImpostor,
            {
                mass: 0,
                restitution: 0.9
            },
            scene
        );

        // GUI
        var plane = MeshBuilder.CreatePlane('plane', {size: 2}, scene);
        plane.parent = sphere;
        plane.position.y = 2;

        var advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane);

        var button1 = Button.CreateSimpleButton('but1', 'Click Me');
        button1.width = 1;
        button1.height = 0.4;
        button1.color = 'white';
        button1.fontSize = 200;
        button1.background = 'green';
        button1.onPointerUpObservable.add(function() {
            sphere.physicsImpostor!.applyImpulse(
                new Vector3(0, 10, 0), sphere.getAbsolutePosition()
            );
        });
        advancedTexture.addControl(button1);


        // Create default pipeline and enable dof with Medium blur level
        let pipeline = new DefaultRenderingPipeline("default", true, scene);
        pipeline.depthOfFieldBlurLevel = DepthOfFieldEffectBlurLevel.Medium;
        //pipeline.depthOfFieldEnabled = true;
        //pipeline.depthOfField.focalLength = 1;
        //pipeline.depthOfField.fStop = 10;
        //pipeline.depthOfField.focusDistance = 22;
        pipeline.samples = 4;
        pipeline.fxaaEnabled = true;


        engine.runRenderLoop(() => {
            if (scene) {
                scene.render();
            }
        });

        // After the fact
        window.setTimeout(() => {
            MeshBuilder.CreateBox('ground2', { width: 4, height: 0.1, depth: 10 }, scene);
        }, 4000)
    }

    public render() {
        return (
            <Container>
                <Row>
                    <Col xs="12">
                        <div>bouncy <strong>BabylonJS</strong> sphere...</div>
                        <p><strong>click</strong> label to bounce sphere - all ES6, yay!</p>
                    </Col>
                </Row>
                <Row>
                    <Col xs="12">
                        {/*
                        // @ts-ignore */}
                        <Engine engineOptions={{ preserveDrawingBuffer: true}} width={1000} height={800}>
                            <Scene
                                sceneOptions={{useGeometryIdsMap: true}}
                                onSceneMount={this.onSceneMount}
                            />
                        </Engine>
                    </Col>
                </Row>
            </Container>
        );
    }
}
