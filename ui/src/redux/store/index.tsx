import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk'; 
import logger from 'redux-logger'
import createRootReducer from '../reducers';


const PLAN_POINT_CLOUD = 'latest';
const LIMIT_POINT = 1000;
const SUBSCRIBE_POINT_CLOUD = true
export interface ApplicationState {

}


const initialState = {
  pointCloudSetting: {
    strategy: PLAN_POINT_CLOUD,
    limit: LIMIT_POINT,
    subscribePointCloud: SUBSCRIBE_POINT_CLOUD
  }
};


const middleware = [
  logger,
  thunk
];

const composedEnhancers = compose(
  applyMiddleware(...middleware)
);

const store = createStore(
  createRootReducer(),
  initialState,
  composedEnhancers
);

export default store;