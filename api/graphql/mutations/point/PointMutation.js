const config = require('config');
const kafka = require('kafka-node');


const kafkaHost = config.get("Kafka.host");
console.info("Creating Kafka producer (robot control): "+ kafkaHost);
const client = new kafka.KafkaClient({kafkaHost: kafkaHost});
const producer = new kafka.HighLevelProducer(client);

const message = {
    points: [
        {
            position: {
                x: 1,
                y: 2,
                z: 3,
            }, 
            attribute: {
                r: 255,
                b: 255,
                g: 255
            }
        }
    ],
    building_id: "5d9e01a923cf82bd7c9ae330",
    robot_id: "5d9e01a923cf82bd7c9ae331",
    t: 123123123
}
const payload = [{
    topic: 'robots.sensors.pointcloud',
    attributes: 1,
    timestamp: Date.now(),
    messages: [JSON.stringify(message)]
}];
  
producer.send(payload, function(err, data) {
    if (err) console.error("Error sending robot control:",err);
    console.log(data);
  });