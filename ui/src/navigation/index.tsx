import * as React from 'react';
import { Route, Switch } from 'react-router'
import App from '../containers/App/App';
import About from '../containers/About';
import Signup from '../containers/Signup';
import Signin from '../containers/Signin';
export const Routers = () => (
	<Switch>
		<Route path="/about" component={About} />
		<Route path="/building/:buildingId" component={App}/>
		<Route path="/sign-in" component={Signin} />
		<Route path="/sign-up" component={Signup} />
		<Route path="/" component={App} />
  	</Switch>
)