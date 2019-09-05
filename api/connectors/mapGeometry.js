/**
 * Map Geometry Consumer
 * 
 * Consumes Kafka messages about map geometry
 * Writes updated map geometry to MongoDB
 * 
 */
const config = require('config');
const kafka = require('kafka-node');
const qte = require('quaternion-to-euler');
const UpdatePolicy = require('./updatePolicy');
const logger = require('../logger');
const validator = require('./validator');
const mongoose = require('mongoose');


const Consumer = kafka.Consumer;
const kafkaHost = config.get("Kafka.host");
const client = new kafka.KafkaClient({kafkaHost: kafkaHost});
//const MIN_UPDATE_INTERVAL = 1*1000 // Never update faster than 1 Hz
//const MAX_UPDATE_INTERVAL = 10*1000 // Always update every 10s

const consumer = new Consumer(
    client,
    [{ topic: 'debug', partition: 0 }],
    { 
    	autoCommit: false,
    	groupId: 'kafka-debug',
    	fromOffset: 0,
    }
);


/**
 * setupConsumer
 * Setup a consumer that copies data from Kafka to MongoDB
 */
function setupConsumer(db){
	logger.info("Creating Kafka Consumer (Map Geometry): ", kafkaHost);
	consumer.on('message', function(message){
		logger.warn("GOT MESSAFE")
		message = JSON.parse(message.value);
		v = validator.validateMapGeometry(message);
		if (v.errors.length){
			logger.error("Message validation failed: " + v.errors[0].stack);
			return;
		}
		let mesh_id = message.mesh_id;
		if (mesh_id.length<12){
			mesh_id = mesh_id.padStart(12, '0');
		}

		let query = {
			mesh_id: mongoose.Types.ObjectId(mesh_id)
		}
		console.log("query:", query)
		console.log("mesh_id:", message)

		delete message.mesh_id
		db.MapGeometry.findOneAndUpdate(query, message, {upsert:true}, function(err, doc){
		    if (err){
		    	logger.error("Failed to write polygon to db: " + err);
		    } 
		    logger.info("Wrote map polygon to db");
		});
	})
}


module.exports = function(db){
	setupConsumer(db);
}