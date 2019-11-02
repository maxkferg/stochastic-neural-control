const mongoose = require('mongoose');
const pointSchema = require('../database/mongo/Point').schema;
const PointModel = mongoose.model('point', pointSchema);

async function getPointsOfRobot(robotId) {
    const points = await PointModel.find({ robot_id: robotId })
}

module.exports = {
    getPointsOfRobot
}   