const app = require('./app');

// Fire up the connectors
require('./connectors/robotPosition');
require('./connectors/robotImu');


app();