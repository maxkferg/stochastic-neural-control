import React, { useEffect } from 'react';
import { Route, Switch } from 'react-router';
import AuthenticationRoute from './AuthenticationRoute';
import App from '../containers/App/App';
import About from '../containers/About';
import Error from '../pages/error/Error';
import Auth from '../pages/login/Login'
import DashBoard from '../pages/dashboard/Dashboard';
import Landing from '../containers/Landing';
import { verifyToken } from '../services/AuthServices';
import { LayoutProvider } from "../context/LayoutContext";
import { connect } from 'react-redux';
import { setCurrentUser } from '../redux/actions/currentUser';


interface RoutersProps {
	setCurrentUser: Function
}

const Routers: React.FC<RoutersProps> = props => {
	const { setCurrentUser } = props;
	useEffect(() => {
		async function verifyTokenToken() {
			try {
				const verifyTokenResp = await verifyToken();
				if (verifyTokenResp.data.verifyToken.id) {
					setCurrentUser(verifyTokenResp.data.verifyToken);
				}
			} catch {
				localStorage.removeItem('token');
			}
		}
		verifyTokenToken()
	}, [])
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

const mapDispatchToProps = (dispatch) : RoutersProps => ({
	setCurrentUser: (payload) => dispatch(setCurrentUser(payload))
})
export default connect(null, mapDispatchToProps)(Routers)