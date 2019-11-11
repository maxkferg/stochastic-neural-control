const BaseResolver = require('../../BaseResolver');
const {GraphQLNonNull, GraphQLString} = require('graphql');

class BuildingResolver extends BaseResolver {

    get args() {
        return {
            ownerId: {
                type: new GraphQLNonNull(GraphQLString),
                description: 'Id for the user.'
            }
        };
    }

    async resolve(parentValue, args, ctx) {
        //calling super method to check authentication if applicable
        super.resolve(parentValue, args, ctx);
        try {
            const buildings = await ctx.db.Building.find({owner_id: args.ownerId});
            return buildings;
        } catch (e) {
            throw new Error(e);
        }
    }
}

module.exports = BuildingResolver;