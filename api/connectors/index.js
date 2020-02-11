const geometryConnector = require('./mapGeometry');

async function start(db){
	require('./robotPosition');
	require('./robotImu');
	require('./pointCloud');
	//require('./robotMap');
	geometryConnector(db)
}


module.exports = start