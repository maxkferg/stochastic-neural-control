const BaseResolver = require('../../BaseResolver');
const {GraphQLNonNull, GraphQLString} = require('graphql');
const auth = require('../../../auth');

class BuildingCreateMutation extends BaseResolver {

    get args() {
        return {
            ownerId: {
                type: new GraphQLNonNull(GraphQLString),
                description: 'id for the user.'
            },
            buildingName: {
                type: new GraphQLNonNull(GraphQLString),
                description: 'name for the building.'
            }
        };
    }

    async resolve(_, args, ctx) {
        try {
            const { ownerId, buildingName } = args;
             const buildingData = {
                owner_id: ownerId,
                name: buildingName,
            }
            const newBuilding = new ctx.db.Building(buildingData);
            const building = await newBuilding.save();
            return {
                id: building._id
            }
        } catch (e) {
            throw new Error(e);
        }
    }
}

module.exports = BuildingCreateMutation;