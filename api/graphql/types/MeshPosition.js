const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLBoolean,
} = require('graphql');


const Position = new GraphQLObjectType({
    name: 'Position',
    description: 'An object position',
    fields: () => ({
        x: {type: GraphQLFloat},
        y: {type: GraphQLFloat},
        z: {type: GraphQLFloat},
        theta: {type: GraphQLFloat},
    })
});


const MeshPosition = new GraphQLObjectType({
    name: 'MeshPosition',
    description: 'The position of a mesh in time',
    fields: () => ({
        id: { type: GraphQLString},
        position: {type: Position},
    })
});

module.exports = MeshPosition;
