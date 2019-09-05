const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


/**
 * Geometry Schema
 * Defines current geometry in a building
 *
 * Setting isDeleted flag is preferred over deleting the object
 * as the history of each object is tracked in influxdb
 *
 */
exports.schema = {
    name: {type: String, required: true, default: null},
    building_id: {type: ObjectId, required: true},
    type: {type: String, required: true, default: "object"},
    scale: {type: [Number], required: true, default: [1,1,1]},
    position: {type: [Number], required: true, default: [0,0,0,0]},
    rotation: {type: [Number], required: true, default: [0,0,0,1]},
    height: {type: Number, required: true},
    width: {type: Number, required: true},
    depth: {type: Number, required: true},
    isDeleted: {type: Boolean, required: true, default: false},
    updatedAt: { type: Date, required: true, default: Date.now },
    createdAt: { type: Date, required: true, default: Date.now },
    mesh: {
      filetype: {type: String, required: true},
      filename: {type: String, required: true},
      directory: {type: String, required: true},
    },
    physics: {
      stationary: {type: String, required: true, default: true},
      collision: {type: String, required: true, default: false},
      simulated: {type: String, required: true, default: false},
    },
};


exports.indexes = [
    {name: 1},
    {building_id: 1},
];
