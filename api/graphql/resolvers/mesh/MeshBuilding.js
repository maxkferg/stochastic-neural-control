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
    const result = await ctx.influx.query(`
      select * from mesh_position
      where building_id = ${Influx.escape.stringLit(args.buildingId)}
      order by time desc`
    ).then(rows => {
      if (rows.length==0) return;
      // Filtering rows
      if (args.deleted===true && rows[0].deleted!=="true") return;
      if (args.deleted===false && rows[0].deleted!=="false") return;
      if (args.simulated===true && rows[0].physics_simulated!=="true") return;
      if (args.simulated===false && rows[0].physics_simulated!=="false") return;
      const results = rows.map(el => {
        el.timestamp = el.time;
        el.scale = el.scale || 1.0;
        el.deleted = el.deleted === "true";
        el.geometry = {
          directory: el.geometry_directory,
          filename: el.geometry_filename,
          filetype: el.geometry_filetype,
        }
        el.physics = {
          collision: el.physics_collision,
          stationary: el.physics_stationary,
          simulated: el.physics_simulated,
        }
        return el;
      })
      return results;
    });
    return result
  }
}

module.exports = MeshBuilding;