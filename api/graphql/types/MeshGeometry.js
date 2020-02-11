const {
    GraphQLObjectType,
    GraphQLString,
} = require('graphql');


const MeshGeometry = new GraphQLObjectType({
    name: 'MeshGeometry',
    description: 'A file describing the geometry of this object',
    fields: () => ({
        filetype: {type: GraphQLString},
        filename: {type: GraphQLString},
        directory: {type: GraphQLString},
    })
});


module.exports = MeshGeometry;
