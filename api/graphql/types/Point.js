const {
    GraphQLList,
    GraphQLFloat,
    GraphQLObjectType,
    GraphQLString,
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

const PointPosition = new GraphQLObjectType({
    name: 'PointPosition',
    description: 'Point position',
    fields: () => ({
        x: {type: GraphQLFloat},
        y: {type: GraphQLFloat},
        z: {type: GraphQLFloat},
    })
})

const PointAttribute = new GraphQLObjectType({
    name: 'PointAttribute',
    description: 'Point attribute',
    fields: () => ({
        r: {type: GraphQLFloat},
        b: {type: GraphQLFloat},
        g: {type: GraphQLFloat},
    })
})

const Robot = new GraphQLObjectType({
    name: 'RobotPoint',
    description: 'Robot Point', 
    fields: () => ({
        id: ({ type: GraphQLString}) 
    })
})

const Point3D = new GraphQLObjectType({
    name: 'Point3D',
    description: 'A point in 3D space',
    fields: () => ({
        position: ({ type : PointPosition }),
        attribute: ({ type: PointAttribute }),
    }),
})

const PointsGroup = new GraphQLObjectType({
    name: 'PointsGroup',
    description: 'Points group',
    fields: () => ({
       pointsGroup: ({ type: GraphQLList(Point3D)}),
       robot: ({ type: Robot })
    })
})

module.exports = {
    PointPosition,
    PointAttribute,
    Point2D,
    Point3D,
    PointsGroup
};
