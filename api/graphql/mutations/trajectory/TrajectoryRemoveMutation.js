const config = require('config');
const kafka = require('kafka-node');
const BaseResolver = require('../../BaseResolver');
const { GraphQLNonNull, GraphQLString, GraphQLInt, GraphQLBoolean, GraphQLFloat, GraphQLInputObjectType} = require('graphql');
const MeshGeometry = require('../../types/MeshGeometry');
const MeshPhysics = require('../../types/MeshPhysics');
const ObjectId = require('objectid');


const kafkaHost = config.get("Kafka.host");
console.info("Creating Kafka producer (trajectory removal): "+kafkaHost);
const client = new kafka.KafkaClient({kafkaHost: kafkaHost});
const producer = new kafka.HighLevelProducer(client);


/**
 * TrajectoryRemoveMutation
 * Remove a trajectory from the system
 * - Marks the trajectory as deleted in Mongo
 * - Sends a deleted event to the Kafka cluster
 *
 */
class TrajectoryRemoveMutation extends BaseResolver {

  get args() {
    return {
      trajectoryId: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'Unique ID for trajectory.'
      },
    };
  }

  async resolve(parentValue, args, ctx) {

    if (!args.trajectoryId){
      throw new Error("Invalid trajectory id");
    }

    let trajectory = await ctx.db.Trajectory.findByIdAndUpdate(
        args.trajectoryId,
        {isDeleted: true, isSafe: false},
    );

    if (trajectory === null){
      throw new Error("No trajectory with id: " + args.trajectoryId);
    }

    // Notify the real-time system that a trajectory was deleted
    let payload = [{
      topic: 'trajectory.events.removed',
      attributes: 1,
      timestamp: Date.now(),
      messages: [JSON.stringify({trajectoryId: trajectory._id})],
    }];

    producer.send(payload, function(err,data){
      if (err) console.error("Error sending trajectory build command:",err);
    });

    console.log(trajectory)

    return {
      id: trajectory._id,
      points: trajectory.points,
      frame: trajectory.frame,
      building: trajectory.frame_id,
      owner: trajectory.owner_id,
      startPoint: trajectory.startPoint,
      endPoint: trajectory.endPoint,
      isReady: trajectory.isReady,
      isSafe: trajectory.isSafe,
      isDeleted: trajectory.isDeleted
    }
  }
}

module.exports = TrajectoryRemoveMutation;



