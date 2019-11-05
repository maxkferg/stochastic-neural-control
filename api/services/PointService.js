const mongoose = require('mongoose');
const pointSchema = require('../database/mongo/Point').schema;
const PointModel = mongoose.model('point', pointSchema);

function getPointsOfRobot(robotId) {
    return PointModel.find({ robot_id: robotId })
}

function addPointsOfRobot(robotId, buildingId, pointsData, t) {
    const insertPoints = pointsData.map(point => {
        point.t = t;
        point.robot_id = robotId;
        point.building_id = buildingId;
        return point
    })
    return PointModel.insertMany(insertPoints)
}


module.exports = {
    getPointsOfRobot,
    addPointsOfRobot
}   