import React, { useEffect } from 'react';
import { Route, Switch } from 'react-router'
import Model from '../containers/Model';
import BuildingMap from '../containers/BuildingMap';
import { getBuilding } from '../services/BuildingServices';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import errorPage from '../pages/error/Error';

type urlParams = {
	buildingId: string
}

interface AppNavigationProps extends RouteComponentProps<urlParams> {
	classes: any
	onSelectedObject: Function
	onClickAddBtn: Function
}

const AppNavigation: React.FC<AppNavigationProps> = props => {
		const { classes, match, history } = props; 
		useEffect(() => {
			async function appNavigationDidMount() {
				try {
					const building = await getBuilding({ 
						buildingId: match.params.buildingId
					});
					if (!building.data.getBuilding.id) {
						throw new Error('Building not found');
					}
				} catch(error) {
					const isGuest = localStorage.getItem('role') === 'guest';
					!isGuest && history.push('/no-match');
				}
			}
			appNavigationDidMount()
		})
		return (
		<Switch>
			<Route path="/app/building/:buildingId/model" render={_ => <Model {...props} />}/>
			<Route path="/app/building/:buildingId/building-map" render={() => <BuildingMap classes={classes}/>} />
			<Route path="/app/building/:buildingId/slam" render={_ => <h1>In Progress</h1>}/>
			<Route path="/app/building/:buildingId/point-cloud" render={() => <Model {...props} />} />
			<Route component={errorPage} />
	  	</Switch>
	)
}

export default withRouter(AppNavigation)