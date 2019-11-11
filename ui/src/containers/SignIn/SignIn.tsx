import React, { useState } from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import { signIn, signInWithGoogle } from '../../services/AuthServices';
import GoogleLogin from 'react-google-login';
import { setCurrentUser } from '../../redux/actions/currentUser';
import validateSignIn from './validateSignIn'
import { showError } from '../../redux/actions/showAlert'

const useStyles = makeStyles(theme => ({
  '@global': {
    body: {
      backgroundColor: theme.palette.common.white,
    },
  },
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  googleBtn: {
    width: '100%',
    marginBottom: theme.spacing(1),
    justifyContent: 'center'
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

const handleAuthenticationGoogle = async function (googleResponse, props) {
  const { tokenId } = googleResponse;
  const response = await signInWithGoogle(tokenId);
  const { data } = response;
  if (data.signInUserGoogle.authToken) {
    props.setCurrentUser(data.signInUserGoogle);
    localStorage.setItem('token', data.signInUserGoogle.authToken);
    props.history.push('/buildings');
  }
}

function SignIn(props) {
  const classes = useStyles();
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [validation, setValidation] = useState();

  const checkPayload = payload => {
    const signInPayload = {
      email: payload.email || email,
      password: payload.password || password,
    }
    if (!!validation) {
      const check = validateSignIn(signInPayload);
      setValidation(check);
      return check
    }
    return
  }

  const submitSignIn = async () => {
    const signInPayload = {
      email,
      password
    };

    const check = validateSignIn(signInPayload);
    setValidation(check);
    if (check.valid) {
      const response = await signIn(signInPayload);
      const isError = response instanceof Error;
      if (isError) {
        props.showError(response.message.replace('GraphQL error: Error: ', ''))
      } else {
        const { data } = response;
        if (data.signInUser.authToken) {
          props.setCurrentUser(data.signInUser);
          localStorage.setItem('token', data.signInUser.authToken);
          props.history.push('/buildings');
        }
      }
    }
  }
  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          onChange={e => {
            checkPayload({ email: e.target.value })
            setEmail(e.target.value)
          }}
          error={!!validation && !!validation.emailMessage}
          helperText={!!validation && validation.emailMessage}
        />
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          onChange={e => {
            checkPayload({ password: e.target.value })
            setPassword(e.target.value)
          }}
          error={!!validation && !!validation.passwordMessage}
          helperText={!!validation && validation.passwordMessage}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          className={classes.submit}
          onClick={submitSignIn}
        >
          Sign In
          </Button>
        <GoogleLogin
          className={classes.googleBtn}
          clientId="556183193710-ojbsg0ks227at5ecqempbboukfl15271.apps.googleusercontent.com"
          buttonText="Sign in with Google"
          onSuccess={e => handleAuthenticationGoogle(e, props)}
          onFailure={(e) => console.log('login failed', e)}
          cookiePolicy={'single_host_origin'}
        />
        <Grid container justify="flex-end">
          <Grid item>
            <Link to="/sign-up">
              <div>Don't have an account? Sign Up</div>
            </Link>
          </Grid>
        </Grid>
      </div>
    </Container>
  );
}


const mapDispatchToProps = (dispatch) => ({
  setCurrentUser: (payload) => dispatch(setCurrentUser(payload)),
  showError: message =>
    dispatch(showError(message))
})
export default connect(null, mapDispatchToProps)(SignIn);