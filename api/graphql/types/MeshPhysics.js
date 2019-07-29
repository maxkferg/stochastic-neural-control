const {
    GraphQLObjectType,
    GraphQLBoolean,
} = require('graphql');


const MeshPhysics = new GraphQLObjectType({
    name: 'MeshPhysics',
    description: 'A description of the physics of this object',
    fields: () => ({
        stationary: {type: GraphQLBoolean},
        collision: {type: GraphQLBoolean},
        simulated: {type: GraphQLBoolean},
    })
});



module.exports = MeshPhysics;
