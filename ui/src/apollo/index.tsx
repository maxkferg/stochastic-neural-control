import ApolloClient from "apollo-boost";

let uri;
let local_host = "localhost";


if (document.location.host==local_host){
	uri = "http://localhost:8888/grapql"
} else {
	uri = "http://api.digitalpoints.io/graphql"
}


export default new ApolloClient({
	uri: uri
});