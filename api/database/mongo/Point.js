const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

/**
 * Point Schema
 * Defines current point in a building
 *
 */
exports.schema = {
    building_id: {type: ObjectId, required: true},
    robot_id: {type: ObjectId, required: false},
    x: { type: Number, required: true, default: null },
    y: { type: Number, required: true, default: null },
    z: { type: Number, required: true, default: null },
    r: { type: Number, required: true, default: null },
    g: { type: Number, required: true, default: null },
    b: { type: Number, required: true, default: null },
    t: { type: Number, required: true, default: null },
};

exports.indexes = [
    {building_id: 1},
    {robot_id: 1},
];

