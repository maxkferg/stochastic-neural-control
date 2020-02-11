const BaseResolver = require('../../BaseResolver');
const { GraphQLNonNull, GraphQLString } = require('graphql');

class GuestBuildingsResolver extends BaseResolver {
  async resolve(parentValue, args, ctx) { 
    //calling super method to check authentication if applicable
    super.resolve(parentValue, args, ctx);
    try {
      const buildings = await ctx.db.Building.find();
      return buildings;
    } catch (e) {
      throw new Error(e);
    }
  }
}

module.exports = GuestBuildingsResolver;