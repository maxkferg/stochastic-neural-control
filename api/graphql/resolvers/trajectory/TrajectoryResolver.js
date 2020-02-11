/**
 * Fetch a single trajectory from the database
 * A trajectory is a set of ordered points that can be followed by a robot
 *
 */
const BaseResolver = require('../../BaseResolver');
const {
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull
} = require('graphql');



class TrajectoryResolver extends BaseResolver {

  get args() {
    return {
      id: {
          type: new GraphQLNonNull(GraphQLString),
          description: 'Id for the trajectory.'
      }
    };
  }

  async resolve(parentValue, args, ctx) {
    //calling super method to check authentication if applicable
    super.resolve(parentValue, args, ctx);

    let ob = await ctx.db.Trajectory.findById(args.id);
    return {
      id: ob._id,
      frame: null,
      points: ob.points,
      startPoint: ob.startPoint,
      endPoint: ob.endPoint,
      isDeleted: ob.isDeleted,
      isReady: ob.isReady,
      isSafe: ob.isSafe,
      createdAt: ob.createdAt,
      updatedAt: ob.updatedAt,
    }
  }
}

module.exports = TrajectoryResolver;