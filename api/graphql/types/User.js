const {
    GraphQLObjectType,
    GraphQLString,
    // GraphQLInt
} = require('graphql');


const User = new GraphQLObjectType({
    name: 'User',
    description: 'User entity',
    fields: () => ({
        id: {
            type: GraphQLString,
            resolve: (user) => user._id
        },
        password: { type: GraphQLString},
        email: {type: GraphQLString},
        fullName: {type: GraphQLString},
        // age: {type: GraphQLInt},
        authToken: {type: GraphQLString},
    })
});

module.exports = User;