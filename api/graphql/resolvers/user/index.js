const getUser = require('./UserResolver');
const getAllUsers = require('./UserAllResolver');
const verifyToken = require('./VerifyToken');
module.exports = {
    getUser,
    getAllUsers,
    verifyToken
};