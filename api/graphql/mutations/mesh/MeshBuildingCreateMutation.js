const Influx = require('influx');
const BaseResolver = require('../../BaseResolver');
const { GraphQLNonNull, GraphQLString, GraphQLBoolean, GraphQLFloat, GraphQLInputObjectType} = require('graphql');
const ObjectId = require('objectid');
const logger = require('../../../logger');


const MeshGeometryCreateBuildingInput= new GraphQLInputObjectType({
    name: 'MeshGeometryCreateBuildingInput',
    fields: () => ({
        filetype: {type: GraphQLNonNull(GraphQLString)},
        filename: {type: GraphQLNonNull(GraphQLString)},
        directory: {type: GraphQLNonNull(GraphQLString)},
    })
});


const MeshPhysicsCreateBuildingInput = new GraphQLInputObjectType({
    name: 'MeshPhysicsCreateBuildingInput',
    fields: () => ({
        stationary: {type: GraphQLNonNull(GraphQLBoolean)},
        collision: {type: GraphQLNonNull(GraphQLBoolean)},
        simulated: {type: GraphQLNonNull(GraphQLBoolean)},
    })
});



class MeshCreateMutation extends BaseResolver {

    get args() {
        return {
            name: {
                type: new GraphQLNonNull(GraphQLString),
                description: 'Name for this mesh object.'
            },
            buildingId: {
                type: new GraphQLNonNull(GraphQLString),
                description: 'Id for building mesh object.'
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
                type: new GraphQLNonNull(MeshGeometryCreateBuildingInput),
                description: 'A description of the mesh geometry',
            },
            physics: {
                type: MeshPhysicsCreateBuildingInput,
                description: 'A description of the mesh physics',
            }
        };
    }

    async resolve(parentValue, args, ctx) {
        let id = ObjectId();

        console.log("SIM",!args.physics.simulated)

        if (args.type === "robot"){
            await ctx.db.Robot.create({
                _id: id,
                mesh_id: id,
                name: args.name,
                building_id: args.buildingId,
                isRealRobot: !args.physics.simulated,
            });
        }

        // Todo: id, geometry, and physics should be stored in mongo
        let query = ctx.influx.writePoints([
          {
            measurement: 'mesh_position',
            tags: {
                id: id,
                name: args.name,
                type: args.type,
                deleted: args.deleted || false,
                building_id: args.buildingId,
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
                physics_stationary: args.physics.stationary,
                physics_collision: args.physics.collision,
                physics_simulated: args.physics.simulated,
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
            buildingId: args.building_id,
            deleted: data.deleted == "true",
            geometry: {
                filetype: data.geometry_filetype,
                filename: data.geometry_filename,
                directory: data.geometry_directory,
            },
            physics: {
                stationary: data.physics_stationary,
                collision: data.physics_collision,
                simulated: data.physics_simulated,
            },
            time: data.time,
          }
        });
        return await query
    }
}

module.exports = MeshCreateMutation;