const {
    GraphQLObjectType,
    GraphQLList,
    GraphQLFloat,
} = require('graphql');

/**
 * MapPolygon
 * A 2D geometric polygon
 *
 */
const MapPolygon = new GraphQLObjectType({
    name: 'MapPolygon',
    description: 'A 2D geometric polygon',
    fields: () => ({
        points: {type: GraphQLList(GraphQLList(GraphQLFloat)) },
    })
})


module.exports = MapPolygon;
