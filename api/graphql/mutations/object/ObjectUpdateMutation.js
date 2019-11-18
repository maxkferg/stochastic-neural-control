const Influx = require('influx');
const { GraphQLNonNull, GraphQLString, GraphQLFloat } = require('graphql');
const BaseResolver = require('../../BaseResolver');

class ObjectUpdateMutation extends BaseResolver {
  get args() {
    return {
      id: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'UID for this mesh object.'
      },
      x: {
        type: GraphQLFloat,
        description: 'X position of this object.'
      },
      y: {
        type: GraphQLFloat,
        description: 'Y position of this object.'
      },
      z: {
        type: GraphQLFloat,
        description: 'Z position of this object.'
      },
      theta: {
        type: GraphQLFloat,
        description: 'Rotation of this object.'
      },
    }
  }

  async resolve(parentValue, args, ctx) {
    if (args.id.length == 0) {
      throw new Error("Invalid object id");
    }
    const query = `
      select * from mesh_position
      where id = ${Influx.escape.stringLit(args.id)}
      order by time desc
      limit 1
    `
    let results = await ctx.influx.query(query)

    if (results.length == 0) {
      throw new Error("Could not find object with id: " + args.id);
    }

    let object = results[0]

    const newTags = {
      id: object.id,
      name: object.name,
      type: object.type,
      deleted: object.deleted,
      building_id: object.building_id,
    }

    const newFields = {
      x: args.x === 'undefined' ? object.x : args.x,
      y: args.y === 'undefined' ? object.y : args.y,
      z: args.z === 'undefined' ? object.z : args.z,
      theta: args.theta === 'undefined' ? object.theta : args.theta,
      scale: object.scale,
      height: object.height,
      width: object.width,
      depth: object.depth,
      geometry_filetype: object.geometry_filetype,
      geometry_filename: object.geometry_filename,
      geometry_directory: object.geometry_directory,
      physics_stationary: object.physics_stationary,
      physics_collision: object.physics_collision,
      physics_simulated: object.physics_simulated,
    }

    await ctx.influx.writePoints([
      {
        measurement: 'mesh_position',
        tags: newTags,
        fields: newFields
      }
    ])

    results = await ctx.influx.query(query)
    object = results[0]

    return {
      id: object.id,
      x: object.x,
      y: object.y,
      z: object.z,
      type: object.type,
      name: object.name,
      theta: object.theta,
      scale: object.scale,
      height: object.height,
      width: object.width,
      depth: object.depth,
      deleted: object.deleted === 'true',
      geometry: {
        filetype: object.geometry_filetype,
        filename: object.geometry_filename,
        directory: object.geometry_directory,
      },
      physics: {
        stationary: object.physics_stationary,
        collision: object.physics_collision,
        simulated: object.physics_simulated,
      },
    }
  }
}

module.exports = ObjectUpdateMutation