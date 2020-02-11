const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


/**
 * Trajectory Schema
 * Defines a trajectory throught the building
 * A trajectory is made up of a number of points which exist in a certain coordinate frame
 *
 */
exports.schema = {
    owner_id: {type: ObjectId, required: false},
    building_id: {type: ObjectId, required: false},
    frame_id: { type: ObjectId, required: false},
    points: { type: [[Number]]},
    startPoint: { type: [Number], required: false},
    endPoint: { type: [Number], required: false},
    isSafe: { type: Boolean, required: true, default: true },
    isReady: { type: Boolean, required: true, default: false },
    isDeleted: { type: Boolean, required: true, default: false },
    updatedAt: { type: Date, required: true, default: Date.now },
    createdAt: { type: Date, required: true, default: Date.now },
};


exports.indexes = [
    {building_id: 1},
    {owner_id: 1},
];
