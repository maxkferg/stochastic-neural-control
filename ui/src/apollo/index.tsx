/*
 * Apollo client for HTTP requests
 *
 */
import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink } from 'apollo-link';

const httpLink = createHttpLink({
  uri: '/graphql',
});

let uri: string;
let local_host: string = "localhost";

if (document.location.hostname==local_host){
	uri = "http://localhost:8888/graphql"
} else {
	uri = "http://api.digitalpoints.io/graphql"
}

const authLink: ApolloLink = setContext((_, { headers }) => {
	const token: string = localStorage.getItem('token') || '';
	return {
	  headers: {
		...headers,
		authorization: token ? `Bearer ${token}` : "",
	  },
	  uri,
	}
});

const client = new ApolloClient({
	link: authLink.concat(httpLink),
	cache: new InMemoryCache()
});
  

export default client;