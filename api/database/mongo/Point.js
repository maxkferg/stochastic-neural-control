const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

/**
 * Point Schema
 * Defines current point in a building
 *
 */

const pointPositionSchema = {
    x: { type: Number, required: true, default: null },
    y: { type: Number, required: true, default: null },
    z: { type: Number, required: true, default: null },
}

const pointAttributeSchema = {
    r: { type: Number, required: true, default: null },
    g: { type: Number, required: true, default: null },
    b: { type: Number, required: true, default: null },
}
exports.schema = {
    building_id: {type: ObjectId, required: true},
    robot_id: {type: ObjectId, required: false},
    position: { type: pointPositionSchema, required: true},
    attribute: { type: pointAttributeSchema, require: true}, 
    t: { type: Date, required: true, default: null },
};

exports.indexes = [
    {building_id: 1},
    {robot_id: 1},
];

