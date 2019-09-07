const config = require('config');
const kafka = require('kafka-node');
const BaseResolver = require('../../BaseResolver');
const { GraphQLNonNull, GraphQLList, GraphQLString, GraphQLBoolean, GraphQLFloat, GraphQLInputObjectType} = require('graphql');
const { Point2dInputType } = require('../../types/Point');
const MeshGeometry = require('../../types/MeshGeometry');
const MeshPhysics = require('../../types/MeshPhysics');
const logger = require('../../../logger');
const ObjectId = require('objectid');


const kafkaHost = config.get("Kafka.host");
console.info("Creating Kafka producer (trajectory creator: "+kafkaHost);
const client = new kafka.KafkaClient({kafkaHost: kafkaHost});
const producer = new kafka.HighLevelProducer(client);



/**
 * TrajectoryCreateMutation
 * Request a trajectory from one point to another
 * Returns the incompleted trajectory object (points are not added yet)
 * An event will be posted to the real-time system when the trajectory is complete
 *
 */
class TrajectoryCreateMutation extends BaseResolver {

  get args() {
    return {
      robotId: {
        type: GraphQLString,
        description: 'The robot that will be following the trajectory.'
      },
      buildingId: {
        type: GraphQLString,
        description: 'The building that this trajectory belongs too.'
      },
      frame: {
        type: GraphQLString,
        description: 'The coordinate frame of the from/to points.'
      },
      startPoint: {
        type: new GraphQLNonNull(GraphQLList(GraphQLFloat)),
        description: 'The starting position for the trajectory.'
      },
      endPoint: {
        type: new GraphQLNonNull(GraphQLList(GraphQLFloat)),
        description: 'The ending position for the trajectory.'
      }
    };
  }

  async resolve(parentValue, args, ctx) {

    let trajectory = {
      frame_id: args.frame,
      owner_id: undefined,
      building_id: args.buildingId,
      startPoint: args.startPoint,
      endPoint: args.endPoint,
      points: [],
      isReady: false,
      isSafe: false,
      isDeleted: false
    }
    console.log(trajectory)

    trajectory = await ctx.db.Trajectory.create(trajectory);

    // Notify the trajectory builders that there is a trajectory to build
    let payload = [{
      topic: 'trajectory.commands.build',
      attributes: 1,
      timestamp: Date.now(),
      messages: [JSON.stringify({trajectoryId: trajectory._id})],
    }];

    producer.send(payload, function(err,data){
      if (err) console.error("Error sending trajectory build command:",err);
    });

    logger.info("Created new trajectory: ", trajectory._id);

    return {
      id: trajectory._id,
      points: trajectory.points,
      frame: trajectory.frame,
      startPoint: trajectory.startPoint,
      endPoint: trajectory.endPoint,
      isReady: trajectory.isReady,
      isSafe: trajectory.isSafe,
      isDeleted: trajectory.isDeleted
    }
  }
}

module.exports = TrajectoryCreateMutation;



