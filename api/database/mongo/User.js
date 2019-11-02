
exports.schema = {
    firstName: {type: String, default: null},
    lastName: {type: String, default: null},
    password: {type: String},
    email: {type: String, default: null, require: true}
};


exports.indexes = [
    {firstName: 1, lastName: 1},
    {email: 1}
];

