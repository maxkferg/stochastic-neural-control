import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk'; 
import logger from 'redux-logger'
import createRootReducer from '../reducers';


const PLAN_POINT_CLOUD = 'default';
const LIMIT_POINT = 1000;
export interface ApplicationState {

}


const initialState = {
  pointCloudSetting: {
    strategy: PLAN_POINT_CLOUD,
    limit: LIMIT_POINT
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