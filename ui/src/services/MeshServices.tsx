import { loader } from 'graphql.macro';
import apollo from '../apollo';

const GET_MESH_BUILDING_QUERY = loader('../graphql/getMeshesBuilding.gql');
const CREATE_MESH_BUILDING = loader('../graphql/createMeshBuilding.gql')

export const getMeshesOfBuilding = async function(variables) {
    return apollo.query({query: GET_MESH_BUILDING_QUERY, variables});
}


export const createMeshOfBuilding = async function(variables) {
    return apollo.mutate({ mutation: CREATE_MESH_BUILDING, variables})
}