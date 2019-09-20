const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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

exports.hashingPassword = async function (password, saltRounds = 10) {
    return bcrypt.hash(password, saltRounds);
}

exports.compareHashPassword = async function (password, hashPassword) {
    return bcrypt.compare(password, hashPassword);
}