const BaseResolver = require('../../BaseResolver');
const {GraphQLNonNull, GraphQLString} = require('graphql');
const auth = require('../../../auth');

class UserSignInMutation extends BaseResolver {

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
        };
    }

    async resolve(_, args, ctx) {
        try {
            const user = await ctx.db.User.findOne({email: args.email});
            if (user) {
                const isPasswordCorrect = await auth.compareHashPassword(args.password, user.password);
                if (isPasswordCorrect) {
                    const authToken = await auth.generateToken({_id: user._id, email: user.email});
                    user.authToken = authToken;
                    return user;
                } else {
                    throw new Error('Sign in fail');
                }
            } else {
                throw new Error('Sign in fail');
            }
        } catch (e) {
            throw new Error(e);
        }
    }
}

module.exports = UserSignInMutation;