const BaseResolver = require('../../BaseResolver');
const {GraphQLNonNull, GraphQLString} = require('graphql');

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
        //calling super method to check authentication if applicable
        super.resolve(parentValue, args, ctx);

        try {
            return {
                id: "wall1",
                name: "wall",
                type: "wall",
                x: 1,
                y: 2,
                z: 3,
                width: 2,
                height: 3,
                depth: 4,
                deleted: false,
                geometry: {
                    filetype: "obj",
                    path: "./file/assets/mesh.obj"
                },
                physics: {
                    stationary: true,
                    collision: true
                }
            };
        } catch (e) {
            throw new Error(e);
        }
    }
}

module.exports = MeshResolver;