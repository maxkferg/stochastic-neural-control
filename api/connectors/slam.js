const config = require('config');
const kafka = require('kafka-node');
const Logger = require('../logger');
const pubSub = require('./pubSub');
const Consumer = kafka.Consumer;

const kafkaHost = config.get("Kafka.host");
// const POINT_CLOUD_TOPIC = "point_cloud_topic";
const KAFKA_POINT_CLOUD_TOPIC = "robot.sensors.map";
Logger.info("Creating Kafka Consumer (Point cloud): ");
const client = new kafka.KafkaClient({kafkaHost});

const consumer = new Consumer(
    client,
    [{ topic: KAFKA_POINT_CLOUD_TOPIC, partition: 0 }],
    { autoCommit: true }
);

/**
 * setupConsumer slam
 * 
 */
function setupConsumer() {
	consumer.on('message', async function(message) {
        const messagesData = JSON.parse(message.value);
        console.log("TCL: setupConsumer -> messagesData", messagesData)
        try {
          
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