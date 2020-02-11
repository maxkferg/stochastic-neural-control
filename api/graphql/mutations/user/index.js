const userSignup = require('./UserSignupMutation');
const userSignin = require('./UserSigninMutation');
const userSigninGoogle = require('./UserSigninGoogleMutation');
const user = require('./UserMutation');

module.exports = {
    userSignup,
    userSignin,
    userSigninGoogle,
    user
};