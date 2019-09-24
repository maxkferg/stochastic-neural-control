import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'connected-react-router';
import thunk from 'redux-thunk'; 
import { createBrowserHistory } from 'history';
import createRootReducer from '../reducers';

export interface ApplicationState {

}

export const history = createBrowserHistory();

const initialState = {};


const middleware = [
  routerMiddleware(history),
  thunk
];

const composedEnhancers = compose(
  applyMiddleware(...middleware)
);

const store = createStore(
  createRootReducer(history),
  initialState,
  composedEnhancers
);

export default store;