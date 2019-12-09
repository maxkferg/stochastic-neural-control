const BaseResolver = require('../../BaseResolver');
const {GraphQLNonNull, GraphQLString} = require('graphql');

class BuildingDeleteMutation extends BaseResolver {

    get args() {
        return {
            buildingId: {
                type: new GraphQLNonNull(GraphQLString),
                description: 'id for the building.'
            }
        };
    }

    async resolve(parentValue, args, ctx) {
        super.resolve(parentValue, args, ctx);
        try {
            const { buildingId } = args;
            await ctx.db.Building.deleteOne({ _id: buildingId })
            return { 
                id: buildingId
            }
        } catch (e) {
            throw new Error(e);
        }
    }
}

module.exports = BuildingDeleteMutation;