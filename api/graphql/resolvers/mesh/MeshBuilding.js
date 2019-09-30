const Influx = require('influx');
const BaseResolver = require('../../BaseResolver');
const {GraphQLNonNull, GraphQLString, GraphQLBoolean} = require('graphql');

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
      },
      deleted: {
        type: new GraphQLNonNull(GraphQLBoolean),
        description: 'Id for the building'
      }
    };
  }

  async resolve(parentValue, args, ctx) {
    super.resolve(parentValue, args, ctx);
    let query;
    if (args.type) {
      query = `
        SHOW TAG VALUES from mesh_position
        WITH key = id
        WHERE type = ${Influx.escape.stringLit(args.type)} AND building_id = ${Influx.escape.stringLit(args.buildingId)} `
    } else {
      query = `
        SHOW TAG VALUES from mesh_position
        WITH key = id
        WHERE building_id = ${Influx.escape.stringLit(args.buildingId)} 
        `
    }

    const objectIds = await ctx.influx.query(query);
    const results = objectIds.map((objectId) => {
      return ctx.influx.query(`
        select * from mesh_position
        where id = ${Influx.escape.stringLit(objectId.value)} and building_id = ${Influx.escape.stringLit(args.buildingId)} 
        order by time desc
        limit 1`
      ).then(rows => {
        if (rows.length==0) return;
        // Filtering rows
        console.log(rows)
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

module.exports = MeshBuilding;