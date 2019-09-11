const config = require('config');
const kafka = require('kafka-node');
const BaseResolver = require('../../BaseResolver');
const { GraphQLNonNull, GraphQLString, GraphQLList, GraphQLInt, GraphQLBoolean, GraphQLFloat, GraphQLInputObjectType} = require('graphql');
const MeshGeometry = require('../../types/MeshGeometry');
const MeshPhysics = require('../../types/MeshPhysics');
const logger = require('../../../logger');
const ObjectId = require('objectid');


const kafkaHost = config.get("Kafka.host");
console.info("Creating Kafka producer (trajectory updator: " + kafkaHost);
const client = new kafka.KafkaClient({kafkaHost: kafkaHost});
const producer = new kafka.HighLevelProducer(client);



/**
 * TrajectoryUpdateMutation
 * Update a trajectory object
 * - Write the new trajectory object to MongoDB
 * - Post an event to the real-time system when the trajectory is complete
 *
 */
class TrajectoryUpdateMutation extends BaseResolver {

  get args() {
    return {
      trajectoryId: {
        type: GraphQLString,
        description: 'The robot that will be following the trajectory.'
      },
      frame: {
        type: GraphQLString,
        description: 'The coordinate frame of the from/to points.'
      },
      startPoint: {
        type: new GraphQLList(GraphQLFloat),
        description: 'The starting position for the trajectory.'
      },
      endPoint: {
        type: new GraphQLList(GraphQLFloat),
        description: 'The ending position for the trajectory.'
      },
      points: {
        type: new GraphQLList(GraphQLList(GraphQLFloat)),
        description: 'The trajectory.'
      },
      isDeleted: {
        type: GraphQLBoolean,
        description: 'True if the trajectory has been deleted.'
      },
      isReady: {
        type: GraphQLBoolean,
        description: 'True if the trajectory has been completed by the planner.'
      },
      isSafe: {
        type: GraphQLBoolean,
        description: 'True if the trajectory is safe to execute.'
      }
    };
  }

  async resolve(parentValue, args, ctx) {

    if (!args.trajectoryId){
      throw new Error("Invalid robot id");
    }

    let trajectory = {}

    if (typeof args.frame !== 'undefined'){
      trajectory.frame = args.frame
    }
    if (typeof args.startPoint !== 'undefined'){
      trajectory.startPoint = args.startPoint
    }
    if (typeof args.endPoint !== 'undefined'){
      trajectory.endPoint = args.endPoint
    }
    if (typeof args.points !== 'undefined'){
      trajectory.points = args.points
    }
    if (typeof args.isDeleted !== 'undefined'){
      trajectory.isDeleted = args.isDeleted
    }
    if (typeof args.isReady !== 'undefined'){
      trajectory.isReady = args.isReady
    }
    if (typeof args.isSafe !== 'undefined'){
      trajectory.isSafe = args.isSafe
    }

    await ctx.db.Trajectory.findByIdAndUpdate(
        {_id: args.trajectoryId},
        trajectory,
        { new: true }
    );

    let message = {
      event: 'updated',
      trajectory: trajectory
    }

    // Notify the trajectory builders that there is a trajectory to build
    let payload = [{
      topic: 'trajectory.events.updated',
      attributes: 1,
      timestamp: Date.now(),
      messages: [JSON.stringify(message)],
    }];

    producer.send(payload, function(err,data){
      if (err) console.error("Error sending trajectory updated command:", err);
    });

    logger.info("Updated trajectory: ", args.trajectoryId);

    return {
      id: args.trajectoryId,
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

module.exports = TrajectoryUpdateMutation;



