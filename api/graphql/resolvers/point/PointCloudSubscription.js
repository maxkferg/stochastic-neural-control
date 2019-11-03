const BaseResolver = require('../../BaseResolver');
const { withFilter } = require('graphql-subscriptions');
const POINT_CLOUD_TOPIC = "point_cloud_topic";

const {
    GraphQLString,
} = require('graphql');

/*
 * Return the last visible instance of a particular
 * ObjectId
 */
class pointCloudSubscription extends BaseResolver {

  get args() {
    return {
      id: {
        type: GraphQLString,
        description: 'robot id for the object (optional).'
      }
    }
  }

  resolve (payload, args, context, info) {
    // Manipulate and return the new value
    return payload;
  }

  subscribe(_, args, ctx) {
    const asyncIterator = ctx.pubSub.asyncIterator([POINT_CLOUD_TOPIC]);
    return asyncIterator;

    // Using withFilter in a method does not seem to be supported
    //return withFilter(() => asyncIterator, (payload, variables) => {
    //    return payload.id === args.id;
    //});
  }
}



module.exports = pointCloudSubscription;