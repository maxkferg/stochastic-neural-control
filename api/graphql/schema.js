const {
    GraphQLList,
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLString,
} = require('graphql');

const resolvers = require('./resolvers');
const mutations = require('./mutations');
const auth = require('../auth');
const User = require('./types/User');
const Mesh = require('./types/Mesh');
const MapGeometry = require('./types/MapGeometry');
const MeshPosition = require('./types/MeshPosition');
const VelocityHistory = require('./types/VelocityHistory');


const Subscription = new GraphQLObjectType({
    name: 'RootSubscription',
    description: 'Root Subscription',
    fields: () => ({
        meshPosition: new resolvers.Mesh.subscribeMeshPosition(MeshPosition, "Get notified when any mesh moves", false),
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
        users: new resolvers.User.getAllUsers(new GraphQLList(User), "Get all users", true),
        user: new resolvers.User.getUser(User, "Get user by id", true),
        meshesCurrent: new resolvers.Mesh.getCurrentMeshes(new GraphQLList(Mesh), "Get current meshes", false),
        meshes: new resolvers.Mesh.getAllMeshes(new GraphQLList(Mesh), "Get all meshes", false),
        mesh: new resolvers.Mesh.getMesh(Mesh, "Get mesh by id", false),
        mapGeometry: new resolvers.MapGeometry.getMapGeometry(new GraphQLList(MapGeometry), "Get all Map Geometry", false)
    })
});


const Mutation = new GraphQLObjectType({
    name: 'RootMutation',
    description: 'Root Mutation',
    fields: () => ({
        createUser: new mutations.UserMutations.userSignup(User, "Creates a new user", false),
        user: new mutations.UserMutations.user(User, "Updates current user", true),
        createMesh: new mutations.MeshMutations.meshCreate(Mesh, "Creates a mesh object", false),
        mesh: new mutations.MeshMutations.mesh(Mesh, "Updates current mesh object", true),
        moveRobot: new mutations.RobotMutations.moveRobot(VelocityHistory, "Send a sequence of smooth controls to the robot", true)
    })
});


const Schema = new GraphQLSchema({
    query: Query,
    mutation: Mutation,
    subscription: Subscription
});

module.exports = Schema;