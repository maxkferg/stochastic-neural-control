const influx = require('./influx');
const setup = require('./setup');

setup(influx);
module.exports = influx;