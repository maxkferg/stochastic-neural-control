const BaseResolver = require('../../BaseResolver');
const { withFilter } = require('graphql-subscriptions');
const MESH_POSITION_TOPIC = "mesh_position";

const {
    GraphQLString,
} = require('graphql');

/*
 * Return the last visible instance of a particular
 * ObjectId
 */
class MeshPositionSubscription extends BaseResolver {

  get args() {
    return {
      id: {
        type: GraphQLString,
        description: 'Id for the object (optional).'
      }
    }
  }

  resolve (payload, args, context, info) {
    return payload
  }

  async subscribe(rootValue, args, ctx) {
    const asyncIterator = ctx.pubSub.asyncIterator([MESH_POSITION_TOPIC]);

    function isMatch(payload, variables){
      return payload.id === args.id;
    }

    return withFilter(() => asyncIterator, isMatch)(rootValue, args, ctx)
  }
}



module.exports = MeshPositionSubscription;