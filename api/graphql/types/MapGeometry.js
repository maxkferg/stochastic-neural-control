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


/**
 * MapPolygon
 * A 2D geometric polygon
 *
 */
const MapGeometry = new GraphQLObjectType({
    name: 'MapGeometry',
    description: 'A 2D geometric object that belongs to a mesh',
    fields: () => ({
        id: { type: GraphQLString},
        name: {type: GraphQLString},
        mesh_id: {type: GraphQLString},
        is_deleted: {type: GraphQLString},
        is_traversable: {type: GraphQLString},
        internal_polygons: {type: GraphQLList(MapPolygon)},
        external_polygons: {type: GraphQLList(MapPolygon)},
        visual_polygons: {type: GraphQLList(MapPolygon)},
        created_at: {type: GraphQLDateTime},
        updated_at: {type: GraphQLDateTime},
    })
});


module.exports = MapGeometry;
