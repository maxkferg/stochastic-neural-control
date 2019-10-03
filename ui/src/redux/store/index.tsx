import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk'; 
import logger from 'redux-logger'
import createRootReducer from '../reducers';

export interface ApplicationState {

}


const initialState = {};


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