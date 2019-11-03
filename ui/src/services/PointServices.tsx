import { loader } from 'graphql.macro';
import apollo from '../apollo';

const SUBSCRIBE_POINT_CLOUD = loader('../graphql/subscribePointsOfRobot.gql');

export const subscribePointCloudRobot = async function (variables) {
    return apollo.subscribe({ query: SUBSCRIBE_POINT_CLOUD, variables})
}