import React, { useState } from "react";
import {
  Grid,
  CircularProgress,
  Typography,
  Button,
  Tabs,
  Tab,
  TextField,
  Fade,
} from "@material-ui/core";
import { connect } from 'react-redux';
import { signIn, signInWithGoogle, signUp } from '../../services/AuthServices';
import { withRouter } from "react-router-dom";
import GoogleLogin from 'react-google-login'; 
import { setCurrentUser } from '../../redux/actions/currentUser';
// styles
import useStyles from "./styles";

// logo
import google from "./google.svg";
import robotLogo from './logo.jpg';
// context

function Login(props) {
  const classes = useStyles();

  // local
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTabId, setActiveTabId] = useState(0);
  const [fullName, setFullName] = useState("");

  const handleAuthenticationGoogle = async function (googleResponse, props) {
    const { tokenId } = googleResponse;
    try {
      const response = await signInWithGoogle(tokenId);
      const { data } = response;
      if (data.signInUserGoogle.authToken) {
        props.setCurrentUser(data.signInUserGoogle);
        localStorage.setItem('token', data.signInUserGoogle.authToken);
        props.history.push('/app/buildings');
      }
    } catch {
      setError('error when login')
      setTimeout(() => setIsLoading(false), 500)
    }
  }

  const submitSignUp =  async () => {
    // should add check 
    const signInPayload = {
      email,
      password,
      fullName
    }
    const response = await signUp(signInPayload);
    const { data } = response;
    if (data.createUser.authToken) {
      localStorage.setItem('token', data.createUser.authToken);
      localStorage.removeItem('role')
      props.history.push('/app/buildings');
    }
  }
  
  const submitSignIn = async () => {
    const signInPayload = {
      email, 
      password
    };
    try {
      const response = await signIn(signInPayload);
      const { data } = response;
      if (data.signInUser.authToken) {
        props.setCurrentUser(data.signInUser);
        localStorage.removeItem('role')
        localStorage.setItem('token', data.signInUser.authToken);
        props.history.push('/app/buildings');
      }
    } catch {
      setError('error when login')
      setTimeout(() => setIsLoading(false), 500)
    }
  }
  
  return (
    <Grid container className={classes.container}>
      <div onClick={() => props.history.push('/')} className={classes.logotypeContainer}>
        <img src={robotLogo} alt="logo" className={classes.logotypeImage} />
      </div>
      <div className={classes.formContainer}>
        <div className={classes.form}>
          <Tabs
            value={activeTabId}
            onChange={(e, id) => setActiveTabId(id)}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label="Login" classes={{ root: classes.tab }} />
            <Tab label="New User" classes={{ root: classes.tab }} />
          </Tabs>
          {activeTabId === 0 && (
            <React.Fragment>
              <Typography variant="h1" className={classes.greeting}>
                Good Morning, User
              </Typography>
              <Button
                    size="large"  className={classes.googleButton}
                    onClick={() => {
                        localStorage.setItem('role', 'guest')
                        props.history.push('/app/buildings')
                    }}
                >
                    View buildings as guest
              </Button>
              <GoogleLogin
                  render={renderProps => (
                    <Button size="large" onClick={renderProps.onClick} className={classes.googleButton}>
                      <img src={google} alt="google" className={classes.googleIcon} />
                      &nbsp;Sign in with Google
                    </Button>
                  )}
                  className={classes.googleBtn}
                  clientId="556183193710-ojbsg0ks227at5ecqempbboukfl15271.apps.googleusercontent.com"
                  buttonText="Sign in with Google"
                  onSuccess={e => handleAuthenticationGoogle(e, props)}
                  onFailure={(e) => console.log('login failed',e)}
                  cookiePolicy={'single_host_origin'}
              />
              <div className={classes.formDividerContainer}>
                <div className={classes.formDivider} />
                <Typography className={classes.formDividerWord}>or</Typography>
                <div className={classes.formDivider} />
              </div>
              <Fade in={error}>
                <Typography color="secondary" className={classes.errorMessage}>
                  Something is wrong with your login or password :(
                </Typography>
              </Fade>
              <TextField
                id="email"
                InputProps={{
                  classes: {
                    underline: classes.textFieldUnderline,
                    input: classes.textField,
                  },
                }}
                value={email}
                onChange={e => setEmail(e.target.value)}
                margin="normal"
                placeholder="Email Adress"
                type="email"
                fullWidth
              />
              <TextField
                id="password"
                InputProps={{
                  classes: {
                    underline: classes.textFieldUnderline,
                    input: classes.textField,
                  },
                }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                margin="normal"
                placeholder="Password"
                type="password"
                fullWidth
              />
              <div className={classes.formButtons}>
                {isLoading ? (
                  <CircularProgress size={26} className={classes.loginLoader} />
                ) : (
                  <Button
                    disabled={
                      email.length === 0 || password.length === 0
                    }
                    onClick={() =>
                      { 
                        setIsLoading(true)
                        submitSignIn()
                      }
                    }
                    variant="contained"
                    color="primary"
                    size="large"
                  >
                    Login
                  </Button>
                )}
                <Button
                  color="primary"
                  size="large"
                  className={classes.forgetButton}
                >
                  Forget Password
                </Button>
              </div>
            </React.Fragment>
          )}
          {activeTabId === 1 && (
            <React.Fragment>
              <Typography variant="h1" className={classes.greeting}>
                Welcome!
              </Typography>
              <Typography variant="h2" className={classes.subGreeting}>
                Create your account
              </Typography>
              <Fade in={error}>
                <Typography color="secondary" className={classes.errorMessage}>
                  Something is wrong with your login or password :(
                </Typography>
              </Fade>
              <TextField
                id="name"
                InputProps={{
                  classes: {
                    underline: classes.textFieldUnderline,
                    input: classes.textField,
                  },
                }}
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                margin="normal"
                placeholder="Full Name"
                type="email"
                fullWidth
              />
              <TextField
                id="email"
                InputProps={{
                  classes: {
                    underline: classes.textFieldUnderline,
                    input: classes.textField,
                  },
                }}
                value={email}
                onChange={e => setEmail(e.target.value)}
                margin="normal"
                placeholder="Email Adress"
                type="email"
                fullWidth
              />
              <TextField
                id="password"
                InputProps={{
                  classes: {
                    underline: classes.textFieldUnderline,
                    input: classes.textField,
                  },
                }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                margin="normal"
                placeholder="Password"
                type="password"
                fullWidth
              />
              <div className={classes.creatingButtonContainer}>
                {isLoading ? (
                  <CircularProgress size={26} />
                ) : (
                  <Button
                    onClick={() =>
                      submitSignUp()
                    }
                    disabled={
                      email.length === 0 ||
                      password.length === 0
                    }
                    size="large"
                    variant="contained"
                    color="primary"
                    fullWidth
                    className={classes.createAccountButton}
                  >
                    Create your account
                  </Button>
                )}
              </div>
              <div className={classes.formDividerContainer}>
                <div className={classes.formDivider} />
                <Typography className={classes.formDividerWord}>or</Typography>
                <div className={classes.formDivider} />
              </div>
              <Button
                    size="large"  className={classes.googleButton}
                    onClick={() => {
                        localStorage.setItem('role', 'guest')
                        props.history.push('/app/buildings')
                    }}
                >
                    View buildings as guest
              </Button>
              <GoogleLogin
                render={renderProps => (
                  <Button size="large" onClick={renderProps.onClick} className={classes.googleButton}>
                    <img src={google} alt="google" className={classes.googleIcon} />
                    &nbsp;Sign in with Google
                  </Button>
                )}
                className={classes.googleBtn}
                clientId="556183193710-ojbsg0ks227at5ecqempbboukfl15271.apps.googleusercontent.com"
                buttonText="Sign in with Google"
                onSuccess={e => handleAuthenticationGoogle(e, props)}
                onFailure={(e) => setError("error when login")}
                cookiePolicy={'single_host_origin'}
            />
            </React.Fragment>
          )}
        </div>
        <Typography color="primary" className={classes.copyright}>
          © 2014-2019 LUMIN ROBOTIC, LLC. All rights reserved.
        </Typography>
      </div>
    </Grid>
  );
}


const mapDispatchToProps = (dispatch) => ({
  setCurrentUser : (payload) => dispatch(setCurrentUser(payload))
})

export default connect(null, mapDispatchToProps)(withRouter(Login));