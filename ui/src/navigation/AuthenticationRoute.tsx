import React from 'react';
import { Route, Redirect } from 'react-router-dom';

function AuthenticationRoute({component: Component, ...rest}) {
    return (
      <Route {...rest} render={props =>  localStorage.getItem('token') ? <Component {...props} {...rest} />  : 
      <Redirect to='/sign-in'/>
    }
    />
  ) 
}

export default AuthenticationRoute;