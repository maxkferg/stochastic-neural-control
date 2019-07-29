const config = require('config');
const kafka = require('kafka-node');
const BaseResolver = require('../../BaseResolver');
const { GraphQLNonNull, GraphQLString, GraphQLInt, GraphQLBoolean, GraphQLFloat, GraphQLInputObjectType} = require('graphql');
const MeshGeometry = require('../../types/MeshGeometry');
const MeshPhysics = require('../../types/MeshPhysics');
const ObjectId = require('objectid');


const kafkaHost = config.get("Kafka.host");
console.info("Creating Kafka producer (robot control): "+kafkaHost);
const client = new kafka.KafkaClient({kafkaHost: kafkaHost});
const producer = new kafka.HighLevelProducer(client);


/**
 * RobotVelocityProducer
 * Send control actions to the robot with velocity smoothing
 * There should only every be one of these created at the same time.
 */
class RobotVelocityProducer {
  constructor(robotId) {
    this.robotId = robotId;
    this.rotation = 0;
    this.linear = 0;
    this.growInterval = null;
    this.decayInterval = null;
    this.history = [];
    this.resolver = null;
    producer.on('ready', function () {
      console.log('Kafka is ready to receive events');
    });
  }

  /**
   * send
   * Send a smooth set of signals to the robot
   * Resolve once the signals have all be complete, or the request is overridden
   */
  send(linear, rotation, duration) {
    let self = this;
    let EVENT_INTERVAL = 50 // Send event every 50 ms
    let now = (new Date()).getTime();
    let growUntil = now + duration;
    let decayUntil = now + 2*duration;

    // Resolve and kill any previous commands
    if (this.currentInterval){
      clearInterval(this.currentInterval);
      this.currentInterval = null;
      this.history = [];
      if (this.resolver){
        this.resolver(this.history)
        this.resolver = null;
      }
    }

    // Grow the velocity toward the target
    return new Promise(function(resolve) {
      self.resolver = resolve;
      self.currentInterval = setInterval(function(){
        let now = (new Date()).getTime();
        if (now < growUntil){
          self.linear = 0.1*linear + 0.9*self.linear
          self.rotation = 0.1*rotation + 0.9*self.rotation
          self._send(self.linear, self.rotation);
        } else if (now < decayUntil){
          self.linear = 0.9*self.linear
          self.rotation = 0.9*self.rotation
          self._send(self.linear, self.rotation);
        } else {
          clearInterval(self.currentInterval);
          self._send(0, 0);
          resolve(self.history);
          self.resolver = null;
          self.currentInterval = null;
        }
      }, EVENT_INTERVAL);
    });
  }

  /**
  * _send
  * Send a message to Kakfa
  */
  _send(linear, rotation){
    let self = this;
    let message = {
      robot: {
        id: self.robotId,
      },
      velocity: {
        linear: {
          x: linear,
          y: 0,
          z: 0,
        },
        angular: {
          x: 0,
          y: 0,
          z: rotation,
        },
      }
    }
    let payload = [{
      topic: 'robot.commands.velocity',
      attributes: 1,
      timestamp: Date.now(),
      messages: [JSON.stringify(message)],
    }];
    self.history.push({
      linear: linear,
      rotation: rotation,
      timestamp: new Date(),
    });

    producer.send(payload, function(err,data){
      if (err) console.error("Error sending robot control:",err);
    });
  }
}


/**
 * MoveRobotMutation
 * Send control actions to the robot with velocity smoothing
 *
 */
class MoveRobotMutation extends BaseResolver {

  get args() {
    return {
      robotId: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'Unique ID for this robot.'
      },
      linear: {
        type: new GraphQLNonNull(GraphQLFloat),
        description: 'Linear velocity control. Forward is positive, Backward is negative'
      },
      rotation: {
        type: new GraphQLNonNull(GraphQLFloat),
        description: 'Rotation velocity control. Clockwise is positive, Anticlockwise is negative'
      },
      duration: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'Amount of time to apply this action for (milliseconds)'
      },
    };
  }

  async resolve(parentValue, args, ctx) {
    
    if (!args.robotId){
      throw new Error("Invalid robot id");
    }
    
    const duration = args.duration || 1000;
    const robotId = args.robotId;

    // Maintain a separate velocity producer for each robot
    this.velocityProducers = this.velocityProducers || {};
    if (!this.velocityProducers[robotId]){
      this.velocityProducers[robotId] = new RobotVelocityProducer(robotId)
    }

    let VelocityProducer = this.velocityProducers[robotId];
    let query = VelocityProducer.send(args.linear, args.rotation, duration);

    return query.then((history) => {
      return {
        timestamp: new Date,
        actions: history
      }
    });
  }
}

module.exports = MoveRobotMutation;



