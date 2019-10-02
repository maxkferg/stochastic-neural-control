/*
 * Apollo client for HTTP requests
 *
 */
import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';

const httpLink = createHttpLink({
  uri: '/graphql',
});



let uri;
let local_host = "localhost";


if (document.location.hostname==local_host){
	uri = "http://localhost:8888/graphql"
} else {
	uri = "http://api.digitalpoints.io/graphql"
}

const authLink = setContext((_, { headers }) => {
	const token = localStorage.getItem('token');
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