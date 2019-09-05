const path = require('path');
const config = require('config');
const database = require('../database');
const geometryConnector = require('./mapGeometry');



async function start(db){
	require('./robotPosition');
	require('./robotImu');
	//require('./robotMap');
	geometryConnector(db)
}


module.exports = start