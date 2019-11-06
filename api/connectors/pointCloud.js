const config = require('config');
const kafka = require('kafka-node');
const Logger = require('../logger');
const pointService = require('../services/PointService');
const pubSub = require('./pubSub');
const Consumer = kafka.Consumer;

const kafkaHost = config.get("Kafka.host");
const POINT_CLOUD_TOPIC = "point_cloud_topic";
Logger.info("Creating Kafka Consumer (Point cloud): ");
const client = new kafka.KafkaClient({kafkaHost});

const consumer = new Consumer(
    client,
    [{ topic: 'robot.sensors.pointcloud', partition: 0 }],
    { autoCommit: true }
);

/**
 * setupConsumer
 * 
 */
function setupConsumer() {
	consumer.on('message', async function(message) {
        console.log('Consumer point cloud receive message', JSON.parse(message.value));
        const messagesData = JSON.parse(message.value);
        const { points, header , robot } = messagesData; 
        console.log(robot);
        try {
            await pointService.addPointsOfRobot(robot, header, points);
            // change after receive data structure from kafa
            pubSub.publish(POINT_CLOUD_TOPIC, {
                id: message.robot_id,
                buildingId: message.building_id
            });
    } catch(e) {
        console.log(e)
            throw new Error('Add points of robot error', e);
        }
    });
    consumer.on('error', function(error){
        console.log(error);
    })
};

// Run the consumer
setupConsumer();