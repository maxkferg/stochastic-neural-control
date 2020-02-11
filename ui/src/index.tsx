import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import store from './redux/store';
import Routers from './navigation';
import { Router} from 'react-router-dom';
import { ApolloProvider } from 'react-apollo';
import { MuiThemeProvider } from '@material-ui/core/styles';
import client from './apollo';
import { createBrowserHistory } from "history"
import './index.css';
export const customHistory = createBrowserHistory()
import Themes from "./themes";
import ErrorBoundary from './containers/ErrorBoundary';
ReactDOM.render(
  <MuiThemeProvider theme={Themes.default}>
	  <Provider store={store}>
	  	<ApolloProvider client={client}>
			  <ErrorBoundary>
				<Router history={customHistory}>
					<Routers />
				</Router>
			  </ErrorBoundary>
	    </ApolloProvider>
	  </Provider>
  </MuiThemeProvider>,
  document.getElementById('root') as HTMLElement
);
