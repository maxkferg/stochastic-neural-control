const mongoose = require('mongoose');
const pointSchema = require('../database/mongo/Point').schema;
const PointModel = mongoose.model('point', pointSchema);

function getPointsOfRobot(robotId) {
    return PointModel.find({ robot_id: robotId })
}

function addPointsOfRobot(robotId, pointsData) {
    return PointModel.insertMany(pointsData)
}


module.exports = {
    getPointsOfRobot,
    addPointsOfRobot
}   