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
    MeshBuilder, DefaultRenderingPipeline, ShadowGenerator, PhysicsImpostor } from 'babylonjs';
import { AdvancedDynamicTexture, Button } from 'babylonjs-gui';
import { Scene, Engine } from 'react-babylonjs';
import 'babylonjs-loaders';
import * as BABYLON from 'babylonjs';
import * as CANNON from 'cannon';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
window.CANNON = CANNON;
// @ts-ignore
// @ts-ignore
//BABYLON.OBJFileLoader.MATERIAL_LOADING_FAILS_SILENTLY = false;
//debugger
// @ts-ignore
//BABYLON.OBJFileLoader.COMPUTE_NORMALS = true
// @ts-ignore
//BABYLON.OBJFileLoader.OPTIMIZE_WITH_UV = true;
//BABYLON.OBJFileLoader.COMPUTE_NORMALS = true;
//BABYLON.OBJFileLoader.INVERT_X = true;

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
    margin: theme.spacing(),
    position: "absolute",
    bottom: 30 + "px",
    right: 30 + "px",
  },
});


/**
 * setupFloors
 * Called once floorx geometry has been loaded
 */
function setupFloor(objectData: any, parentMesh: any,  floorMeshes: any, scene: BABYLON.Scene){
    let floorMesh = BABYLON.Mesh.MergeMeshes(floorMeshes);
    if (floorMesh==null){
        throw new Error("Floor failed to load");
    }
    floorMesh.physicsImpostor = new PhysicsImpostor(
        floorMesh,
        PhysicsImpostor.PlaneImpostor,
        {
            mass: 0,
            restitution: 0.9
        },
        scene
    );
    //let redMaterial = new StandardMaterial('Red', scene);
    //redMaterial.diffuseColor = Color3.FromInts(0, 255, 0);
    //floorMesh.material = redMaterial;
    floorMesh.receiveShadows = true;
    return floorMesh
}


/**
 * setupWall
 * Called once wall geometry has been loaded
 */
function setupWall(objectData: any, parentMesh: any,  scene: BABYLON.Scene){
    console.log(objectData,parentMesh,scene);
    parentMesh.scale.x = -objectData.scale.x;
}


/**
 * setupRobot
 * Called once robot geometry has been loaded
 */
function setupRobot(objectData: any, parentMesh: any,  scene: BABYLON.Scene){
    console.log(objectData,parentMesh,scene);
    // Flip mesh in the y direction
    //        let axis = new BABYLON.Vector3(0, 1, 0);
    //    parent.rotation = new BABYLON.Quaternion.RotationAxis(axis, newObject.theta);
    return null;
}



/**
 * setupObject
 * Called once object geometry has been loaded
 */
function setupObject(objectData: any, parentMesh: any,  scene: BABYLON.Scene){
    console.log(objectData,parentMesh,scene);
    return null;
}


/**
 * setupLights
 * Called to create lights
 */
function setupLights(scene: any){
    let ceiling = 2
    // Ambient light
    let light = new HemisphericLight('hemi1', new Vector3(0, 1, 0), scene);
    light.intensity = 0.4;

    // Ambient light (at a different angle)
    let shadow = new HemisphericLight('hemi2', new Vector3(0.3, 1, 0), scene);
    shadow.intensity = 0.1;

    var lightbulb1 = new BABYLON.PointLight("pointLight1", new BABYLON.Vector3(0, ceiling, 0), scene);
    lightbulb1.intensity = 0.4

    var lightbulb2 = new BABYLON.PointLight("pointLight2", new BABYLON.Vector3(2, ceiling, 2), scene);

    lightbulb2.intensity = 0.4

    var lightbulb3 = new BABYLON.PointLight("pointLight3", new BABYLON.Vector3(-2, ceiling, -2), scene);
    lightbulb3.intensity = 0.4
}



/**
 * setupObjectButton
 * Create an interactive button above an object
 */
function setupObjectButton(objectData: any, parentMesh: any, scene: BABYLON.Scene, onClick: Function){
    let planeName = objectData.name + '-plane';
    let buttonName = objectData.name+'-button';
    let plane = MeshBuilder.CreatePlane(planeName, {size: 1.4}, scene);
    plane.parent = parentMesh;
    plane.scaling.x = 1/parentMesh.scaling.x;
    plane.scaling.y = 1/parentMesh.scaling.y;
    plane.scaling.z = 1/parentMesh.scaling.z;
    plane.position.y = 1/parentMesh.scaling.y;

    let advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane);
    let button1 = Button.CreateSimpleButton(buttonName, objectData.name);

    button1.width = 0.7;
    button1.height = 0.2;
    button1.color = 'white';
    button1.fontSize = 100;
    button1.background = 'green';
    button1.onPointerUpObservable.add(function() {
        onClick(objectData.id, objectData.type);
    });
    advancedTexture.addControl(button1);
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
    let tolerance = 0.001; // 1 millimeter
    return !(
        Math.abs(ob1.x - ob2.x) < tolerance &&
        Math.abs(ob1.y - ob2.y) < tolerance &&
        Math.abs(ob1.z - ob2.z) < tolerance &&
        Math.abs(ob1.theta - ob2.theta) < tolerance &&
        ob1.deleted == ob2.deleted &&
        JSON.stringify(ob1.physics) == JSON.stringify(ob2.physics) &&
        JSON.stringify(ob1.geometry) == JSON.stringify(ob2.geometry)
    )
}


/**
 * Return true if an object mesh has changed
 * or the object has been deleted
 */
function isMeshMetadataChanged(ob1: any, ob2: any){
    return !(
        ob1.deleted == ob2.deleted &&
        JSON.stringify(ob1.physics) == JSON.stringify(ob2.physics) &&
        JSON.stringify(ob1.geometry) == JSON.stringify(ob2.geometry)
    )
}



//@ts-ignore
export interface Props extends WithStyles<typeof styles>{
    geometry: any[]
    onSelectedObject: Function
    deleteMesh: any[]
    toggleGeo: boolean
    points: any[]
    showGeometries: boolean
    pointCloudLimit: Number
    marker: boolean
    match: any
}

interface State {
  width: Number
  height: Number
  scene: null | BABYLON.Scene
  renderedObjects: Object
  renderedMeshes: Object
}




class BabylonViewer extends React.Component<Props, State> {
    classes: any
    renderedPoint: BABYLON.Mesh[]
    constructor(props: any) {
      super(props);
      this.state = {
          width: 0,
          height: 0,
          scene: null,
          renderedObjects: {},
          renderedMeshes: {},
      };
      this.renderedPoint = []
      this.classes = props.classes;
      this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
      // @ts-ignore
      if ('OBJFileLoader' in BABYLON){
          // @ts-ignore
          BABYLON.OBJFileLoader.OPTIMIZE_WITH_UV = true;
          // @ts-ignore
          BABYLON.OBJFileLoader.COMPUTE_NORMALS = true;
      }
    }

    componentDidMount() {
      this.updateWindowDimensions();
      window.addEventListener('resize', this.updateWindowDimensions);
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.updateWindowDimensions);
    }

    createSphere(position) {
        const { scene } = this.state;
        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {
            diameter: 0.1
        }, scene);
        sphere.position = new BABYLON.Vector3(
            position.x,
            position.y,
            position.z
        );
        return sphere
    }

    shouldComponentUpdate(nextProps) {
        if (nextProps.match.params.buildingId !== this.props.match.params.buildingId) {
            this.setState({
                renderedObjects: {}
            })
        }
        return true;
    }
    enableGeometries = () => {
        if (!this.props.showGeometries) {
            for (let key in this.state.renderedMeshes) {
                if (this.state.renderedMeshes[key]) {
                    this.state.renderedMeshes[key].setEnabled(false)
                }
            }
        } else {
            for (let key in this.state.renderedMeshes) {
                if (this.state.renderedMeshes[key]) {
                    this.state.renderedMeshes[key].setEnabled(true)
                }
            }
        }
    }
    componentDidUpdate(prevProps) {
        // TODO: Detect whether we have extra geometry as well
        // We can not render geometry until the scene is ready
        this.enableGeometries()
        if (this.state.scene !== null && this.props.marker !== prevProps.marker){
            let assetManager = new BABYLON.AssetsManager(this.state.scene);
            let objectsToBeCreated: any[] = [];
            let objectsToBeDeleted: any[] = this.props.deleteMesh;
            console.log(this.props.geometry, this.state.renderedObjects)
            for (let newObjectKey in this.props.geometry){
                let newObject = this.props.geometry[newObjectKey];
                let prevObject = this.state.renderedObjects[newObject.id];
                if (!isObjectValid(newObject)){
                    console.log("Ignoring invalid new object", newObject);
                } else if (!prevObject){
                    console.log('create object');
                    objectsToBeCreated.push(newObject)
                } else if (!isObjectValid(prevObject)) {
                    console.log("Ignoring invalid prev object", prevObject);
                } else if (isObjectChanged(newObject, prevObject)){
                    this.updateObject(prevObject, newObject, this.state.scene)
                }
            }

            this.setState({
                renderedObjects: this.state.renderedObjects
            })

            if (this.props.points) {
                this.removeOldPoints()
                this.props.points.forEach(point => {
                    this.renderedPoint.push(this.createSphere(point.position))
                })
            }
            if (objectsToBeCreated.length){
                for (let newObject of objectsToBeCreated) {
                    if (this.state.scene){
                        this.createObject(newObject, this.state.scene, assetManager);
                    }
                };
                assetManager.load();
            }
            if (objectsToBeDeleted.length) {
                for (let objectId of objectsToBeDeleted) {
                    this.deleteObject(objectId);
                }
            }
        }
    }

    removeOldPoints = () => {
        const { pointCloudLimit, points } = this.props;
        if (this.renderedPoint.length + points.length> pointCloudLimit) {
            this.renderedPoint.forEach(point => point.dispose())
            this.renderedPoint = []
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
    createObject = (newObject: any, scene: BABYLON.Scene, assetManager?: BABYLON.AssetsManager) => {
        let self = this;
        let manager = assetManager || new BABYLON.AssetsManager(scene);
        let task = manager.addMeshTask(newObject.name, null, newObject.geometry.directory, newObject.geometry.filename);
        let parent = BABYLON.MeshBuilder.CreateBox("Box", {}, scene);
        let axis = new BABYLON.Vector3(0, 1, 0);
        //@ts-ignore
        parent.rotation = new BABYLON.Quaternion.RotationAxis(axis, newObject.theta);
        parent.scaling = new BABYLON.Vector3(newObject.scale, newObject.scale, newObject.scale);
        parent.position = new BABYLON.Vector3(newObject.x, newObject.y, newObject.z);
        parent.isVisible = false;
        if (newObject.type=="wall" || newObject.type=="floor"){
            parent.scaling = new BABYLON.Vector3(newObject.scale, newObject.scale, -newObject.scale);
        }

        task.onSuccess = function(t: any){
            t.loadedMeshes.forEach((mesh) => {
                mesh.parent = parent;
            });
            if (newObject.type=="floor"){
                // setupFloor(newObject, parent, t.loadedMeshes, scene);
            } else if (newObject.type=="wall"){
                setupWall(newObject, parent, scene);
            } else if (newObject.type=="robot"){
                // @ts-ignore
                setupRobot(newObject, parent, scene);
                setupObjectButton(newObject, parent, scene, self.onSelectedObject);
            } else if (newObject.type=="object"){
                setupObject(newObject, parent, scene, );
                setupObjectButton(newObject, parent, scene, self.onSelectedObject);
            }
        };
        this.state.renderedMeshes[newObject.id] = parent;
        this.state.renderedObjects[newObject.id] = newObject;
        this.setState({
            renderedObjects: this.state.renderedObjects,
            renderedMeshes: this.state.renderedMeshes
        });

        // Start loading the mesh
        //manager.load();
    }


    /**
     * deleteObject
     * Delete an object and free up any associated memory
     */
    deleteObject = (objectId) => {
        let self = this;
        if (this.state.renderedMeshes[objectId]) {
            if (this.state.renderedMeshes[objectId].children && this.state.renderedMeshes[objectId].children.length) {
                this.state.renderedMeshes[objectId].children.forEach((child) => {
                    self.deleteObject(child);
                });
            }
            this.state.renderedMeshes[objectId].dispose();
            this.state.renderedMeshes[objectId] = null;
        }
    }

    /**
     * updateObject
     * Update an object in the scene so it matches the supplied metadata
     * If the object has just moved: simply translate the mesh
     * Otherwise: delete the mesh and recreate it
     */
    updateObject = (prevObject: any, newObject: any, scene: BABYLON.Scene) => {
        if (!isMeshMetadataChanged(newObject, prevObject)){
            //Update existing mesh
            let prevMesh = this.state.renderedMeshes[newObject.id];
            if (prevMesh === null){
                console.warn("Mesh ",newObject.id, "not rendered yet")
                return
            } 
            prevMesh.rotation = new BABYLON.Vector3(0, -newObject.theta, 0);
            prevMesh.position = new BABYLON.Vector3(newObject.x, newObject.y, newObject.z);
            prevMesh.scaling = new BABYLON.Vector3(newObject.scale, newObject.scale, newObject.scale);
            this.state.renderedObjects[newObject.id] = newObject;
            console.log("Updated mesh:", newObject.id)
        } else {
            console.warn("Replaced mesh:", newObject.id)
            // Delete and recreate mesh
            //this.deleteObject(newObject.id);
            //this.createObject(newObject, scene);
        }
    }

    /**
     * onSelectedObject
     * Called when an object in the scene is selected
     */
    onSelectedObject = (objectId: string, type: string) => {
      this.props.onSelectedObject(objectId, type);
    }

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
                    <Scene onSceneMount={this.onSceneMount} sceneOptions={{}} />
                </Engine>
            </div>
        );
    }
}


//@ts-ignore
BabylonViewer.propTypes = {
    geometry: PropTypes.array.isRequired,
    classes: PropTypes.object.isRequired,
    onSelectedObject: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    pointCloudLimit: state.pointCloudSetting.limit,
    pointCloudStrategy: state.pointCloudSetting.strategy,
    showGeometries:state.pointCloudSetting.showGeometries,
})
//@ts-ignore

export default connect(mapStateToProps)(withStyles(styles)(withRouter(BabylonViewer)));