import { loader } from 'graphql.macro';
import apollo from '../apollo';

const CREATE_BUILDING_MUTATION = loader('../graphql/createBuilding.gql');


export const createBuilding = async function(variables) {
    return apollo.mutate({mutation: CREATE_BUILDING_MUTATION, variables});
}