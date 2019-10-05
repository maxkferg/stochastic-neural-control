import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import store from './redux/store';
import Routers from './navigation';
import { Router} from 'react-router-dom';
import { ApolloProvider } from 'react-apollo';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import client from './apollo';
import { createBrowserHistory } from "history"
import './index.css';
export const customHistory = createBrowserHistory()
const theme = createMuiTheme();

ReactDOM.render(
  <MuiThemeProvider theme={theme}>
	  <Provider store={store}>
	  	<ApolloProvider client={client}>
			  <Router history={customHistory}>
			  	<Routers />
			  </Router>
	    </ApolloProvider>
	  </Provider>
  </MuiThemeProvider>,
  document.getElementById('root') as HTMLElement
);
