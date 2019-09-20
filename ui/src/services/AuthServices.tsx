import { loader } from 'graphql.macro';
import apollo from '../apollo';
const CREATE_USER_MUTATION = loader('../graphql/createUser.gql');
const SIGN_IN_USER_MUTATION =  loader('../graphql/signinUser.gql');
export const signUp = async function(variables) {
    return apollo.mutate({mutation: CREATE_USER_MUTATION, variables});
}

export const signIn = async function(variables) {
    return apollo.mutate({mutation: SIGN_IN_USER_MUTATION, variables});
}