const BaseResolver = require('../../BaseResolver');
const {GraphQLNonNull, GraphQLString} = require('graphql');

class BuildingResolver extends BaseResolver {

    get args() {
        return {
            buildingId: {
                type: new GraphQLNonNull(GraphQLString),
                description: 'Id for the building'
            }
        };
    }

    async resolve(parentValue, args, ctx) {
        //calling super method to check authentication if applicable
        super.resolve(parentValue, args, ctx);
        try {
            const building = await ctx.db.Building.findOne({ _id: args.buildingId });
            return building;
        } catch (e) {
            throw new Error(e);
        }
    }
}

module.exports = BuildingResolver;