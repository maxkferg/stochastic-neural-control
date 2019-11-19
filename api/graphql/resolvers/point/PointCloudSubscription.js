const BaseResolver = require('../../BaseResolver');
const { withFilter } = require('graphql-subscriptions');
const POINT_CLOUD_TOPIC = "point_cloud_topic";
const pointService = require('../../../services/PointService');
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
        description: 'robot id for the object'
      },
      strategy: {
        type: GraphQLString,
        description: 'strategy for subs point cloud'
      }
    }
  }

  async resolve (payload, args, context, info) {
    console.log(args)
    if (args.strategy === 'random') {
      const points = await pointService.getRandomPointsOfRobot(args.id)
      return points[0];
    }
    // Manipulate and return the new value
    return payload.points;
  }

  subscribe(_, args, ctx) {
    const asyncIterator =  withFilter(() => ctx.pubSub.asyncIterator([POINT_CLOUD_TOPIC]), (payload) => {
      return payload.id === args.id;
    })()
    return asyncIterator;
  }
}



module.exports = pointCloudSubscription;