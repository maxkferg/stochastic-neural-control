import { loader } from 'graphql.macro';
import apollo from '../apollo';

const CREATE_MESH_BUILDING = loader('../graphql/createMeshBuilding.gql');
const GET_MESH_BUILDING_QUERY = loader('../graphql/getMeshesBuilding.gql');

export const getMeshesOfBuilding = async function(variables) {
    return apollo.watchQuery({query: GET_MESH_BUILDING_QUERY, pollInterval: 1000, variables});
}

export const createMeshOfBuilding = async function(variables) {
    return apollo.mutate({ mutation: CREATE_MESH_BUILDING, variables})
}