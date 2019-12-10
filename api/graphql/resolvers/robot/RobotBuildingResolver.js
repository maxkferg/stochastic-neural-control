const BaseResolver = require('../../BaseResolver');
const {GraphQLNonNull, GraphQLString} = require('graphql');

/*
 * Return the last visible instance of a particular
 * ObjectId
 */
class RobotBuildingResolver extends BaseResolver {

  get args() {
    return {
      buildingId: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'Id for the building.'
      }
    };
  }

  async resolve(parentValue, args, ctx) {
      // Calling super method to check authentication if applicable
      super.resolve(parentValue, args, ctx);
      const { buildingId } = args;
      try {
          const robot = await ctx.db.Robot.find({ building_id: buildingId});
          return robot;
      } catch (e) {
          throw new Error(e);
      }
  }
}

module.exports = RobotBuildingResolver;