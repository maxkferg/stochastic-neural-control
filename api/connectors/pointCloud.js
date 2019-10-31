const config = require('config');
const kafka = require('kafka-node');
const Logger = require('../logger');


const Consumer = kafka.Consumer;

var topicsToCreate = [{
    topic: 'robots.sensors.pointcloud',
    partitions: 1,
    replicationFactor: 2
  }];

  
// const kafkaHost = config.get("Kafka.host");

Logger.info("Creating Kafka Consumer (Point cloud): ");
const client = new kafka.KafkaClient({
    kafkaHost: '10.3.100.196:9092'
});

client.createTopics(topicsToCreate, (error, result) => {
    // result is an array of any errors if a given topic could not be created
    console.log(result);
    console.log(error);
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
        console.lopg(error);
    })
};

// Run the consumer
setupConsumer();