const Path = require('path');
const Influx = require('influx');
const BaseResolver = require('../../BaseResolver');
const {GraphQLNonNull, GraphQLString} = require('graphql');

/*
 * Return the last visible instance of a particular
 * ObjectId
 */
class RobotResolver extends BaseResolver {

  get args() {
    return {
      id: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'Id for the robot.'
      }
    };
  }

  async resolve(parentValue, args, ctx) {
      // Calling super method to check authentication if applicable
      super.resolve(parentValue, args, ctx);
      try {
          const robot = await ctx.db.Robot.findById(args.id);
          return robot;
      } catch (e) {
          throw new Error(e);
      }
  }
}

module.exports = RobotResolver;