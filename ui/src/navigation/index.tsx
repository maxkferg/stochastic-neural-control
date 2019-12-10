import * as React from 'react';
import { Route, Switch } from 'react-router';
import AuthenticationRoute from './AuthenticationRoute';
import App from '../containers/App/App';
import About from '../containers/About';
import Error from '../pages/error/Error';
import Auth from '../pages/login/Login'
import Landing from '../containers/Landing';
import DashBoard from '../pages/dashboard/Dashboard';
import { verifyToken } from '../services/AuthServices';
import { LayoutProvider } from "../context/LayoutContext";
import { connect } from 'react-redux';
import { setCurrentUser } from '../redux/actions/currentUser';
class Routers extends React.Component {
	constructor(props) {
		super(props);
	}
	async componentDidMount() {
		try {
			const verifyTokenResp = await verifyToken();
			//@ts-ignore
			if (verifyTokenResp.data.verifyToken.id) {
				//@ts-ignore
				this.props.setCurrentUser(verifyTokenResp.data.verifyToken);
				//@ts-ignore
				// customHistory.push('/buildings');
			}
		} catch {
			localStorage.removeItem('token');
		}
	}
	render() {
		return (
			<LayoutProvider>
				<Switch>
				<Route exact path="/auth" component={Auth} />
				<Route exact path="/about" component={About} />
				<Route exact path="/" component={Landing} /> 
				<AuthenticationRoute exact path="/app/buildings" component={DashBoard} /> 
				<AuthenticationRoute path="/app/building/:buildingId" component={App}/>
				<Route component={Error} />
				</Switch>
			</LayoutProvider>
		)
	}
}



const mapDispatchToProps = (dispatch) => ({
	setCurrentUser: (payload) => dispatch(setCurrentUser(payload))
})
export default connect(null, mapDispatchToProps)(Routers)