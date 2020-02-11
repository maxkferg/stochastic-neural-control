const Influx = require('influx');
const BaseResolver = require('../../BaseResolver');
const {GraphQLString, GraphQLInt} = require('graphql');

class MeshAllResolver extends BaseResolver {

  get args() {
    return {
      type: {
          type: GraphQLString,
          description: 'The mesh type (wall, floor, robot, object)'
      },
      limit: {
          type: GraphQLInt,
          description: 'The maximum number of results to return'
      }
    };
  }

  async resolve(parentValue, args, ctx) {
    //calling super method to check authentication if applicable
    // super.resolve(parentValue, args, ctx);
    let limit = args.limit || 1000;
    let geometryType = args.type || "wall";

    return ctx.influx.query(`
      select * from mesh_position
      where type = ${Influx.escape.stringLit(geometryType)}
      order by time desc
      limit ${Influx.escape.tag(limit)}`
    ).then(rows => {
      return rows.map(mesh => {
        mesh.timestamp = mesh.time;
        mesh.scale = mesh.scale || 1.0;
        mesh.deleted = mesh.deleted == "true";
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
  }
}

module.exports = MeshAllResolver;