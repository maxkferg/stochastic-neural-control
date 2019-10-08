import { loader } from 'graphql.macro';
import apollo from '../apollo';
const CREATE_USER_MUTATION = loader('../graphql/createUser.gql');
const SIGN_IN_USER_MUTATION =  loader('../graphql/signInUser.gql');
const SIGN_IN_GOOGLE_USER_MUTATION = loader('../graphql/signInUserGoogle.gql');
const VERIFY_TOKEN = loader('../graphql/verifyToken.gql');

export const signUp = async function(variables) {
    return apollo.mutate({mutation: CREATE_USER_MUTATION, variables});
}

export const signIn = async function(variables) {
    return apollo.mutate({mutation: SIGN_IN_USER_MUTATION, variables});
}

export const signInGoogleUser = async function(variables) {
    return apollo.mutate({mutation: SIGN_IN_GOOGLE_USER_MUTATION, variables});
}

export const verifyToken = async function () {
    return apollo.query({ query: VERIFY_TOKEN });
}

export const signInWithGoogle = async function (tokenId) {
    const variables = {
        tokenId
    };
    return apollo.mutate({mutation: SIGN_IN_GOOGLE_USER_MUTATION, variables});
}