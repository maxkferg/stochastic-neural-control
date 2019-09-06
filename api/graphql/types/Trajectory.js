const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLList,
    GraphQLFloat,
    GraphQLBoolean,
    GraphQLNonNull,
} = require('graphql');
const { GraphQLDateTime } = require('graphql-iso-date');
//const { Point2D } = require('./Point');


const Trajectory = new GraphQLObjectType({
    name: 'Trajectory',
    description: 'A trajectory for a mobile robot',
    fields: () => ({
        id: { type: GraphQLString},
        frame: {type: GraphQLString},
        startPoint: {type: new GraphQLList(GraphQLFloat)},
        endPoint: {type: new GraphQLList(GraphQLFloat)},
        points: {type: new GraphQLList(GraphQLList(GraphQLFloat))},
        isDeleted: {type: GraphQLBoolean},
        isReady: {type: GraphQLBoolean},
        isSafe: {type: GraphQLBoolean},
        createdAt: {type: GraphQLDateTime},
        updatedAt: {type: GraphQLDateTime},
    })
});

module.exports = Trajectory;
