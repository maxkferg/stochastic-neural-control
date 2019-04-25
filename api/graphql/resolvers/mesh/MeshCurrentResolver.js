const Influx = require('influx');
const BaseResolver = require('../../BaseResolver');
const {GraphQLString, GraphQLInt} = require('graphql');

class MeshCurrentResolver extends BaseResolver {

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
    super.resolve(parentValue, args, ctx);

    let limit = args.limit || 3;
    let geometryType = args.type || "wall";

    return ctx.influx.query(`
      SHOW TAG VALUES from mesh_position
      WITH key = id
      WHERE type = ${Influx.escape.stringLit(geometryType)}
    `
    ).then(rows => {
      return rows.map(data => {
        return ctx.influx.query(`
          select * from mesh_position
          where id = ${Influx.escape.stringLit(data.value)}
          order by time desc
          limit 1`
        ).then(rows => {
          if (rows.length==0){
            return;
          }
          let mesh = rows[0];
          mesh.timestamp = mesh.time;
          mesh.geometry = {
            directory: mesh.geometry_directory,
            filename: mesh.geometry_filename,
            filetype: mesh.geometry_filetype,
          }
          mesh.physics = {
            collision: mesh.physics_collision,
            stationary: mesh.physics_stationary,
          }
          return mesh;
        });
      });
    });
  }
}

module.exports = MeshCurrentResolver;