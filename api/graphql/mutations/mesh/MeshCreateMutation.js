const Influx = require('Influx');
const BaseResolver = require('../../BaseResolver');
const { GraphQLNonNull, GraphQLString, GraphQLInt, GraphQLBoolean, GraphQLFloat, GraphQLInputObjectType} = require('graphql');
const MeshGeometry = require('../../types/MeshGeometry');
const MeshPhysics = require('../../types/MeshPhysics');
const ObjectId = require('objectId');


const MeshGeometryInput = new GraphQLInputObjectType({
    name: 'MeshGeometryInput',
    fields: () => ({
        filetype: {type: GraphQLNonNull(GraphQLString)},
        filename: {type: GraphQLNonNull(GraphQLString)},
        directory: {type: GraphQLNonNull(GraphQLString)},
    })
});


const MeshPhysicsInput = new GraphQLInputObjectType({
    name: 'MeshPhysicsInput',
    fields: () => ({
        stationary: {type: GraphQLNonNull(GraphQLBoolean)},
        collision: {type: GraphQLNonNull(GraphQLBoolean)},
    })
});



class MeshCreateMutation extends BaseResolver {

    get args() {
        return {
            name: {
                type: new GraphQLNonNull(GraphQLString),
                description: 'Name for this mesh object.'
            },
            type: {
                type: new GraphQLNonNull(GraphQLString),
                description: 'Type of mesh {robot, wall, floor, object}.'
            },
            x: {
                type: new GraphQLNonNull(GraphQLFloat),
                description: 'X position of this object.'
            },
            y: {
                type: new GraphQLNonNull(GraphQLFloat),
                description: 'Y position of this object.'
            },
            z: {
                type: new GraphQLNonNull(GraphQLFloat),
                description: 'Z position of this object.'
            },
            theta: {
                type: new GraphQLNonNull(GraphQLFloat),
                description: 'Rotation of this object.'
            },
            scale: {
                type: new GraphQLNonNull(GraphQLFloat),
                description: 'Scale of this object.'
            },
            height: {
                type: new GraphQLNonNull(GraphQLFloat),
                description: 'Height of this object (y direction).'
            },
            width: {
                type: new GraphQLNonNull(GraphQLFloat),
                description: 'Width of this object (x direction).'
            },
            depth: {
                type: new GraphQLNonNull(GraphQLFloat),
                description: 'Depth of this object (z direction).'
            },
            deleted: {
                type: GraphQLBoolean,
                description: 'True if the object no longer exists.'
            },
            geometry: {
                type: GraphQLNonNull(MeshGeometryInput),
                description: 'A description of the mesh geometry',
            },
            physics: {
                type: MeshPhysicsInput,
                description: 'A description of the mesh physics',
            }
        };
    }

    async resolve(parentValue, args, ctx) {
        let id = ObjectId();

        // Todo: id, geometry, and physics should be stored in mongo
        console.log(id,args)
        let query = ctx.influx.writePoints([
          {
            measurement: 'mesh_position',
            tags: {
                id: id,
                name: args.name,
                type: args.type,
                deleted: args.deleted || false,
            },
            fields: {
                x: args.x,
                y: args.y,
                z: args.z,
                theta: args.theta || 0,
                scale: args.scale || 1,
                height: args.height,
                width: args.width,
                depth: args.depth,
                geometry_filetype: args.geometry.filetype,
                geometry_filename: args.geometry.filename,
                geometry_directory: args.geometry.directory,
                physics_stationary: args.physics.stationary || true,
                physics_collision: args.physics.collision  || false,
            },
          }
        ]).then(() => {
          return ctx.influx.query(`
            select * from mesh_position
            where id = ${Influx.escape.stringLit(id)}
            order by time asc
            limit 1
          `)
        }).then(datas => {
          let data = datas[0];
          console.log('DATAS:',datas)
          return {
            id: id,
            x: data.x,
            y: data.y,
            z: data.z,
            type: data.type,
            name: data.name,
            theta: data.theta,
            height: data.height,
            width: data.width,
            depth: data.depth,
            scale: data.scale,
            deleted: data.deleted == "true",
            geometry: {
                filetype: data.geometry_filetype,
                filename: data.geometry_filename,
                directory: data.geometry_directory,
            },
            physics: {
                stationary: data.physics_stationary,
                collision: data.physics_collision,
            },
            time: data.time,
          }
        });
        return await query
    }
}

module.exports = MeshCreateMutation;