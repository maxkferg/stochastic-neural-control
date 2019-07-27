import ApolloClient from "apollo-boost";

//let host = document.location.protocol+"//"+document.location.hostname
//let port = "8888";

export default new ApolloClient({
	//uri: "http://localhost:8888/graphql"
	//uri: host + ":" + port + "/graphql"
	uri: "http://api.digitalpoints.io/graphql"
});