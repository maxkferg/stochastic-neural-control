const config = require('config');
const kafka = require('kafka-node');
const Logger = require('../logger');
const pointService = require('../services/PointService');
const pubSub = require('./pubSub');
const Consumer = kafka.Consumer;

const kafkaHost = config.get("Kafka.host");
const POINT_CLOUD_TOPIC = "point_cloud_topic";
const KAFKA_POINT_CLOUD_TOPIC = "robot.sensors.pointcloud";
Logger.info("Creating Kafka Consumer (Point cloud): ");
const client = new kafka.KafkaClient({kafkaHost});

const consumer = new Consumer(
    client,
    [{ topic: KAFKA_POINT_CLOUD_TOPIC, partition: 0 }],
    { autoCommit: true }
);

/**
 * setupConsumer point cloud
 * 
 */
function setupConsumer() {
	consumer.on('message', async function(message) {
        const messagesData = JSON.parse(message.value);
        const { points, header, robot } = messagesData;
        try {
            const pointsGroup = await pointService.addPointsOfRobot(robot, header, points);
            // change after receive data structure from kafka
            pubSub.publish(POINT_CLOUD_TOPIC, {
                id: robot.id,
                points: pointsGroup,
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