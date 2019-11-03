const {
    GraphQLList,
    GraphQLFloat,
    GraphQLObjectType,
    GraphQLString
} = require('graphql');

/**
 * Point2D type
 * A 2D point represented as a (x,y) tuple
 *
 */
const Point2D = new GraphQLObjectType({
    name: 'Point2D',
    description: 'A point in 2D space',
    fields: () => new GraphQLList(GraphQLFloat),
})


/**
 * Point2D type
 * A 3D point represented as a (x,y,z) tuple
 *
 */
const Point3D = new GraphQLObjectType({
    name: 'Point3D',
    description: 'A point in 3D space',
    fields: () => ({
        x: {type: GraphQLFloat},
        y: {type: GraphQLFloat},
        z: {type: GraphQLFloat},
        r: {type: GraphQLFloat},
        b: {type: GraphQLFloat},
        g: {type: GraphQLFloat},
        robot_id: {type: GraphQLString},
        building_id: {type: GraphQLString}
    }),
})



module.exports = {
    Point2D,
    Point3D,
};
