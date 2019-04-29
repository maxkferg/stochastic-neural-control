const app = require('./app');

// Fire up the connectors
require('./connectors/robot_position');
require('./connectors/robotImu');


app();