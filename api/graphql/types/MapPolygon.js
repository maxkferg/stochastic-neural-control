const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLList,
    GraphQLFloat,
    GraphQLBoolean,
} = require('graphql');
const { GraphQLDateTime } = require('graphql-iso-date');




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
