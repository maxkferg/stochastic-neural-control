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
 */
function toPolygonType(polygons){
  return polygons.map((polygon) => ({
    points: polygon
  }));
}

/**
 * MapGeometryMutation
 * Update a map object
 * If @upsert is true, then the a new mesh object will be created if no mathc is found
 *
 * - Write the new map object to MongoDB
 * - Post an event to the real-time system when the map is complete
 *
 */
class MapGeometryMutation extends BaseResolver {

  get args() {
    return {
      id: {
        type: GraphQLString,
        description: 'Map Geometry Id.'
      },
      upsert: {
        type: GraphQLBoolean,
        default: false,
        description: 'Insert a object if no match is found'
      },
      mesh_id: {
        type: GraphQLString,
        description: 'The 3D mesh that this geometry belongs to. Used as the upsert selector'
      },
      building_id: {
        type: GraphQLString,
        description: 'The building that this geometry belongs to.'
      },
      name: {
        type: GraphQLString,
        description: 'The name of this geometry.'
      },
      is_deleted: {
        type: GraphQLBoolean,
        description: 'True if the geometry should appear deleted.'
      },
      is_traversable: {
        type: GraphQLBoolean,
        description: 'True if a robot can cross this geometry.'
      },
      internal_polygons: {
        type: new GraphQLList(PolygonInputType),
        description: 'The internal polygons of this object.'
      },
      external_polygons: {
        type: new GraphQLList(PolygonInputType),
        description: 'The external polygons of this object.'
      },
      visual_polygons: {
        type: new GraphQLList(PolygonInputType),
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

    let mapgeometry = {}

    if (typeof args.name !== 'undefined'){
      mapgeometry.name = args.name
    }
    if (typeof args.mesh_id !== 'undefined'){
      mapgeometry.mesh_id = args.mesh_id
    }
    if (typeof args.mesh_id !== 'undefined'){
      mapgeometry.building_id = args.building_id
    }
    if (typeof args.is_deleted !== 'undefined'){
      mapgeometry.isDeleted = args.is_deleted
    }
    if (typeof args.is_traversable !== 'undefined'){
      mapgeometry.isTraversable = args.is_traversable
    }
    if (typeof args.internal_polygons !== 'undefined'){
      mapgeometry.internalPolygons = args.internal_polygons
    }
    if (typeof args.external_polygons !== 'undefined'){
      mapgeometry.externalPolygons = args.external_polygons
    }
    if (typeof args.visual_polygons !== 'undefined'){
      mapgeometry.visualPolygons = args.visual_polygons
    }
    if (typeof args.created_at !== 'undefined'){
      mapgeometry.createdAt = args.created_at
    }
    if (typeof args.updated_at !== 'undefined'){
      mapgeometry.updatedAt = args.updated_at
    }

    let selector;
    if (args.id){
      selector = {_id: args.id}
    } else if (args.mesh_id){
      selector = {mesh_id: args.mesh_id}
    } else {
      throw new Error("Must provide map id or mesh_id")
    }

    let ob = await ctx.db.MapGeometry.findOneAndUpdate(
        selector,
        mapgeometry,
        { new: true, upsert: true}
    );

    let message = {
      event: 'updated',
      mapgeometry: mapgeometry
    }

    // Notify consumers that the map geometry has changed
    let payload = [{
      topic: 'maps.events.updated',
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

module.exports = MapGeometryMutation;



