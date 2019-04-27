import * as React from 'react';
import { Container, Row, Col } from 'reactstrap';
import PropTypes from 'prop-types';
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import { Vector3, HemisphericLight, DirectionalLight, CannonJSPlugin, ArcRotateCamera, DepthOfFieldEffectBlurLevel,
    MeshBuilder, DefaultRenderingPipeline, ShadowGenerator, StandardMaterial, PhysicsImpostor, Mesh, Color3 } from 'babylonjs';
import { AdvancedDynamicTexture, Button } from 'babylonjs-gui';
import { Scene, Engine } from 'react-babylonjs';
import Fab from '@material-ui/core/Fab';
import PrimaryAppBar from '../AppBar/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import GeometryDrawer from '../GeometryDrawer/GeometryDrawer';
import AddIcon from '@material-ui/icons/Add';
import apollo from '../../apollo';
import { gql } from "apollo-boost";

import 'babylonjs-loaders';
import * as BABYLON from 'babylonjs';
import * as CANNON from 'cannon';

window.CANNON = CANNON;
// @ts-ignore
BABYLON.OBJFileLoader.MATERIAL_LOADING_FAILS_SILENTLY = false;

export type SceneEventArgs = {
  scene: BABYLON.Scene,
  canvas: HTMLCanvasElement
};

export type SceneOptions = {
  scene: BABYLON.Scene,
  canvas: HTMLCanvasElement,
  options: {},
};


const MESH_QUERY = gql`
    query GetMesh {
        meshesCurrent(deleted: false) {
            id,
            name,
            type,
            width,
            height,
            depth,
            scale,
            x
            y
            z
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



const styles = (theme: Theme) => ({
  fab: {
    margin: theme.spacing.unit,
    position: "absolute",
    bottom: 30 + "px",
    right: 30 + "px",
  },
});

//@ts-ignore
export interface Props extends WithStyles<typeof styles>{}

interface State {
  width: number
  height: number
  selectedObjectId: null | string
  creatingGeometry: boolean
}


/*
function createMirrorMaterial(glass: any, sphere: any, scene: any){
    //Ensure working with new values for glass by computing and obtaining its worldMatrix
    glass.computeWorldMatrix(true);
    var glass_worldMatrix = glass.getWorldMatrix();

    //Obtain normals for plane and assign one of them as the normal
    var glass_vertexData = glass.getVerticesData("normal");
    var glassNormal = new BABYLON.Vector3(glass_vertexData[0], glass_vertexData[1], glass_vertexData[2])
    //Use worldMatrix to transform normal into its current value
    // @ts-ignore
    glassNormal = new BABYLON.Vector3.TransformNormal(glassNormal, glass_worldMatrix)

    //Create reflecting surface for mirror surface
    // @ts-ignore
    var reflector = new BABYLON.Plane.FromPositionAndNormal(glass.position, glassNormal.scale(-1));

    //Create the mirror material
    var mirrorMaterial = new BABYLON.StandardMaterial("mirror", scene);
    mirrorMaterial.reflectionTexture = new BABYLON.MirrorTexture("mirror", 1024, scene, true);
    // @ts-ignore
    mirrorMaterial.reflectionTexture.mirrorPlane = reflector;
    // @ts-ignore
    mirrorMaterial.reflectionTexture.renderList = [sphere];
    mirrorMaterial.reflectionTexture.level = 1;
    return mirrorMaterial
}
*/


function setupFloors(floorMeshes: any, scene: any){
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
    return floorMesh
}



class Home extends React.Component<Props, State> {
    classes: any

    constructor(props: any) {
      super(props);
      this.state = {
          width: 0,
          height: 0,
          creatingGeometry: false,
          selectedObjectId: null
      };
      this.classes = props.classes;
      this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    }

    componentDidMount() {
      this.updateWindowDimensions();
      window.addEventListener('resize', this.updateWindowDimensions);
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.updateWindowDimensions);
    }

    updateWindowDimensions() {
      this.setState({ width: window.innerWidth, height: window.innerHeight });
    }

    createGeometry = () => {
      this.setState({ creatingGeometry: true });
    }

    onSelectedObject = (objectId: string) => {
      this.setState({ selectedObjectId: objectId });
    }

    onSceneMount = (e: SceneEventArgs) => {
        const { canvas, scene } = e;
        let engine = scene.getEngine();

        const gravityVector = new Vector3(0, -9.81, 0);

        // update /Views/Shared/_Layout.cshtml to include JS for engine of choice.
        // this.scene.enablePhysics(gravityVector, new OimoJSPlugin())
        scene.enablePhysics(gravityVector, new CannonJSPlugin());

        let light = new HemisphericLight('hemi', new Vector3(0, -1, 0), scene);
        light.intensity = 0.7;

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
        camera.lowerRadiusLimit = 3; // zoom right into logo
        camera.upperRadiusLimit = 16;
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

        let assetsManager = new BABYLON.AssetsManager(scene);
        var sphere = Mesh.CreateSphere('sphere', 10, 0.4, scene, false);
        sphere.position.y = 5;

        /* Load all the walls */
        apollo.query({
            query: MESH_QUERY,
            variables: {}
        }).then((assets) => {
            let meshes = assets.data.meshesCurrent

            for (let i=0; i<meshes.length; i++){
                let mesh = meshes[i];
                if (!mesh.geometry || mesh.geometry.directory==null || mesh.geometry.filename==null){
                    console.log("Invalid geometry. Ignoring ", mesh.name)
                    continue;
                }

                let meshTask = assetsManager.addMeshTask(mesh.name, null, mesh.geometry.directory, mesh.geometry.filename);
                let meshParent = BABYLON.MeshBuilder.CreateBox("Box", {}, scene);
                meshParent.isVisible = false;
                meshParent.scaling = new BABYLON.Vector3(mesh.scale, mesh.scale, mesh.scale);
                meshParent.position = new BABYLON.Vector3(mesh.x, mesh.y, mesh.z);

                if (mesh.type=="floor"){
                    meshTask.onSuccess = function(task){
                        setupFloors(task.loadedMeshes, scene);
                    }
                } else {
                    meshTask.onSuccess = function (task) {
                        task.loadedMeshes.forEach(function(m){
                            m.parent = meshParent;
                        });

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
            }
        /* Done */
        }).then(function(){
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

        //var floor = MeshBuilder.CreateBox('ground', { width: 1, height: 0.1, depth: 10 }, scene);
        var darkMaterial = new StandardMaterial('Grey', scene);
        darkMaterial.diffuseColor = Color3.FromInts(255, 255, 255); // Color3.FromInts(200, 200, 200)
        //floor.material = darkMaterial;
        //floor.receiveShadows = true;

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
        /*floor.physicsImpostor = new PhysicsImpostor(
            floor,
            PhysicsImpostor.BoxImpostor,
            {
                mass: 0,
                restitution: 0.9
            },
            scene
        );
        */

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
        pipeline.samples = 2;
        pipeline.fxaaEnabled = true;


        engine.runRenderLoop(() => {
            if (scene) {
                scene.render();
            }
        });
    }

    public render() {
        return (
            <div>
                <CssBaseline />
                <PrimaryAppBar onSelectedObject={this.onSelectedObject} />
                <GeometryDrawer open={this.state.creatingGeometry} />
                <Container className="wide">
                    <Row>
                        <Col xs="12">
                            {/*
                            // @ts-ignore */}
                            <Engine engineOptions={{ preserveDrawingBuffer: true}} width={this.state.width} height={this.state.height-64}>
                                <Scene
                                    sceneOptions={{useGeometryIdsMap: true}}
                                    onSceneMount={this.onSceneMount}
                                />
                            </Engine>
                        </Col>
                    </Row>
                    <Fab color="primary" aria-label="Add" className={this.classes.fab} onClick={this.createGeometry}>
                        <AddIcon />
                    </Fab>
                </Container>
            </div>
        );
    }
}

//@ts-ignore
Home.propTypes = {
  classes: PropTypes.object.isRequired,
};

//@ts-ignore
export default withStyles(styles)(Home);