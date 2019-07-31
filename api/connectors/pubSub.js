const { PubSub } = require('graphql-subscriptions');

// Create an in memory pubsub system
module.exports = new PubSub();