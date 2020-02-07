/**
 *
 * Process the robot.sensors.map topic, storing data and republishing
 *
 * - Listens to the Kafka robot.sensors.map topic
 * - Writes all maps to Google Cloud Storage
 * - Republishes the images to Kafka on platform.data.maps
 *
 */
const config = require('config');
const kafka = require('kafka-node');
const UpdatePolicy = require('./updatePolicy');
const Logger = require('../logger');
const PNG = require('pngjs').PNG;

const {Storage} = require('@google-cloud/storage');
const MIN_UPDATE_INTERVAL = 1*1000 // Never update faster than 1 Hz
const MAX_UPDATE_INTERVAL = 10*1000 // Always update every 10s


// Kafka consumer and producer
const Consumer = kafka.Consumer;
const kafkaHost = config.get("Kafka.host");
const client = new kafka.KafkaClient({kafkaHost: kafkaHost});

Logger.info("Creating Kafka Producer (platform.data.maps): ", kafkaHost);
const producer = new kafka.HighLevelProducer(client);

Logger.info("Creating Kafka Consumer (robot.sensors.map): ", kafkaHost);
const consumer = new Consumer(
    client,
    [{ topic: 'robot.sensors.imu', partition: 0 }],
    { autoCommit: true }
);

const projectId = config.get('GOOGLE.PROJECT_ID');
const bucketName = config.get('GOOGLE.ROBOT_MAP_BUCKET');
const storage = new Storage({
  projectId: projectId,
});

// Creates the new bucket
// storage
//   .createBucket(bucketName)
//   .then(() => {
//     Logger.log(`Bucket ${bucketName} created.`);
//   })
//   .catch(err => {
//     Logger.error('Could not create bucket:');
//     Logger.error(err)
//   });


/**
 * sendUploadToGCS
 * Write a file to GCS. Return the public file URL
 */
// async function writeFileToGCS(image, next) {
// 	const gcsname = "map-" + Date.now() + ".png";
// 	const fileUrl = `https://storage.googleapis.com/${bucketName}/${gcsname}`;
// 	const file = bucket.file(gcsname);
// 	const options = {
// 		metadata: {
// 			contentType: 'image/png'
// 		}
//   	}
//  	await file.save(data, options).makePublic();
//  	return fileUrl;
// }

/**
 * mapToImage
 * Write a file to GCS. Return the public file URL
 */
function mapToImage(imagePixels, width, height){
	var png = new PNG({
	    width: width,
	    height: height,
	    filterType: -1
	});

	for (var y = 0; y < png.height; y++) {
	    for (var x = 0; x < png.width; x++) {
	        var idx = (png.width * y + x) << 2;
	        png.data[idx] = imagePixels[idx]+1;
	        png.data[idx+1] = imagePixels[idx]+1;
	        png.data[idx+2] = imagePixels[idx]+1;
	        png.data[idx+3] = imagePixels[idx]+1;
	    }
	}
	return png
}

/**
 * setupConsumer
 * Setup a consumer that copies data from Kafka to GCS
 */
function setupConsumer(){
	consumer.on('message', async function(message){
		let kafkaMessage = JSON.parse(message.value);
        console.log("TCL: setupConsumer -> kafkaMessage", kafkaMessage)
		height = kafkaMessage.info.height;
		width = kafkaMessage.info.width;
		image = mapToImage(message.data, width, height);
		console.log(image)
		// filename = await writeFileToGCS(image);
		let messageTest = {
			robot: {
				id: message.robot.id
			},
			map: {
				url: filename
			}
		}
		console.log(messageTest)
		let payload = [{
		    topic: 'robot.commands.velocity',
		    attributes: 1,
		    timestamp: Date.now(),
		    messages: [JSON.stringify(messageTest)],
    	}];
	});
};


// Run the consumer
setupConsumer();