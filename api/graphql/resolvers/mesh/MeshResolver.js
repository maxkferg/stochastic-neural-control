const Path = require("path");
const Influx = require('influx');
const BaseResolver = require('../../BaseResolver');
const {GraphQLNonNull, GraphQLString} = require('graphql');

/*
 * Return the last visible instance of a particular
 * ObjectId
 */
class MeshResolver extends BaseResolver {

  get args() {
    return {
      id: {
          type: new GraphQLNonNull(GraphQLString),
          description: 'Id for the user.'
      }
    };
  }

  async resolve(parentValue, args, ctx) {
    super.resolve(parentValue, args, ctx);

    return ctx.influx.query(`
      select * from mesh_position
      where id = ${Influx.escape.stringLit(args.id)}
      order by time desc
      limit 1`
    ).then(rows => {
      if (rows.length==0){
        return;
      }
      let mesh = rows[0];
      mesh.timestamp = mesh.time;
      mesh.scale = mesh.scale || 1.0;
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
  }
}

module.exports = MeshResolver;