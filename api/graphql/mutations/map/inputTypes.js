const { GraphQLList, GraphQLFloat, GraphQLInputObjectType} = require('graphql');


/**
 * MapPolygon
 * A 2D geometric polygon
 *
 */
const PolygonInputType = new GraphQLInputObjectType({
    name: 'MapPolygonInput',
    description: 'A 2D geometric polygon',
    fields: () => ({
        points: {type: GraphQLList(GraphQLList(GraphQLFloat)) },
    })
})

module.exports = {
	PolygonInputType
}