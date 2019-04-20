import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import createSagaMiddleware from 'redux-saga';
import createRootReducer from '../modules';

// application-wide state: see /todo/index -> connect(...)
export interface ApplicationState {

}


// NOTE: getBrowserHistoryBuildOptions() is only used for gh-pages.
// If you clone this repo and are deploying to root directory, just use:
// export const history = createHistory();
export const history = createBrowserHistory();

// const enhancers = [];
const initialState = {};

// setup sagas
const sagaMiddleware = createSagaMiddleware();

const middleware = [
  routerMiddleware(history),
  sagaMiddleware
];

if (process.env.NODE_ENV === 'development') {

    // tslint:disable-next-line: no-any
    // const windowIfDefined = typeof window === 'undefined' ? null : window as any;
    // const devToolsExtension = windowIfDefined && windowIfDefined.devToolsExtension as () => GenericStoreEnhancer;

    //if (typeof devToolsExtension === 'function') {
    //    enhancers.push(devToolsExtension());
    //}
}

const composedEnhancers = compose(
  applyMiddleware(...middleware)
);

const store = createStore(
  createRootReducer(history),
  initialState,
  composedEnhancers
);

export default store;