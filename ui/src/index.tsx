import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Route, Switch } from 'react-router'
import { ConnectedRouter } from 'connected-react-router';
import registerServiceWorker from './registerServiceWorker';
import store, { history } from './store';
//import Layout from './containers/layout';
import Home from './containers/home';
import About from './containers/about';

import './index.css';
import 'bootstrap/dist/css/bootstrap.css';

ReactDOM.render(
  <Provider store={store}>
      <ConnectedRouter history={history} >
        <Switch>
          <Route exact path="/" render={() => (<Home />)} />
          <Route render={() => (<About />)} />
        </Switch>
       </ConnectedRouter>
  </Provider>,
  document.getElementById('root') as HTMLElement
);

// NOTE: if (module.hot) { module.hot.accept.....}
registerServiceWorker();
