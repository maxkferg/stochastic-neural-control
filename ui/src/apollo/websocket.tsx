/*
 * Apollo client for GraphQL Subscriptions
 *
 * In the future this should be merged with the Apollo http client
 *
 */
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { WebSocketLink } from "apollo-link-ws";
import { SubscriptionClient } from "subscriptions-transport-ws";

let uri;
let local_host = "localhost";

if (document.location.hostname==local_host){
	uri = "ws://localhost:8888/graphql"
} else {
	uri = "ws://api.digitalpoints.io/graphql"
}

const client = new SubscriptionClient(uri, {
  reconnect: true
});

const link = new WebSocketLink(client);


export default new ApolloClient({
  link: link,
  cache: new InMemoryCache()
});
