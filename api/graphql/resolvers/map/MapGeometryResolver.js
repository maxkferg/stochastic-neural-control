const BaseResolver = require('../../BaseResolver');
const {GraphQLString, GraphQLInt} = require('graphql');



/**
 * Convert an array of polygons arrays to polygon type
 */
function toPolygonType(polygons){
  return polygons.map((polygon) => ({
    points: polygon
  }));
}


class MapGeometryResolver extends BaseResolver {

  get args() {
    return {
      type: {
          type: GraphQLString,
          description: 'The mesh type (wall, floor, robot, object)'
      },
      limit: {
          type: GraphQLInt,
          description: 'The maximum number of results to return'
      },
      building_id: {
          type: GraphQLString,
          description: 'Optionally filter by building id'
      },
    };
  }

  async resolve(parentValue, args, ctx) {
    //calling super method to check authentication if applicable
    super.resolve(parentValue, args, ctx);

    let query = {}
    let limit = args.limit || 1000;

    if (args.type){
      query.type = args.type
    }

    if (args.building_id){
      query.building_id = args.building_id
    }

    let results = await ctx.db.MapGeometry.find(query);
    return results.map((ob) => ({
      id: ob._id,
      name: ob.name,
      mesh_id: ob.mesh_id,
      building_id: ob.building_id,
      is_deleted: ob.isDeleted,
      is_traversable: ob.isTraversable,
      internal_polygons: toPolygonType(ob.internalPolygons),
      external_polygons: toPolygonType(ob.externalPolygons),
      visual_polygons: toPolygonType(ob.visualPolygons),
      created_at: ob.createdAt,
      updated_at: ob.updatedAt,
    }))
  }
}

module.exports = MapGeometryResolver;