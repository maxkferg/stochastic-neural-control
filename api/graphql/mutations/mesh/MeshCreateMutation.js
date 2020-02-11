const Influx = require('influx');
const BaseResolver = require('../../BaseResolver');
const { GraphQLNonNull, GraphQLString, GraphQLBoolean, GraphQLFloat, GraphQLInputObjectType} = require('graphql');
const ObjectId = require('objectid');


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
        throw new Error("Mesh Create Depreciated")
    }
}

module.exports = MeshCreateMutation;