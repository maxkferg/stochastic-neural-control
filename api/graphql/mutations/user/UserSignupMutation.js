const BaseResolver = require('../../BaseResolver');
const {GraphQLNonNull, GraphQLString, GraphQLInt} = require('graphql');
const auth = require('../../../auth');

class UserSignupMutation extends BaseResolver {

    get args() {
        return {
            email: {
                type: new GraphQLNonNull(GraphQLString),
                description: 'Email for the user.'
            },
            password: {
                type: new GraphQLNonNull(GraphQLString),
                description: 'Password for the user.'
            },
            firstName: {
                type: new GraphQLNonNull(GraphQLString),
                description: 'First name of the user.'
            },
            lastName: {
                type: new GraphQLNonNull(GraphQLString),
                description: 'Last name for the user.'
            },
        };
    }

    async resolve(_, args, ctx) {
        try {
            const user = await ctx.db.User.findOne({email: args.email}); 
            if (user) {
                throw new Error('User already exist');
            }
            const newUser = new ctx.db.User(args);
            newUser.password = await auth.hashingPassword(args.password);
            let savedUser = await newUser.save();
            savedUser.authToken = await auth.generateToken({_id: newUser._id, email: newUser.email});
            // ctx.cookies.set('token', savedUser.authToken);
            return savedUser;
        } catch (e) {
            throw new Error(e);
        }
    }
}

module.exports = UserSignupMutation;