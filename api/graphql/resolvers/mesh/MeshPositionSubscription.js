const BaseResolver = require('../../BaseResolver');
const influx = require('../../../influxdb');
const Influx = require('influx');
const {
    GraphQLString,
} = require('graphql');

/*
 * Return the last visible instance of a particular
 * ObjectId
 */
class MeshPositionSubscription extends BaseResolver {

  get args() {
    return {
      id: {
        type: GraphQLString,
        description: 'Id for the object (optional).'
      }
    }
  }

  async resolve (payload, args, context, info) {
    const { id : robotId } = args;
    let result = await influx.query(`
        select * from mesh_position
        where id = ${Influx.escape.stringLit(robotId)}
        order by time asc
        limit 1`
    )
    const data = {
      id: result[0].id,
      position: {
        x: result[0].x,
        y: result[0].y,
        z: result[0].z,
        theta: result[0].theta
      }
    }
    return data;
  }
}



module.exports = MeshPositionSubscription;