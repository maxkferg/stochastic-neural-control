const { GraphQLObjectType, GraphQLList, GraphQLFloat } = require('graphql');
const { GraphQLDateTime } = require('graphql-iso-date');


const Velocity = new GraphQLObjectType({
    name: 'Velocity',
    description: 'A velocity control message',
    fields: () => ({
        linear: {type: GraphQLFloat},
        rotation:  {type: GraphQLFloat},
        timestamp: {type: GraphQLDateTime},
    })
});

const VelocityHistory = new GraphQLObjectType({
    name: 'VelocityHistory',
    description: 'A sequence of velocity control messages',
    fields: () => ({
        actions: {type: new GraphQLList(Velocity)},
        timestamp: {type: GraphQLDateTime},
    })
});


module.exports = VelocityHistory;
