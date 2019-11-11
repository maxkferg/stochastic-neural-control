const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


/**
 * Robot Schema
 * Defines a robot and its properties
 *
 */
exports.schema = {
    name: {type: String, required: false, default: null},
    mesh_id: {type: ObjectId, required: true},
    owner_id: {type: ObjectId, required: false},
    building_id: {type: ObjectId, required: false},
    trajectory_id: {type: ObjectId, required: false},
    isRealRobot: {type: Boolean, required: true, default: false},
    validControlTopics: {type: [String], required: true, default: []},
    lastCommandReceived: { type: Date, required: true, default: Date.now },
    lastPositionReceived: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
    createdAt: { type: Date, required: true, default: Date.now },
};


exports.indexes = [
    {name: 1},
    {mesh_id: 1},
    {owner_id: 1},
    {building_id: 1},
];
