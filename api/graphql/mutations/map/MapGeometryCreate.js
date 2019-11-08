const config = require('config');
const kafka = require('kafka-node');
const BaseResolver = require('../../BaseResolver');
const { GraphQLNonNull, GraphQLString, GraphQLList, GraphQLInt, GraphQLBoolean, GraphQLFloat, GraphQLInputObjectType} = require('graphql');
const { GraphQLDateTime } = require('graphql-iso-date');
const { PolygonInputType } = require('./inputTypes');
const MapPolygon = require('../../types/MapPolygon');
const logger = require('../../../logger');
const ObjectId = require('objectid');

const kafkaHost = config.get("Kafka.host");
console.info("Creating Kafka producer (Map updator: " + kafkaHost);
const client = new kafka.KafkaClient({kafkaHost: kafkaHost});
const producer = new kafka.HighLevelProducer(client);



/**
 * Convert an array of polygons arrays to polygon type
 * 
 * Input: A list of polgons in Mongo form [[[Number]]]
 * Output: A list of polygons in GraphQL form [{points: [[Number]]}]
 *
 */
function toPolygonType(polygons){
  return polygons.map((polygon) => ({
    points: polygon
  }));
}

/**
 * Convert an array of polygons arrays to polygon type
 * 
 * Input: A list of polygons in GraphQL form [{points: [[Number]]}]
 * Output: A list of polgons in Mongo form [[[Number]]]
 * 
 */
function toMongoPolygonType(polygons){
  return polygons.map((polygon) => polygon.points);
}

/**
 * MapGeometryCreate
 * Create a map geometry object
 * - Write the new map object to MongoDB
 * - Post an event to the real-time system when the map is complete
 *
 */
class MapGeometryCreate extends BaseResolver {

  get args() {
    return {
      name: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'The name of this geometry.'
      },
      mesh_id: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'The 3D mesh that this geometry belongs to.'
      },
      building_id: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'The building that this geometry belongs to.'
      },
      is_deleted: {
        type: new GraphQLNonNull(GraphQLBoolean),
        description: 'True if the geometry should appear deleted.'
      },
      is_traversable: {
        type: new GraphQLNonNull(GraphQLBoolean),
        description: 'True if a robot can cross this geometry.'
      },
      internal_polygons: {
        type: new GraphQLNonNull(GraphQLList(PolygonInputType)),
        description: 'The internal polygons of this object.'
      },
      external_polygons: {
        type: new GraphQLNonNull(GraphQLList(PolygonInputType)),
        description: 'The external polygons of this object.'
      },
      visual_polygons: {
        type: new GraphQLNonNull(GraphQLList(PolygonInputType)),
        description: 'The polygons that are shown to the user only.'
      },
      created_at: {
        type: GraphQLDateTime,
        description: 'Time when this objects was created.'
      },
      updated_at: {
        type: GraphQLDateTime,
        description: 'Time when this object was last updated.'
      }
    };
  }

  async resolve(parentValue, args, ctx) {

    let ob = await ctx.db.MapGeometry.create({
      name: args.name,
      mesh_id: args.mesh_id,
      building_id: args.building_id,
      isDeleted: args.is_deleted,
      isTraversable: args.is_traversable,
      internalPolygons: toMongoPolygonType(args.internal_polygons),
      externalPolygons: toMongoPolygonType(args.external_polygons),
      visualPolygons: toMongoPolygonType(args.visual_polygons),
    });

    let message = {
      event: 'created',
      mapgeometry: ob
    }

    // Notify consumers that the map geometry has changed
    let payload = [{
      topic: 'maps.events.created',
      attributes: 1,
      timestamp: Date.now(),
      messages: [JSON.stringify(message)],
    }];

    producer.send(payload, function(err,data){
      if (err) console.error("Error sending map geometry update command:", err);
    });

    logger.info("Updated map geometry: ", args.id);

    return {
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
    }
  }
}

module.exports = MapGeometryCreate;



