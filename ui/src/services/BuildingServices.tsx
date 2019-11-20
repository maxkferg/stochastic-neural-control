import { loader } from 'graphql.macro';
import apollo from '../apollo';
const CREATE_BUILDING_MUTATION = loader('../graphql/createBuilding.gql');
const GET_BUILDINGS_QUERY = loader('../graphql/getBuildings.gql');
const GET_BUILDING_QUERY = loader('../graphql/getBuilding.gql')
const GET_GUEST_BUILDINGS_QUERY = loader('../graphql/getGuestBuildings.gql')

export const createBuilding = async function(variables) {
    return apollo.mutate({mutation: CREATE_BUILDING_MUTATION, variables});
}

export const getBuildings = async function(variables) {
    return apollo.query({query: GET_BUILDINGS_QUERY, variables, fetchPolicy: 'network-only'});
}

export const getGuestBuildings = async function () {
    console.log('vao day')
    return apollo.query({ query: GET_GUEST_BUILDINGS_QUERY });
}

type getUserBuilding = {
    buildingId: String
}

export const getBuilding = async function(variables: getUserBuilding) {
    return apollo.query({ query: GET_BUILDING_QUERY, variables })
}