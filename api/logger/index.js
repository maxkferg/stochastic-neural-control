const pino = require('pino')


module.exports = pino({
  	prettyPrint: {
  	  	ignore: 'pid,hostname',
  	}
})