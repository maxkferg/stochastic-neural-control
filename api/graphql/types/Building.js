const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLBoolean
} = require('graphql');

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
        },
        isDeleted: {
            type: GraphQLBoolean
        }
    })
});

module.exports = Building;