const config = require('config');
const kafka = require('kafka-node');
const qte = require('quaternion-to-euler');
const Influx = require('influx');
const influx = require('../influxdb');
const UpdatePolicy = require('./updatePolicy');
const logger = require('../logger');
const pubSub = require('./pubSub');
const validator = require('./validator');
const debounce = require('lodash/debounce');

const Consumer = kafka.Consumer;
const kafkaHost = config.get("Kafka.host");
logger.info("Creating Kafka Consumer (robot position): "+kafkaHost);
const client = new kafka.KafkaClient({kafkaHost: kafkaHost});

const MIN_UPDATE_INTERVAL = 1*1000 // Never update faster than 1 Hz
const MAX_UPDATE_INTERVAL = 10*1000 // Always update every 10s
const MESH_POSITION_TOPIC = "mesh_position";

const consumer = new Consumer(
    client,
    [{ topic: 'robot.events.odom', partition: 0 }],
    { autoCommit: true }
);


function isString(message){
    return (typeof message === 'string' || message instanceof String);
}



/**
 * setupConsumer
 * Setup a consumer that copies data from Kafka to Influx
 */
function setupConsumer(updatePolicy){
    let x = 0;
    let y = 0;
    let z = 0;
    let euler;
    const debouncePeriod = 100; // ms
    const publishRobotPositionDebounced = debounce(publishRobotPosition, debouncePeriod)

    consumer.on('message', function(message){
        message = JSON.parse(message.value);
        v = validator.validatePose(message)

        if (v.errors.length){
            logger.error("Message validation failed: " + v.errors[0].stack);
            return;
        }
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
        publishRobotPositionDebounced(message.robot.id, x, y, z, theta)
    });
};



/**
 * publishRobotPosition
 * Publish robot position to the websocket and database
 * - Publishes every message to the websocket
 * _ Only publishes messages to Influx if they change
 */
function publishRobotPosition(robotId, x, y, z, theta){
    // Update the robot position at every step (pubSub)
    pubSub.publish(MESH_POSITION_TOPIC, {
        id: robotId,
        position: {
            x: x,
            y: y,
            z: z,
            theta
        }
    });

    let state = {
        x: x,
        y: y,
        z: z,
        theta: theta
    }

    // Update influxdb intermittently 
    if (updatePolicy.shouldUpdate(state)){
        updatePolicy.willUpdate(state);
        updateRobotPositionInflux(robotId, x, y, z, theta);
        logger.debug("Wrote new robot pos data");
    }
}


/**
 * updateRobotPosition
 * Update the robot position in influx
 * Copies the last available tags to the new object
 */
function updateRobotPositionInflux(robotId, x, y, z, theta){
    let query = influx.query(`
        select * from mesh_position
        where id = ${Influx.escape.stringLit(robotId)}
        order by time asc
        limit 1`
    ).then((results) => {
        if (results.length==0){
            throw new Error("Could not find robot "+robotId);
        }
        //if (results[0].deleted){
        //  throw new Error("Can not move a deleted robot");
        //}
        let robot = results[0];
        return influx.writePoints([{
            measurement: 'mesh_position',
            tags: {
                id: robot.id,
                name: robot.name,
                type: robot.type,
                building_id: robot.building_id,
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
                physics_collision: robot.physics_collision,
                physics_simulated: robot.physics_simulated,
            }
        }]);
    }).then(() => {
        logger.info("Wrote new robot position", x.toFixed(3), y.toFixed(3), z.toFixed(3) ,theta.toFixed(3));
    }).catch(e => {
        logger.warn("Robot position failed:", e.message);
    });
}


// Run the consumer
const updatePolicy = new UpdatePolicy(MIN_UPDATE_INTERVAL, MAX_UPDATE_INTERVAL);
setupConsumer(updatePolicy);