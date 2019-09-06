/**
 * Fetch a list of trajectories from the database
 * A trajectory is a set of ordered points that can be followed by a robot
 *
 */
const BaseResolver = require('../../BaseResolver');
const {GraphQLString, GraphQLBoolean, GraphQLInt} = require('graphql');



class TrajectoryListResolver extends BaseResolver {

  get args() {
    return {
      limit: {
          type: GraphQLInt,
          description: 'The maximum number of results to return'
      },
      returnDeleted: {
          type: GraphQLBoolean,
          description: 'Return deleted results as well (default: false)'
      }
    };
  }

  async resolve(parentValue, args, ctx) {
    //calling super method to check authentication if applicable
    super.resolve(parentValue, args, ctx);

    let query = {}
    let limit = args.limit || 1000;
    query.isDeleted = args.returnDeleted || false

    let results = await ctx.db.Trajectory.find(query);
    return results.map((ob) => ({
      id: ob._id,
      frame: "",
      points: ob.points,
      startPoint: ob.startPoint,
      endPoint: ob.endPoint,
      isReady: ob.isReady,
      isSafe: ob.isSafe,
      isDeleted: ob.isDeleted,
      createdAt: ob.createdAt,
      updatedAt: ob.updatedAt,
    }))
  }
}

module.exports = TrajectoryListResolver;