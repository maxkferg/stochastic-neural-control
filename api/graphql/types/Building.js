const {
    GraphQLObjectType,
    GraphQLString,
} = require('graphql');

const Mesh = require('./Mesh');
const Building = new GraphQLObjectType({
    name: 'Building',
    description: 'Building entity',
    fields: () => ({
        id: {
            type: GraphQLString
        },
        name: {
            type: GraphQLString
        },
        owner_id: {
            type: GraphQLString
        }
    })
});

module.exports = Building;