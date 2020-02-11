const Influx = require('influx');
const BaseResolver = require('../../BaseResolver');
const {GraphQLString, GraphQLInt, GraphQLBoolean} = require('graphql');

class MeshCurrentResolver extends BaseResolver {

  get args() {
    return {
      type: {
          type: GraphQLString,
          description: 'The mesh type (wall, floor, robot, object)'
      },
      deleted: {
          type: GraphQLBoolean,
          description: 'Optionally filter by objects with deleted=$deleted'
      },
      simulated: {
          type: GraphQLBoolean,
          description: 'Optionally filter by objects with physics.simulated=$simulated'
      },
      limit: {
          type: GraphQLInt,
          description: 'The maximum number of results to return'
      },
    };
  }

  async resolve(parentValue, args, ctx) {
    //calling super method to check authentication if applicable
    super.resolve(parentValue, args, ctx);
    let query;

    if (args.type) {
      query = `
        SHOW TAG VALUES from mesh_position
        WITH key = id
        WHERE type = ${Influx.escape.stringLit(args.type)}`
    } else {
      query = `
        SHOW TAG VALUES from mesh_position
        WITH key = id`
    }

    const objectIds = await ctx.influx.query(query);
    const results = objectIds.map((objectId) => {
      return ctx.influx.query(`
        select * from mesh_position
        where id = ${Influx.escape.stringLit(objectId.value)}
        order by time desc
        limit 1`
      ).then(rows => {
        if (rows.length==0) return;
        // Filtering rows
        if (args.deleted===true && rows[0].deleted!=="true") return;
        if (args.deleted===false && rows[0].deleted!=="false") return;
        if (args.simulated===true && rows[0].physics_simulated!=="true") return;
        if (args.simulated===false && rows[0].physics_simulated!=="false") return;

        let mesh = rows[0];
        mesh.timestamp = mesh.time;
        mesh.scale = mesh.scale || 1.0;
        mesh.deleted = mesh.deleted === "true";
        mesh.geometry = {
          directory: mesh.geometry_directory,
          filename: mesh.geometry_filename,
          filetype: mesh.geometry_filetype,
        }
        mesh.physics = {
          collision: mesh.physics_collision,
          stationary: mesh.physics_stationary,
          simulated: mesh.physics_simulated,
        }
        return mesh;
      });
    });

    // Filter out any null objects
    const objects = await Promise.all(results);
    return objects.filter(ob => typeof(ob)!=="undefined");
  }
}

module.exports = MeshCurrentResolver;