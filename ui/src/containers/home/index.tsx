import * as React from 'react';
import { Container, Row, Col } from 'reactstrap';
import { Vector3, HemisphericLight, DirectionalLight, CannonJSPlugin, ArcRotateCamera,
    MeshBuilder, ShadowGenerator, StandardMaterial, PhysicsImpostor, Mesh, Color3 } from 'babylonjs';
import { AdvancedDynamicTexture, Button } from 'babylonjs-gui';
import { Scene, Engine } from 'react-babylonjs';

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

// @ts-ignore
/*BABYLON.Scene.prototype.clone = function(engine){
    var s = new BABYLON.Scene(engine);
    var props = Object.keys(this);
    for(var i=0; i < props.length; i++){
        if(Object.prototype.toString.call(this[props[i]]) == '[object Array]'){
            for(var j=0; j<this[props[i]]; j++){
                if(this[props[i]][j].clone){
                    s[props[i]].push(this[props[i]][j].clone());
                }else{
                    s[props[i]].push(this[props[i]][j]);
                }
            }
        }
    }
    return s;
}
*/

export default class Home extends React.Component {

    onSceneMount = (e: SceneEventArgs) => {
        const { canvas, scene } = e;
        let engine = scene.getEngine();

        const gravityVector = new Vector3(0, -9.81, 0);

        // update /Views/Shared/_Layout.cshtml to include JS for engine of choice.
        // this.scene.enablePhysics(gravityVector, new OimoJSPlugin())
        scene.enablePhysics(gravityVector, new CannonJSPlugin());

        let light = new HemisphericLight('hemi', new Vector3(0, -1, 0), scene);
        light.intensity = 0.8;

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

        var floor = MeshBuilder.CreateBox('ground', { width: 10, height: 0.1, depth: 10 }, scene);

        /*BABYLON.SceneLoader.Append("./geometry/env/lab/", "output_walls.obj", scene, function (newScene) {
            for (let i = 0; i < newScene.meshes.length; i++){
                newScene.meshes[i].scaling.multiply(new BABYLON.Vector3(100, 100, 100));
            }
            //newScene.position.x  =  2;
            //newScene.position.y  =  3;
            //newScene.position.z  =  4;
        });*/

        BABYLON.SceneLoader.LoadAssetContainer("./geometry/env/lab/", "output_walls.obj", scene, function (container) {
            //var meshes = container.meshes;
            //var materials = container.materials;
            //...
            var axis = new BABYLON.Vector3(1, 0, 0);
            var angle = Math.PI / 2;
            var quaternion = BABYLON.Quaternion.RotationAxis(axis, angle);

            for (let i = 0; i < container.meshes.length; i++){
                container.meshes[i].setPositionWithLocalVector(new BABYLON.Vector3(1, 2, 2));
                container.meshes[i].scaling = (new BABYLON.Vector3(20, 20, 20));
                container.meshes[i].rotationQuaternion = quaternion;
            }
            // Adds all elements to the scene
            // @ts-ignore
            //container.scene.clone();
            container.addAllToScene();
        });

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

        var sphere = Mesh.CreateSphere('sphere', 10, 2, scene, false);
        sphere.position.y = 5;

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

        engine.runRenderLoop(() => {
            if (scene) {
                scene.render();
            }
        });
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
