/**
 * Bablyon Viewer
 *
 * Renders building geometry passed as props
 * After initial load, geometry objects are only added and removed.
 * That is, the component should never be reloaded.
 *
 */
import * as React from 'react';
import PropTypes from 'prop-types';
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import { Vector3, HemisphericLight, DirectionalLight, CannonJSPlugin, ArcRotateCamera,
    MeshBuilder, DefaultRenderingPipeline, ShadowGenerator, StandardMaterial, PhysicsImpostor, Mesh, Color3 } from 'babylonjs';
import { AdvancedDynamicTexture, Button } from 'babylonjs-gui';
import { Scene, Engine } from 'react-babylonjs';
import { find } from 'lodash';

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



const styles = (theme: Theme) => ({
  fab: {
    margin: theme.spacing.unit,
    position: "absolute",
    bottom: 30 + "px",
    right: 30 + "px",
  },
});

//@ts-ignore
export interface Props extends WithStyles<typeof styles>{
    geometry: any[]
}

interface State {
  width: number
  height: number
  scene: null | BABYLON.Scene
  renderedObjects: any[]
  renderedMeshes: object
}


/**
 * setupFloors
 * Called once floor geometry has been loaded
 */
function setupFloor(floorMeshes: any, scene: any){
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


/**
 * setupWall
 * Called once wall geometry has been loaded
 */
function setupWall(meshes: any, scene: any){
    console.log(meshes,scene);
    return null;
}


/**
 * setupRobot
 * Called once robot geometry has been loaded
 */
function setupRobot(meshes: any, scene: any){
    console.log(meshes,scene);
    return null;
}



/**
 * setupObject
 * Called once object geometry has been loaded
 */
function setupObject(meshes: any, scene: any){
    console.log(meshes, scene);
    return null;
}


/**
 * setupLights
 * Called to create lights
 */
function setupLights(scene: any){
    let light = new HemisphericLight('hemi', new Vector3(0, -1, 0), scene);
    light.intensity = 0.7;

    var lightbulb = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(1, 10, 1), scene);
    lightbulb.intensity = 0.8
}


/**
 * isObjectValid
 * Return true if an object contains all the properties needed to render
 */
function isObjectValid(ob){
    return (
        ob.x !== null &&
        ob.y !== null &&
        ob.z !== null &&
        ob.theta !== null &&
        ob.deleted !== null &&
        ob.physics.stationary !== null &&
        ob.physics.collision !== null &&
        ob.geometry.filename !== null &&
        ob.geometry.directory !== null &&
        ob.geometry.filetype !== null
    )
}


/**
 * Return true if two objects will render differently
 * Ignores object width, height, depth, name and id
 */
function isObjectChanged(ob1: any, ob2: any){
    return !(
        ob1.x == ob2.x &&
        ob1.y == ob2.y &&
        ob1.z == ob2.z &&
        ob1.theta == ob2.theta &&
        ob1.deleted == ob2.deleted &&
        JSON.stringify(ob1.physics) == JSON.stringify(ob2.physics) &&
        JSON.stringify(ob1.geometry) == JSON.stringify(ob2.geometry)
    )
}


/**
 * Return true if an object mesh has changed
 * or the object has been deleted
 */
function isMeshChanged(ob1: any, ob2: any){
    return !(
        ob1.deleted == ob2.deleted &&
        JSON.stringify(ob1.physics) == JSON.stringify(ob2.physics) &&
        JSON.stringify(ob1.geometry) == JSON.stringify(ob2.geometry)
    )
}





class BabylonViewer extends React.Component<Props, State> {
    classes: any

    constructor(props: any) {
      super(props);
      this.state = {
          width: 0,
          height: 0,
          scene: null,
          renderedObjects: [],
          renderedMeshes: {},
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

    componentDidUpdate(){
        // TODO: Detect whether we have extra geometry as well
        // We can not render geometry until the scene is ready
        if (this.state.scene !== null){
            for (let newObjectKey in this.props.geometry){
                let newObject = this.props.geometry[newObjectKey];
                let prevObject = find(this.state.renderedObjects, {id: newObject.id});
                if (!isObjectValid(newObject)){
                    console.log("Ignoring invalid new object", newObject);
                } else if (!prevObject){
                    this.createObject(newObject, this.state.scene);
                } else if (!isObjectValid(prevObject)){
                    console.log("Ignoring invalid prev object", prevObject);
                } else if (isObjectChanged(newObject, prevObject)){
                    console.log("Updated",newObject, prevObject, "--->");
                    this.updateObject(prevObject, newObject, this.state.scene)
                }
            }
        }
    }

    updateWindowDimensions() {
      this.setState({ width: window.innerWidth, height: window.innerHeight });
    }

    /**
     * createObject
     * Add a new mesh to the Babylon scene
     * Adds the object (metadata) to state.renderedObjects
     * Stores the parent mesh  as state.renderedMeshes[id]
     */
    createObject = (newObject: any, scene: BABYLON.Scene) => {
        let manager = new BABYLON.AssetsManager(scene);
        let task = manager.addMeshTask(newObject.name, null, newObject.geometry.directory, newObject.geometry.filename);
        let parent = BABYLON.MeshBuilder.CreateBox("Box", {}, scene);
        let axis = new BABYLON.Vector3(0, 1, 0);
        //@ts-ignore
        parent.rotation = new BABYLON.Quaternion.RotationAxis(axis, newObject.theta);
        parent.scaling = new BABYLON.Vector3(newObject.scale, newObject.scale, newObject.scale);
        parent.position = new BABYLON.Vector3(newObject.x, newObject.y, newObject.z);
        parent.isVisible = false;
        task.onSuccess = function(t: any){
            t.loadedMeshes.forEach((mesh) => {
                mesh.parent = parent;
            });
            if (newObject.type=="floor"){
                setupFloor(t.loadedMeshes, scene);
            } else if (newObject.type=="wall"){
                setupWall(t.loadedMeshes, scene);
            } else if (newObject.type=="floor"){
                setupRobot(t.loadedMeshes, scene);
            } else if (newObject.type=="floor"){
                setupObject(t.loadedMeshes, scene);
            }
        };
        this.state.renderedMeshes[newObject.id] = parent;
        this.state.renderedObjects.push(newObject);
        this.setState({
            renderedObjects: this.state.renderedObjects,
            renderedMeshes: this.state.renderedMeshes
        });
        // Start loading the mesh
        manager.load();
    }


    /**
     * deleteObject
     * Delete an object and free up any associated memory
     */
    deleteObject = (objectId) => {
        let self = this;
        this.state.renderedMeshes[objectId].children.map((child) => {
            self.deleteObject(child);
        })
        this.state.renderedMeshes[objectId].dispose()
        this.state.renderedMeshes[objectId] = null;
    }

    /**
     * updateObject
     * Update an object in the scene so it matches the supplied metadata
     * If the object has just moved: simply translate the mesh
     * Otherwise: delete the mesh and recreate it
     */
    updateObject = (newObject: any, prevObject, scene: BABYLON.Scene) => {
        if (!isMeshChanged(newObject, prevObject)){
            //Update existing mesh
            let axis = new BABYLON.Vector3(0, 1, 0);
            let prevMesh = this.state.renderedMeshes[newObject.id];
            //@ts-ignore
            prevMesh.rotationQuaternion = new BABYLON.Quaternion.RotationAxis(axis, newObject.theta);
            prevMesh.position = new BABYLON.Vector3(newObject.scale, newObject.scale, newObject.scale);
            prevMesh.scaling = new BABYLON.Vector3(newObject.scale, newObject.scale, newObject.scale);
        } else {
            // Delete and recreate mesh
            this.deleteObject(newObject.id);
            this.createObject(newObject, scene);
        }
    }

    //onSelectedObject = (objectId: string) => {
    //  this.setState({ selectedObjectId: objectId });
    //}

    onSceneMount = (e: SceneEventArgs) => {
        const { canvas, scene } = e;
        let engine = scene.getEngine();
        const gravityVector = new Vector3(0, -9.81, 0);

        // update /Views/Shared/_Layout.cshtml to include JS for engine of choice.
        // this.scene.enablePhysics(gravityVector, new OimoJSPlugin())
        scene.enablePhysics(gravityVector, new CannonJSPlugin());

        setupLights(scene);
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

        var sphere = Mesh.CreateSphere('sphere', 10, 0.4, scene, false);
        sphere.position.y = 5;

        var darkMaterial = new StandardMaterial('Grey', scene);
        darkMaterial.diffuseColor = Color3.FromInts(255, 255, 255); // Color3.FromInts(200, 200, 200)
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
        //pipeline.depthOfFieldBlurLevel = DepthOfFieldEffectBlurLevel.Medium;
        //pipeline.depthOfFieldEnabled = true;
        //pipeline.depthOfField.focalLength = 1;
        //pipeline.depthOfField.fStop = 10;
        //pipeline.depthOfField.focusDistance = 22;
        pipeline.samples = 2;
        pipeline.fxaaEnabled = true;

        //engine.runRenderLoop(() => {
        //    if (scene) {
        //        scene.render();
        //    }
        //});
        console.log(engine);

        // We can render the geometry now
        this.setState({ scene: scene })
    }


    public render() {
        return (
            <div>
                {/*
                // @ts-ignore */}
                <Engine engineOptions={{ preserveDrawingBuffer: true}} width={this.state.width} height={this.state.height-64}>
                    <Scene
                        sceneOptions={{useGeometryIdsMap: true}}
                        onSceneMount={this.onSceneMount}
                    />
                </Engine>
            </div>
        );
    }
}

//@ts-ignore
BabylonViewer.propTypes = {
    geometry: PropTypes.array.isRequired,
    classes: PropTypes.object.isRequired,
};

//@ts-ignore
export default withStyles(styles)(BabylonViewer);