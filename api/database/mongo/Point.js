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

const robotSchema = {
    id: {
        type: ObjectId, required: true
    }
}

const timeSchema = { 
    secs: {
        type: Date
    },
    nsecs: {
        type: Date
    }
}

exports.schema = {
    robot: { type: robotSchema, require: true },
    position: { type: pointPositionSchema, required: true},
    attribute: { type: pointAttributeSchema, require: true}, 
    time: { type: timeSchema}
};

exports.indexes = [
    {"robot.id":  1},
];

