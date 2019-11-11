const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLBoolean,
} = require('graphql');
const { GraphQLDateTime } = require('graphql-iso-date');


const Robot = new GraphQLObjectType({
    name: 'Robot',
    description: 'Robot entity',
    fields: () => ({
        id: {
            type: GraphQLString
        },
        name: {
            type: GraphQLString
        },
        mesh_id: {
            type: GraphQLString
        },
        owner_id: {
            type: GraphQLString
        },
        building_id: {
            type: GraphQLString
        },
        trajectory_id: {
            type: GraphQLString
        },
        isRealRobot: {
            type: GraphQLBoolean
        },
        validControlTopics: {
            type: new GraphQLList(GraphQLString)
        },
        lastCommandReceived: {
            type: GraphQLDateTime
        },
        lastPositionReceived: {
            type: GraphQLDateTime
        },
        updatedAt: {
            type: GraphQLDateTime
        },
        createdAt: {
            type: GraphQLDateTime
        },
    })
});


module.exports = Robot;