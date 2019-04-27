const Influx = require('influx');


function setup(influx){
  influx.getDatabaseNames()
    .then(names => {
      if (!names.includes('geometry_db')) {
        return influx.createDatabase('geometry_db');
      }
    }).then(() => {
      return influx.query(`
        select * from mesh_position
        where type = wall
        order by time asc
        limit 1
      `)
    }).then((rows) => {
      if (rows.length>0){
        return
      }
      let query = influx.writePoints([
        {
          measurement: 'mesh_position',
          tags: {
              id: 'wall1b',
              name: 'wall1',
              type: 'wall',
              deleted: false
          },
          fields: {
              x: 0,
              y: 0,
              z: 0,
              theta: 0,
              scale: 1,
              height: 3,
              width: 10,
              depth: 10,
              geometry_filetype: 'obj',
              geometry_directory: './geometry/env/labv2/',
              geometry_filename: 'walls.obj',
              physics_stationary: true,
              physics_collision: false,
          },
        }
      ]).then(() => {
        return influx.query(`
          select * from mesh_position
          order by time asc
        `)
      }).then((rows) => {
        console.log('Influx wall entries:', rows.length);
      });
    });
}



module.exports = setup