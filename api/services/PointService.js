const mongoose = require('mongoose');
const pointSchema = require('../database/mongo/Point').schema;
const PointModel = mongoose.model('point', pointSchema);
const MAX_POINTS_GROUP_ROBOT = 100000;

function getPointsOfRobot(robotId) {
    return PointModel.find({ "robot.id" : robotId })
}

function countPointsGroupOfRobot(robotId) {
    return PointModel.countDocuments({ "robot.id" : robotId }) 
}

function removePointsGroupOfRobot(robotId) {
    return PointModel.deleteMany({ "robot.id": robotId})
}

function getRandomPointsOfRobot(robotId) {
    return PointModel.find({ "robot.id" : robotId}).limit(1)
}

async function hookPointsTemporary(insertPoints, robotId) {
    const currentPointsGroup = await countPointsGroupOfRobot(robotId);
    if (currentPointsGroup + insertPoints.length > MAX_POINTS_GROUP_ROBOT) {
        await removePointsGroupOfRobot(robotId);
    }
}

async function addPointsOfRobot(robot, header, points) {

    // Use Babylon convention where y axis is upwards
    const insertPoints = points.map(point => {
        const newPoint = {
            position: {
                x: point[0],
                y: point[2],
                z: point[1]
            },
            attribute: {
                r: point[4] ? point[4] : 0,
                b: point[5] ? point[5] : 0,
                g: point[6] ? point[6] : 0
            }
        }
        return newPoint;
    });
    await hookPointsTemporary(insertPoints, robot.id)

    const insertPointsGroup = {
        pointsGroup: insertPoints,
        robot: {
            id: robot.id
        },
        time: {
            secs: header.stamp.secs,
            nsecs: header.stamp.nsecs
        }
    }
    return PointModel.create(insertPointsGroup)
}


module.exports = {
    getPointsOfRobot,
    addPointsOfRobot,
    countPointsGroupOfRobot,
    removePointsGroupOfRobot,
    getRandomPointsOfRobot
}   