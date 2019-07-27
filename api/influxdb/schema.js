const Influx = require('influx');

console.log("Creating new influx client")
const db = new Influx.InfluxDB({
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
   }, {
      measurement: 'robot_imu',
      tags: [
          'id',
          'name',
      ],
      fields: {
          linear_acceleration_x: Influx.FieldType.FLOAT,
          linear_acceleration_y: Influx.FieldType.FLOAT,
          linear_acceleration_z: Influx.FieldType.FLOAT,
          angular_velocity_x: Influx.FieldType.FLOAT,
          angular_velocity_y: Influx.FieldType.FLOAT,
          angular_velocity_z: Influx.FieldType.FLOAT,
      }
   }
 ]
})

module.exports = db;