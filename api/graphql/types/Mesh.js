const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLBoolean,
} = require('graphql');


const MeshGeometry = new GraphQLObjectType({
    name: 'MeshGeometry',
    description: 'A file describing the geometry of this object',
    fields: () => ({
        filetype: {type: GraphQLString},
        path: {type: GraphQLString},
    })
});


const MeshPhysics = new GraphQLObjectType({
    name: 'MeshPhysics',
    description: 'A description of the physics of this object',
    fields: () => ({
        stationary: {type: GraphQLBoolean},
        collision: {type: GraphQLBoolean},
    })
});


const Mesh = new GraphQLObjectType({
    name: 'Mesh',
    description: 'A 3D geometric object that exists a specific point in time',
    fields: () => ({
        id: {
            type: GraphQLString,
            resolve: (mesh) => user._id
        },
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