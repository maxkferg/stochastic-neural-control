const BaseResolver = require('../../BaseResolver');
const {GraphQLNonNull, GraphQLString} = require('graphql');
const auth = require('../../../auth');

class BuildingCreateMutation extends BaseResolver {

    get args() {
        return {
            ownerId: {
                type: new GraphQLNonNull(GraphQLString),
                description: 'id for the user.'
            }
        };
    }

    async resolve(_, args, ctx) {
        try {
            console.log(args);
        } catch (e) {
            throw new Error(e);
        }
    }
}

module.exports = BuildingCreateMutation;