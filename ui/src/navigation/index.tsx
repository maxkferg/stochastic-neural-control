import * as React from 'react';
import { Route, Switch } from 'react-router'
import App from '../containers/App/App';
import About from '../containers/About';


export const Routers = () => (
	<Switch>
		<Route path="/about" component={About} />
		<Route path="/building/:buildingId" component={App}/>
		<Route path="/" component={App} />
  	</Switch>
)