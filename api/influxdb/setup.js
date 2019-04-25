

function setup(influx){
	influx.getDatabaseNames()
	  .then(names => {
	    if (!names.includes('geometry_db')) {
	      return influx.createDatabase('geometry_db');
	    }
	  })
}



module.exports = setup