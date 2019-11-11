const config = require('config');
const BaseResolver = require('../../BaseResolver');
const { GraphQLNonNull, GraphQLString, GraphQLList, GraphQLInt, GraphQLBoolean, GraphQLFloat, GraphQLInputObjectType} = require('graphql');
const MeshGeometry = require('../../types/MeshGeometry');
const MeshPhysics = require('../../types/MeshPhysics');
const ObjectId = require('objectid');
const logger = require('../../../logger');
const kafka = require('kafka-node');


/**
 * RobotMutation
 * Update Robot Database Settings
 *
 */
class RobotMutation extends BaseResolver {

  get args() {
    return {
      id: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'Unique ID for this robot.'
      },
      name: {
        type: GraphQLString,
        description: 'Robot name'
      },
      mesh_id: {
        type: GraphQLString,
        description: 'Mesh id'
      },
      building_id: {
        type: GraphQLString,
        description: 'Building id'
      },
      trajectory_id: {
        type: GraphQLString,
        description: 'Assign this robot to a trajectory'
      },
      isRealRobot: {
        type: GraphQLBoolean,
        description: 'True if this is a real physical robot'
      },
      validControlTopics: {
        type: new GraphQLList(GraphQLString),
        description: 'List of topics the robot should use for velocity control'
      }
    };
  }


  async resolve(parentValue, args, ctx) {
    // Call super method to check authentication if applicable
    super.resolve(parentValue, args, ctx);
    
    let robot = {}

    if (typeof args.mesh_id !== 'undefined'){
      robot.mesh_id = args.mesh_id
    }
    if (typeof args.name !== 'undefined'){
      robot.name = args.name
    }
    if (typeof args.building_id !== 'undefined'){
      robot.building_id = args.building_id
    }
    if (typeof args.trajectory_id !== 'undefined'){
      robot.trajectory_id = args.trajectory_id
    }
    if (typeof args.is_traversable !== 'undefined'){
      robot.isTraversable = args.is_traversable
    }
    if (typeof args.isRealRobot !== 'undefined'){
      robot.isRealRobot = args.isRealRobot
    }
    if (typeof args.validControlTopics !== 'undefined'){
      robot.validControlTopics = args.validControlTopics
    }

    let selector = {_id: args.id}
    let ob = await ctx.db.Robot.findOneAndUpdate(
        selector,
        robot,
        { new: true }
    );

    let message = {
      event: 'updated',
      robot: robot
    }

    // Create and start topic proxies
    this.proxies = this.proxies || new TopicProxyManager()
    this.proxies.setTopics(ob.validControlTopics);

    logger.info("Updated robot:", ob._id);

    return ob;
  }
}


/**
 * TopicProxyManager
 * Create and delete Kafka proxies
 *
 */
class TopicProxyManager {
  constructor(){
    this.toTopic = 'robot.commands.velocity';
    this.currentProxies = {}
  }

  setTopics(topics){
    // Kill old topic proxies
    for (let proxyName in this.currentProxies){
      if (topics.indexOf(proxyName) < 0){
        this.currentProxies[proxyName].close();
        delete this.currentProxies[proxyName]
        logger.info("Deleted kafka proxy:", proxyName);
      }
    };

    // Create new topic proxies
    for (let topic of topics){
      if (!this.currentProxies[topic]){
        this.currentProxies[topic] = new TopicProxy(topic, this.toTopic)
        logger.info("Create kafka proxy:", topic);
      }
    }
  }
}


/**
 * TopicProxy
 * Copy messages from one topic to another
 *
 */
class TopicProxy{

  constructor(fromTopic, toTopic){
    const kafkaHost = config.get("Kafka.host");
    const client = new kafka.KafkaClient({kafkaHost: kafkaHost});
    const producer = new kafka.HighLevelProducer(client);
    this.consumer = new kafka.Consumer(
        client,
        [{ topic: fromTopic }],
        { 
          autoCommit: true,
          groupId: 'robot-topic-proxy'
        }
    );
    this.consumer.on('message', function(message){
      console.log(message)
      const payload = {
        topic: toTopic, 
        messages: [message.value]
      }
      producer.send([payload], function(err,data){
        if (err) console.error("Error sending robot control:",err);
      })
    })
  }

  close(){
    this.consumer.close();
  }
}


module.exports = RobotMutation;



