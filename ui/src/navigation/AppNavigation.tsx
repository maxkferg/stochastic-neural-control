import * as React from 'react';
import { Route, Switch } from 'react-router'
import Model from '../containers/Model';
import BuildingMap from '../containers/BuildingMap';
import NoMatch from '../containers/NoMatch';
export default function AppNavigation (props) {
	const { classes } = props;
	return (
	<Switch>
		<Route exact path="/model" render={() => <Model {...props} />}/>
        <Route exact path="/building-map" render={() => <BuildingMap classes={classes}/>} />
		<Route component={NoMatch} />
	  </Switch>
	)
}