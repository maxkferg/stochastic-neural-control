const config = require('config');
const kafka = require('kafka-node');


const kafkaHost = config.get("Kafka.host");
console.info("Creating Kafka producer (robot control): "+ kafkaHost);
const client = new kafka.KafkaClient({kafkaHost: kafkaHost});
const producer = new kafka.HighLevelProducer(client);

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}


function generatePayload() {
    const message = {
        points: [
            [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255],[getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255],[getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255],[getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255],[getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255],[getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255], [getRandomInt(10),1,1,255,255,255]
        ],
        robot: {
            id: "5dc5e024a201cd0100000001",
        },
        header: {
            stamp : {
                nsecs : 123123123,
                nsecs: 81313113
            }
        }
    }
    const payload = [{
        topic: "robot.sensors.pointcloud",
        attributes: 1,
        timestamp: Date.now(),
        messages: [JSON.stringify(message)]
    }];
    return payload
}
  
setInterval(() => producer.send(generatePayload(), function(err, data) {
    if (err) console.error("Error sending robot control:",err);
  }), 100)
