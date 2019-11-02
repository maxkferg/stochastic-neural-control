const config = require('config');
const kafka = require('kafka-node');
const Logger = require('../logger');
const pointService = require('../services/PointService');

const Consumer = kafka.Consumer;

// const kafkaHost = config.get("Kafka.host");

Logger.info("Creating Kafka Consumer (Point cloud): ");
const client = new kafka.KafkaClient({
    kafkaHost: '10.3.100.196:9092'
});

const consumer = new Consumer(
    client,
    [{ topic: 'robots.sensors.pointcloud', partition: 0 }],
    { autoCommit: true }
);

/**
 * setupConsumer
 * 
 */
function setupConsumer(){
	consumer.on('message', function(message){
        console.log('Consumer pointcloud receive message', message);
    });
    consumer.on('error', function(error){
        console.log(error);
    })
};

// Run the consumer
setupConsumer();