const influx = require('./schema');
const setup = require('./setup');

setup(influx);
module.exports = influx;