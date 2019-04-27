const Influx = require('influx');


const influx = new Influx.InfluxDB({
 host: 'localhost',
 database: 'geometry_db',
 schema: [
   {
      measurement: 'mesh_position',
      tags: [
          'id',
          'name',
          'type',
          'deleted'
      ],
      fields: {
          x: Influx.FieldType.FLOAT,
          y: Influx.FieldType.FLOAT,
          z: Influx.FieldType.FLOAT,
          theta: Influx.FieldType.FLOAT,
          scale: Influx.FieldType.FLOAT,
          height: Influx.FieldType.FLOAT,
          width: Influx.FieldType.FLOAT,
          depth: Influx.FieldType.FLOAT,
          geometry_filetype: Influx.FieldType.STRING,
          geometry_filename: Influx.FieldType.STRING,
          geometry_directory: Influx.FieldType.STRING,
          physics_stationary: Influx.FieldType.BOOLEAN,
          physics_collision: Influx.FieldType.BOOLEAN,
      }
   }
 ]
})

module.exports = influx;