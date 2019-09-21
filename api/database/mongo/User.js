const mongoose = require('mongoose');

exports.schema = {
    firstName: {type: String, default: null},
    lastName: {type: String, default: null},
    password: {type: String, required: true},
    email: {type: String, default: null, require: true}
    // role: {type: String},
    // age: {type: Number},
    // fullName: {type: String, default: null},
    // username: {type: String, required: true},
};


exports.indexes = [
    {firstName: 1, lastName: 1},
    {email: 1}
];

