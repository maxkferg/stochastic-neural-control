const Influx = require('influx');
const BaseResolver = require('../../BaseResolver');
const { GraphQLNonNull, GraphQLString, GraphQLInt, GraphQLBoolean, GraphQLFloat, GraphQLInputObjectType} = require('graphql');
const MeshGeometry = require('../../types/MeshGeometry');
const MeshPhysics = require('../../types/MeshPhysics');
const ObjectId = require('objectid');


const MeshGeometryInput = new GraphQLInputObjectType({
    name: 'MeshGeometryOptional',
    fields: () => ({
        filetype: {type: GraphQLString},
        filename: {type: GraphQLString},
        directory: {type: GraphQLString},
    })
});


const MeshPhysicsInput = new GraphQLInputObjectType({
    name: 'MeshPhysicsOptional',
    fields: () => ({
        stationary: {type: GraphQLBoolean},
        collision: {type: GraphQLBoolean},
        simulated: {type: GraphQLBoolean},
    })
});


/* copyProp
 * Copy an object property from source[sourceKey] to target[targetKey]
 * Does not copy if source[sourceKey] is undefined or null
 */
function copyProp(source, sourceKey, target, targetKey){
    if (typeof(source[sourceKey])!=undefined && source[sourceKey]!=null){
        target[targetKey] = source[sourceKey];
    }
}


/* Mutation
 * MeshMutation
 * Modify an existing mesh, selected by mesh id
 * Internally, This creates a new entry in the InfluxBD with the modified mesh
 */
class MeshMutation extends BaseResolver {

    get args() {
        return {
            id: {
                type: new GraphQLNonNull(GraphQLString),
                description: 'UID for this mesh object.'
            },
            name: {
                type: GraphQLString,
                description: 'Name for this mesh object.'
            },
            type: {
                type: GraphQLString,
                description: 'Type of mesh {robot, wall, floor, object}.'
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
            scale: {
                type: GraphQLFloat,
                description: 'Scale of this object.'
            },
            height: {
                type: GraphQLFloat,
                description: 'Height of this object (y direction).'
            },
            width: {
                type: GraphQLFloat,
                description: 'Width of this object (x direction).'
            },
            depth: {
                type: GraphQLFloat,
                description: 'Depth of this object (z direction).'
            },
            deleted: {
                type: GraphQLBoolean,
                description: 'True if the object no longer exists.'
            },
            geometry: {
                type: MeshGeometryInput,
                description: 'A description of the mesh geometry',
            },
            physics: {
                type: MeshPhysicsInput,
                description: 'A description of the mesh physics',
            }
        };
    }

    async resolve(parentValue, args, ctx) {

        // Todo: id, geometry, and physics should be stored in mongo
        console.log(args)
        if (args.id.length==0){
            throw new Error("Invalid object id");
        }

        let query = ctx.influx.query(`
            select * from mesh_position
            where id = ${Influx.escape.stringLit(args.id)}
            order by time asc
            limit 1`
        ).then((results) => {
            if (results.length==0){
                throw new Error("Could not find object with id: "+args.id);
            }

            function chooseValid(val1, val2){
                return typeof(val1)==="undefined" ? val2 : val1;
            }

            let mesh = results[0];
            let newMeshTags = {
                id: chooseValid(args.id, mesh.id),
                name: chooseValid(args.name, mesh.name),
                type: chooseValid(args.type, mesh.type),
                deleted: chooseValid(args.deleted, mesh.deleted),
            }

            let newMeshFields = {
                x: chooseValid(args.x, mesh.x),
                y: chooseValid(args.y, mesh.y),
                z: chooseValid(args.z, mesh.z),
                theta: chooseValid(args.theta, mesh.theta),
                scale: chooseValid(args.scale, mesh.scale),
                height: chooseValid(args.height, mesh.height),
                width: chooseValid(args.width, mesh.width),
                depth: chooseValid(args.width, mesh.width),
                building_id: chooseValid(args.buildingId, mesh.building_id),
            }
            console.log("TCL: MeshMutation -> resolve -> newMeshFields", newMeshFields)

            if (args.geometry){
                newMeshFields.geometry_filetype = chooseValid(args.geometry.filetype, mesh.geometry_filetype);
                newMeshFields.geometry_filename = chooseValid(args.geometry.filename, mesh.geometry_filename);
                newMeshFields.geometry_directory = chooseValid(args.geometry.directory, mesh.geometry_directory);
            }

            if (args.physics){
                newMeshFields.physics_stationary = chooseValid(args.physics.stationary, mesh.physics_stationary);
                newMeshFields.physics_collision = chooseValid(args.physics.collision, mesh.physics_collision);
                newMeshFields.physics_simulated = chooseValid(args.physics.simulated, mesh.physics_simulated);
            }

            console.log(newMeshTags)
            console.log(newMeshFields)
            console.log({
                measurement: 'mesh_position',
                tags: newMeshTags,
                fields: newMeshFields,
            })
            // Insert new object into the database
            return ctx.influx.writePoints([{
                measurement: 'mesh_position',
                tags: newMeshTags,
                fields: newMeshFields,
            }])
        }).then(() => {
          return ctx.influx.query(`
            select * from mesh_position
            where id = ${Influx.escape.stringLit(args.id)}
            order by time desc
            limit 1
          `)
        }).then(datas => {
          let data = datas[0];
          return {
            id: data.id,
            x: data.x,
            y: data.y,
            z: data.z,
            type: data.type,
            name: data.name,
            theta: data.theta,
            scale: data.scale,
            height: data.height,
            width: data.width,
            depth: data.depth,
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

module.exports = MeshMutation;