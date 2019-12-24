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
            const building = await ctx.db.Building.findOneAndDelete({ _id: buildingId })
            return {
                id: building._id,
                owner_id: building.owner_id,
                name: building.name,
                isDeleted: true
            }
        } catch (e) {
            throw new Error(e);
        }
    }
}

module.exports = BuildingDeleteMutation;