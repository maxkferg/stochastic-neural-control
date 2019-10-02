import React from 'react';
import { Route, Redirect } from 'react-router-dom';
function AuthenticationRoute({component: Component, ...rest}) {
    return (
      <Route {...rest} render={props =>  {
        if (localStorage.getItem('token')) {
          return <Component {...props} {...rest} />  
        }
        return <Redirect to='/sign-in'/>
      }
    }
    />
  ) 
}

export default AuthenticationRoute;