const {
    GraphQLList,
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLString,
} = require('graphql');

const resolvers = require('./resolvers');
const mutations = require('./mutations');
const User = require('./types/User');
const Mesh = require('./types/Mesh');
const Trajectory = require('./types/Trajectory');
const MapGeometry = require('./types/MapGeometry');
const MeshPosition = require('./types/MeshPosition');
const PointType = require('./types/Point')
const VelocityHistory = require('./types/VelocityHistory');
const Building = require('./types/Building');
const Robot = require('./types/Robot');


const Subscription = new GraphQLObjectType({
    name: 'RootSubscription',
    description: 'Root Subscription',
    fields: () => ({
        // meshPosition: new resolvers.Mesh.subscribeMeshPosition(MeshPosition, "Get notified when any mesh moves", false),
        pointCloud: new resolvers.Point.pointCloudSubscription(PointType.PointsGroup, "Subscribe points group cloud", false),
    })
});


const Query = new GraphQLObjectType({
    name: 'RootQuery',
    description: 'Root Query',
    fields: () => ({
        sample: {
            type: GraphQLString,
            description: 'Sample query which returns string!',
            resolve: () => {
                return 'Hello from GraphiQL';
            }
        },
        verifyToken: new resolvers.User.verifyToken(User, "Verify Token", true),
        users: new resolvers.User.getAllUsers(new GraphQLList(User), "Get all users", true),
        user: new resolvers.User.getUser(User, "Get user by id", true),
        robot: new resolvers.Robot.getRobot(Robot, "Get robot by id", false),
        getRobotOfBuilding: new resolvers.Robot.getRobotOfBuilding(new GraphQLList(Robot), "Get robot of building", false),
        meshesCurrent: new resolvers.Mesh.getCurrentMeshes(new GraphQLList(Mesh), "Get current meshes", false),
        meshes: new resolvers.Mesh.getAllMeshes(new GraphQLList(Mesh), "Get all meshes", false),
        meshesOfBuilding: new resolvers.Mesh.getMeshBuilding(new GraphQLList(Mesh), "Get all meshes", false),
        meshBuilding: new resolvers.Mesh.getMesh(Mesh, "Get mesh by id", false),
        meshPosition: new resolvers.Mesh.subscribeMeshPosition(MeshPosition, "Get notified when any mesh moves", false),
        mesh: new resolvers.Mesh.getMesh(Mesh, "Get mesh by id", false),
        mapGeometry: new resolvers.MapGeometry.getMapGeometry(new GraphQLList(MapGeometry), "Get all Map Geometry", false),
        trajectory: new resolvers.Trajectory.getTrajectory(Trajectory, "Get a single trajectory", false),
        trajectories: new resolvers.Trajectory.getTrajectoryList(new GraphQLList(Trajectory), "Get a list of trajectories", false),
        building: new resolvers.Building.getUserBuildings(new GraphQLList(Building), "Get all building", true),
        getBuilding: new resolvers.Building.getBuilding(Building, "Get building", true),
        guestBuildings: new resolvers.Building.getGuestBuildings(new GraphQLList(Building), "Get all guest buildings", false),
    })
});


const Mutation = new GraphQLObjectType({
    name: 'RootMutation',
    description: 'Root Mutation',
    fields: () => ({
        createUser: new mutations.UserMutations.userSignup(User, "Creates a new user", false),
        signInUser: new mutations.UserMutations.userSignin(User, "Sign in user", false),
        signInUserGoogle: new mutations.UserMutations.userSigninGoogle(User, "Sign in user", false),
        user: new mutations.UserMutations.user(User, "Updates current user", true),
        robot: new mutations.RobotMutations.updateRobot(Robot, "Update robot by id", false),
        createMesh: new mutations.MeshMutations.meshCreate(Mesh, "Creates a mesh object", false),
        createMeshBuilding: new mutations.MeshMutations.meshBuildingCreate(Mesh, "Creates a mesh building object", false),
        mesh: new mutations.MeshMutations.mesh(Mesh, "Updates current mesh object", true),
        mapGeometry: new mutations.MapGeometryMutations.mapGeometry(MapGeometry, "Update Map Geometry object", false),
        createMapGeometry: new mutations.MapGeometryMutations.createMapGeometry(MapGeometry, "Create a Map Geometry object", false),
        moveRobot: new mutations.RobotMutations.moveRobot(VelocityHistory, "Send a sequence of smooth controls to the robot", true),
        createTrajectory: new mutations.TrajectoryMutations.createTrajectory(Trajectory, "Create a new trajectory for the robot", true),
        updateTrajectory: new mutations.TrajectoryMutations.updateTrajectory(Trajectory, "Update a trajectory", true),
        removeTrajectory: new mutations.TrajectoryMutations.removeTrajectory(Trajectory, "Remove a trajectory", true),
        followTrajectory: new mutations.RobotMutations.followTrajectory(Trajectory, "Instruct a robot to follow a trajectory", true),
        createBuilding: new mutations.BuildingMutation.createBuilding(Building, "Creates a building object", true),
        deleteBuilding: new mutations.BuildingMutation.deleteBuilding(Building, "Delete a building object", true), 
        updateObject: new mutations.ObjectMutations.updateObject(Mesh, "Update object", false)
    })
});


const Schema = new GraphQLSchema({
    query: Query,
    mutation: Mutation,
    subscription: Subscription
});

module.exports = Schema;