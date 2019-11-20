const BaseResolver = require('../../BaseResolver');
const {GraphQLString, GraphQLInt} = require('graphql');

class UserMutation extends BaseResolver {

    get args() {
        return {
            password: {
                type: GraphQLString,
                description: 'Password for the user.'
            },
            fullName: {
                type: GraphQLString,
                description: 'full name of the user.'
            },
            age: {
                type: GraphQLInt,
                description: 'Age for the user.'
            }
        };
    }

    async resolve(parentValue, args, ctx) {
        //calling super method to check authentication if applicable
        super.resolve(parentValue, args, ctx);

        let user = await ctx.db.User.find({_id: ctx.user._id});

        user.password = args.password || user.password;
        user.fullName = args.fullName || user.fullName;
        user.age = args.age || user.age;

        try {
            return await user.save();
        } catch (e) {
            throw new Error(e);
        }
    }
}

module.exports = UserMutation;