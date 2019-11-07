const mongoose = require('mongoose');
const pointSchema = require('../database/mongo/Point').schema;
const PointModel = mongoose.model('point', pointSchema);


function getPointsOfRobot(robotId) {
    return PointModel.find({ "robot.id" : robotId })
}

function countPointsGroupOfRobot(robotId) {
    return PointModel.count({ "robot.id" : robotId }) 
}

function removePointsGroupOfRobot(robotId) {
    return PointModel.deleteMany({ "robot.id": robotId})
}
function addPointsOfRobot(robot, header, points) {
    const insertPoints = points.map(point => {
        const newPoint = {
            position: {
                x: point[0],
                y: point[1],
                z: point[2]
            },
            attribute: {
                r: point[4] ? point[4] : 0,
                b: point[5] ? point[5] : 0,
                g: point[6] ? point[6] : 0
            }
        }
        return newPoint;
    });

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
    console.log('w')
    return PointModel.insertMany(insertPointsGroup)
}


module.exports = {
    getPointsOfRobot,
    addPointsOfRobot,
    countPointsGroupOfRobot,
    removePointsGroupOfRobot
}   