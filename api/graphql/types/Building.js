const {
    GraphQLObjectType,
    GraphQLString,
    // GraphQLInt
} = require('graphql');


const Building = new GraphQLObjectType({
    name: 'Building',
    description: 'Building entity',
    fields: () => ({
        id: {
            type: GraphQLString
        }
    })
});

module.exports = Building;