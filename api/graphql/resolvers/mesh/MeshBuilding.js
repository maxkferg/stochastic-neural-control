const Influx = require('influx');
const BaseResolver = require('../../BaseResolver');
const {GraphQLNonNull, GraphQLString} = require('graphql');

/*
 * Return the last visible instance of a particular
 * ObjectId
 */
class MeshBuilding extends BaseResolver {

  get args() {
    return {
      buildingId: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'Id for the building'
      }
    };
  }

  async resolve(parentValue, args, ctx) {
    super.resolve(parentValue, args, ctx);
    console.log(args);
    return ctx.influx.query(`
      select * from mesh_position
      where building_id = ${Influx.escape.stringLit(args.buildingId)}
      order by time desc`
    ).then(rows => {
      if (rows.length==0){
        return;
      }
      console.log(rows);
      return [];
    });
  }
}

module.exports = MeshBuilding;