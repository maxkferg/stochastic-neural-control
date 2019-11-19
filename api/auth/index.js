const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);

if (typeof(process.env.JWT_SECRET)==="undefined") {
    throw Error("JWT_SECRET environment variable must be set")
}

exports.validate = async function (ctx, next) {
    //do your validation by fetching the user here or just return same context
    if (ctx.state.user) {
        ctx.user = await ctx.db.User.findOne({_id: ctx.state.user._id});
    } else {
        ctx.user = null;
    }

    return next();
};

exports.generateToken = async function (data) {
    return jwt.sign(data, process.env.JWT_SECRET);
};

exports.verifyJwtToken = async function (token) {
    return jwt.verify(token, process.env.JWT_SECRET)
}
exports.hashingPassword = async function (password, saltRounds = 10) {
    return bcrypt.hash(password, saltRounds);
}

exports.compareHashPassword = async function (password, hashPassword) {
    return bcrypt.compare(password, hashPassword);
}

exports.verifyGoogleToken = async function (idToken) {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.CLIENT_ID
    });
    const payload = ticket.getPayload();
    return payload;
}
