const kafka = require('kafka-node');
const qte = require('quaternion-to-euler');
const Influx = require('influx');
const influx = require('../influxdb');
const UpdatePolicy = require('./updatePolicy');
const ROBOT_ID = '5cc52a162693090000000002';


const Consumer = kafka.Consumer;
const client = new kafka.KafkaClient({kafkaHost: process.env.KAFKA_HOST});
const MIN_UPDATE_INTERVAL = 1*1000 // Never update faster than 1 Hz
const MAX_UPDATE_INTERVAL = 10*1000 // Always update every 10s

const consumer = new Consumer(
    client,
    [{ topic: 'robot.events.odom', partition: 0 }],
    { autoCommit: false }
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
		if (!updatePolicy.mightUpdate()) return;
		message = JSON.parse(JSON.parse(message.value));
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
			updateRobotPosition(x,y,z,theta);
		}
	});
};



/**
 * updateRobotPosition
 * Update the robot position in influx
 * Copies the last available tags to the new object
 */
function updateRobotPosition(x,y,z,theta){
    let query = influx.query(`
        select * from mesh_position
        where id = ${Influx.escape.stringLit(ROBOT_ID)}
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
    	console.log("Wrote new robot position", x.toFixed(3), y.toFixed(3), z.toFixed(3) ,theta.toFixed(3));
    }).catch(e => {
    	console.log("ERROR: Robot position failed", e.message);
    });
}


// Run the consumer
const updatePolicy = new UpdatePolicy(MIN_UPDATE_INTERVAL, MAX_UPDATE_INTERVAL);
setupConsumer(updatePolicy);