
exports.schema = {
    fullName: {type: String, default: null},
    password: {type: String},
    email: {type: String, default: null, require: true}
};


exports.indexes = [
    {fullName: 1},
    {email: 1}
];

