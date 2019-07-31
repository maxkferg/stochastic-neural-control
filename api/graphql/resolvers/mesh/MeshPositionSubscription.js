const BaseResolver = require('../../BaseResolver');
const { withFilter } = require('graphql-subscriptions');
const MESH_POSITION_TOPIC = "mesh_position";

const {
    GraphQLNonNull,
    GraphQLBoolean,
    GraphQLString,
    GraphQLInt
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
    // Manipulate and return the new value
    return payload;
  }

  subscribe(_, args, ctx) {
    const asyncIterator = ctx.pubSub.asyncIterator([MESH_POSITION_TOPIC]);
    return asyncIterator;
    
    // Using withFilter in a method does not seem to be supported
    //return withFilter(() => asyncIterator, (payload, variables) => {
    //    return payload.id === args.id;
    //});
  }
}



module.exports = MeshPositionSubscription;