const BaseResolver = require('../../BaseResolver');
const { PubSub, withFilter } = require('graphql-subscriptions');
const pubsub = new PubSub();

const {
    GraphQLNonNull,
    GraphQLBoolean,
    GraphQLString,
    GraphQLInt
} = require('graphql');

/*
 * Return the last visible instance of a particular
 * ObjectId
 */
class MeshSubscriptionResolver extends BaseResolver {

  get args() {
    return {
      type: {
          type: GraphQLString,
          description: 'The mesh type (wall, floor, robot, object)'
      },
      deleted: {
          type: GraphQLBoolean,
          description: 'Optionally filter by objects with deleted=$deleted'
      },
      simulated: {
          type: GraphQLBoolean,
          description: 'Optionally filter by objects with physics.simulated=$simulated'
      },
      limit: {
          type: GraphQLInt,
          description: 'The maximum number of results to return'
      },
    };
  }


  async addMessage(root, { message }) {
		const newMessage = {};
		pubsub.publish('messageAdded', {
			messageAdded: newMessage,
			channelId: 'message.channelId'
		});
		return newMessage;
	}
}



module.exports = MeshSubscriptionResolver;