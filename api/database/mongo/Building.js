const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


/**
 * Building Schema
 * Defines a building
 *
 */
exports.schema = {
    name: {type: String, required: false, default: null},
    owner_id: {type: ObjectId, required: true},
    isDeleted: {type: Boolean, required: true, default: false},
};


exports.indexes = [
    {name: 1},
    {owner_id: 1},
];
