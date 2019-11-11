const config = require('config');
const kafka = require('kafka-node');
const qte = require('quaternion-to-euler');
const Influx = require('influx');
const influx = require('../influxdb');
const UpdatePolicy = require('./updatePolicy');
const Logger = require('../logger');


const MIN_UPDATE_INTERVAL = 1 * 1000 // Never update faster than 1 Hz
const MAX_UPDATE_INTERVAL = 10 * 1000 // Always update every 10s


const kafkaHost = config.get("Kafka.host");
Logger.info("Creating Kafka Consumer (robot IMU): ", kafkaHost);
const client = new kafka.KafkaClient({ kafkaHost: kafkaHost });
const consumer = new kafka.Consumer(
	client,
	[{ topic: 'robot.sensors.imu', partition: 0 }],
	{ autoCommit: true }
);

/**
 * setupConsumer
 * Setup a consumer that copies data from Kafka to Influx
 */
function setupConsumer(updatePolicy) {
	let x = 0;
	let y = 0;
	let z = 0;
	let euler;

	consumer.on('message', function (message) {
		let cloneMessage = JSON.parse(message.value);
		let robotId = cloneMessage.robot.id;
		if (!updatePolicy.mightUpdate(robotId)) return;
		if (!cloneMessage.frame_id == "gyro_link") return;
		let imuData = {
			linear_acceleration: {
				x: cloneMessage.linear_acceleration.x,
				y: cloneMessage.linear_acceleration.y,
				z: cloneMessage.linear_acceleration.z,
			},
			angular_velocity: {
				x: cloneMessage.angular_velocity.x,
				y: cloneMessage.angular_velocity.y,
				z: cloneMessage.angular_velocity.z,
			}
		}
		if (updatePolicy.shouldUpdate(robotId, imuData)) {
			updatePolicy.willUpdate(robotId, imuData);
			updateRobotImu(robotId, imuData);
		}
	});
};



/**
 * updateRobotImu
 * Update the robot acceleration in influx
 * Copies the last available tags to the new object
 */
function updateRobotImu(_robotId, imuData) {
	const robotId = config.get('Robot.name');
	const robotName = config.get('Robot.name');
	let query = influx.writePoints([{
		measurement: 'robot_imu',
		tags: {
			id: robotId,
			name: robotName,
		},
		fields: {
			linear_acceleration_x: imuData.linear_acceleration.x,
			linear_acceleration_y: imuData.linear_acceleration.y,
			linear_acceleration_z: imuData.linear_acceleration.z,
			angular_velocity_x: imuData.angular_velocity.x,
			angular_velocity_y: imuData.angular_velocity.y,
			angular_velocity_z: imuData.angular_velocity.z,
		}
	}]).then(() => {
		Logger.debug("Wrote new robot imu data");
	}).catch(e => {
		Logger.warn("Writing Robot IMU failed:", e.message);
	});
	return query;
}


// Run the consumer
const updatePolicy = new UpdatePolicy(MIN_UPDATE_INTERVAL, MAX_UPDATE_INTERVAL);
setupConsumer(updatePolicy);