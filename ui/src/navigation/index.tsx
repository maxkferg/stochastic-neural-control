import * as React from 'react';
import { Route, Switch } from 'react-router';
import AuthenticationRoute from './AuthenticationRoute';
import App from '../containers/App/App';
import About from '../containers/About';
import NoMatch from '../containers/NoMatch';
import SignUp from '../containers/SignUp';
import SignIn from '../containers/SignIn';
import Landing from '../containers/Landing';
import Building from '../containers/Building';
import Alert from '../components/ALert';
import { verifyToken } from '../services/AuthServices';
// import { customHistory } from '../index';
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
			<div>
				<Switch>
					<Route exact path="/about" component={About} />
					<Route exact path="/sign-in" component={SignIn} />
					<Route exact path="/sign-up" component={SignUp} />
					<Route exact path="/no-match" component={NoMatch} />
					<AuthenticationRoute exact path="/buildings" component={Building} />
					<AuthenticationRoute path="/building/:buildingId" component={App} />
					<Route exact path="/" component={Landing} />
					<Route component={NoMatch} />
				</Switch>
				<Alert />
			</div>
		)
	}
}



const mapDispatchToProps = (dispatch) => ({
	setCurrentUser: (payload) => dispatch(setCurrentUser(payload))
})
export default connect(null, mapDispatchToProps)(Routers)