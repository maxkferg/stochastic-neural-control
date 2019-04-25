const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLBoolean,
} = require('graphql');
const MeshPhysics = require('./MeshPhysics');
const MeshGeometry = require('./MeshGeometry');



const Mesh = new GraphQLObjectType({
    name: 'Mesh',
    description: 'A 3D geometric object that exists a specific point in time',
    fields: () => ({
        id: { type: GraphQLString},
        name: {type: GraphQLString},
        x: {type: GraphQLFloat},
        y: {type: GraphQLFloat},
        z: {type: GraphQLFloat},
        width: {type: GraphQLFloat},
        height: {type: GraphQLFloat},
        depth: {type: GraphQLFloat},
        deleted: {type: GraphQLBoolean},
        geometry: {type: MeshGeometry},
        physics: {type: MeshPhysics},
    })
});

module.exports = Mesh;
