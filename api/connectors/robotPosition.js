const config = require('config');
const kafka = require('kafka-node');
const qte = require('quaternion-to-euler');
const Influx = require('influx');
const influx = require('../influxdb');
const UpdatePolicy = require('./updatePolicy');
const logger = require('../logger');
const pubSub = require('./pubSub');
const validator = require('./validator');


const SOCKET_UPDATE_MIN = 10 // Never update more than every 10 ms
const SOCKET_UPDATE_MAX = 1000 // Always update every second
const INFLUX_UPDATE_MIN = 1*1000 // Never update faster than 1 Hz
const INFLUX_UPDATE_MAX = 10*1000 // Always update every 10s
const MESH_POSITION_TOPIC = "mesh_position";
const SocketUpdatePolicy = new UpdatePolicy(SOCKET_UPDATE_MIN, SOCKET_UPDATE_MAX);
const InfluxUpdatePolicy = new UpdatePolicy(INFLUX_UPDATE_MIN, INFLUX_UPDATE_MAX);


const kafkaHost = config.get("Kafka.host");
logger.info("Creating Kafka Consumer (robot position): " + kafkaHost);
const client = new kafka.KafkaClient({kafkaHost: kafkaHost});
const consumer = new kafka.Consumer(
    client,
    [{ topic: 'robot.events.odom', partition: 0 }],
    { autoCommit: true }
);


/**
 * isString
 * Return true if @message is a string
 */
function isString(message){
    return (typeof message === 'string' || message instanceof String);
}


/**
 * setupConsumer
 * Setup a consumer that copies data from Kafka to Influx
 * New 
 */
function setupConsumer(){
    let x = 0;
    let y = 0;
    let z = 0;
    let euler;

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
        let robotId = message.robot.id;
        let theta = euler[0]+Math.PI/2; // Mesh is wrong

        let state = {
            x: x,
            y: y,
            z: z,
            theta: theta
        }

        // Do not even compute a diff if we still need to wait a while
        if (!SocketUpdatePolicy.mightUpdate(robotId)){
            return
        }

        // Update socket intermittently 
        if (SocketUpdatePolicy.shouldUpdate(robotId, state, isChanged)){
            SocketUpdatePolicy.willUpdate(robotId, state);
            updateRobotPositionSocket(robotId, x, y, z, theta);
        }

        // Update influxdb intermittently 
        if (InfluxUpdatePolicy.shouldUpdate(robotId, state, isChanged)){
            InfluxUpdatePolicy.willUpdate(robotId, state);
            updateRobotPositionInflux(robotId, x, y, z, theta);
            logger.debug("Wrote new robot pos data");
        }
    });
};


/**
 * isChanged
 * Return true if prevState is different from currentState
 */
function isChanged(prevState, currentState){
    const tol = 0.005;
    return (
        Math.abs(prevState.x - currentState.x) > tol ||
        Math.abs(prevState.y - currentState.y) > tol ||
        Math.abs(prevState.z - currentState.z) > tol ||
        Math.abs(prevState.theta - currentState.theta) > 10*tol
    )
}



/**
 * updateRobotPositionSocket
 * Update the robot position on the websocket
 * Copies the last available tags to the new object
 */
function updateRobotPositionSocket(robotId, x, y, z, theta){
    pubSub.publish(MESH_POSITION_TOPIC, {
        id: robotId,
        position: {
            x: x,
            y: y,
            z: z,
            theta
        }
    });
}



/**
 * updateRobotPositionInflux
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
setupConsumer();