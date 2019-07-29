const config = require('config');
const kafka = require('kafka-node');
const qte = require('quaternion-to-euler');
const Influx = require('influx');
const influx = require('../influxdb');
const UpdatePolicy = require('./updatePolicy');
const logger = require('../logger');


const Consumer = kafka.Consumer;
const kafkaHost = config.get("Kafka.host");
logger.info("Creating Kafka Consumer (robot position): "+kafkaHost);
const client = new kafka.KafkaClient({kafkaHost: kafkaHost});
const MIN_UPDATE_INTERVAL = 1*1000 // Never update faster than 1 Hz
const MAX_UPDATE_INTERVAL = 10*1000 // Always update every 10s

const consumer = new Consumer(
    client,
    [{ topic: 'robot.events.odom', partition: 0 }],
    { autoCommit: true }
);

/**
 * setupConsumer
 * Setup a consumer that copies data from Kafka to Influx
 */
function setupConsumer(updatePolicy){
	let x = 0;
	let y = 0;
	let z = 0;
	let euler;

	consumer.on('message', function(message){
		//console.log("GOT message",message)
		message = JSON.parse(message.value)
		logger.info("Wrote new robot pos data");
		// TODO: Update policy should depend on robotId
		if (!updatePolicy.mightUpdate()) return;
		if (!message.frame_id == "odom") return;
		if (!message.child_frame_id == "base_footprint") return;
		x = message.pose.pose.position.x
		y = message.pose.pose.position.z
		z = message.pose.pose.position.y
		euler = qte([
			message.pose.pose.orientation.x,
			message.pose.pose.orientation.y,
			message.pose.pose.orientation.z,
			message.pose.pose.orientation.w,
		]);
		theta = euler[0]+Math.PI/2; // Mesh is wrong
		let data = {
			x: x,
			y: y,
			z: z,
			theta: theta
		}
		if (updatePolicy.shouldUpdate(data)){
			updatePolicy.willUpdate(data);
			updateRobotPosition(message.robot.id, x, y, z, theta);
		}
	});
};



/**
 * updateRobotPosition
 * Update the robot position in influx
 * Copies the last available tags to the new object
 */
function updateRobotPosition(robotId, x, y, z, theta){
    let query = influx.query(`
        select * from mesh_position
        where id = ${Influx.escape.stringLit(robotId)}
        order by time asc
        limit 1`
    ).then((results) => {
        if (results.length==0){
            throw new Error("Could not find robot");
        }
        //if (results[0].deleted){
        //	throw new Error("Can not move a deleted robot");
        //}
        let robot = results[0];
        return influx.writePoints([{
        	measurement: 'mesh_position',
        	tags: {
	            id: robot.id,
	            name: robot.name,
	            type: robot.type,
	            deleted: robot.deleted,
	        },
 			fields: {
	            x: x,
	            y: y,
	            z: z,
	            theta: theta,
	            scale: robot.scale,
	            height: robot.height,
	            width: robot.width,
	            depth: robot.depth,
	            geometry_filetype: robot.geometry_filetype,
	            geometry_filename: robot.geometry_filename,
	            geometry_directory: robot.geometry_directory,
	            physics_stationary: robot.physics_stationary,
	            physics_collision: robot.physics_collision
        	}
        }]);
    }).then(() => {
    	logger.info("Wrote new robot position", x.toFixed(3), y.toFixed(3), z.toFixed(3) ,theta.toFixed(3));
    }).catch(e => {
    	logger.error("Robot position failed:", e.message);
    });
}


// Run the consumer
const updatePolicy = new UpdatePolicy(MIN_UPDATE_INTERVAL, MAX_UPDATE_INTERVAL);
setupConsumer(updatePolicy);