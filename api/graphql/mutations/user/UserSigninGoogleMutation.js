const BaseResolver = require('../../BaseResolver');
const {GraphQLNonNull, GraphQLString} = require('graphql');
const auth = require('../../../auth');

class UserSigninGoogleMutation extends BaseResolver {

    get args() {
        return {
            tokenId: {
                type: new GraphQLNonNull(GraphQLString),
                description: 'Email for the user.'
            }
        };
    }

    async resolve(_, args, ctx) {
        try {
            const googlePayload = await auth.verifyGoogleToken(args.tokenId);
            if (googlePayload) {
               const { email, family_name } = googlePayload;
               if (!email) {
                   throw new Error('Sign in with google fail');
               }
               const user = await ctx.db.User.findOne({email});
               if (user) {
                    const authToken = await auth.generateToken({_id: user._id, email: user.email});
                    user.authToken = authToken;
                    return user;
               } else {
                    const newUserRecord = {
                        email,
                        firstName: family_name
                    }
                    const newUser = new ctx.db.User(newUserRecord);
                    let savedUser = await newUser.save();
                    savedUser.authToken = await auth.generateToken({_id: newUser._id, email: newUser.email});
                    return savedUser;
               }
            }
        } catch (e) {
            throw new Error(e);
        }
    }
}

module.exports = UserSigninGoogleMutation;