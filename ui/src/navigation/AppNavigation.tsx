import React from 'react';
import { Route, Switch } from 'react-router'
import Model from '../containers/Model';
import BuildingMap from '../containers/BuildingMap';
import NoMatch from '../containers/NoMatch';
import { getBuilding } from '../services/BuildingServices';
import { withRouter } from 'react-router-dom';
   
     
class AppNavigation extends React.Component <{
	classes: any
	match: any
	onSelectedObject: Function
	createGeometry: Function
}> {
	async componentDidMount() {
		try {
			const building = await getBuilding({ 
				buildingId: this.props.match.params.buildingId
			});
			console.log(building)
			if (!building.data.getBuilding.id) {
				throw new Error('Building not found');
			}
		} catch(error) {
			//@ts-ignore
			this.props.history.push('/no-match');
		}
	}
	
	render () {
		const { classes } = this.props;
		return (
		<Switch>
			<Route path="/building/:buildingId/model" render={_ => <Model {...this.props} />}/>
			<Route path="/building/:buildingId/building-map" render={() => <BuildingMap classes={classes}/>} />
			<Route path="/building/:buildingId/slam" render={_ => <h1>In Progress</h1>}/>
			<Route component={NoMatch} />
	  	</Switch>
	)
	}
}
//@ts-ignore
export default withRouter(AppNavigation)