const UserMutations = require('./user');
const MeshMutations = require('./mesh');
const RobotMutations = require('./robot');
const MapGeometryMutations = require('./map');
const TrajectoryMutations = require('./trajectory');
const BuildingMutation = require('./building');
const ObjectMutations = require('./object')
const PointMutations = require('./point');

module.exports = {
    UserMutations,
    MeshMutations,
    RobotMutations,
    MapGeometryMutations,
    TrajectoryMutations,
    BuildingMutation,
    ObjectMutations,
    PointMutations
};