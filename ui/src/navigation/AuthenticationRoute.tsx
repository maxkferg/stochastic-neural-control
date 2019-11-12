import React from 'react';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import classnames from "classnames";
import useStyles from "./styles";
import { LayoutProvider, useLayoutState } from "../context/LayoutContext";
import { Route, Redirect } from 'react-router-dom';

function AuthenticationRoute({component: Component, ...rest}) {
  const classes = useStyles();
  const layoutState = useLayoutState();
    return (
      <Route {...rest} render={props =>  {
        if (localStorage.getItem('token')) {
          return <div className={classes.root}>
                  <Header history={props.history} />
                  <Sidebar />
                  <div
                  className={classnames(classes.content, {
                    [classes.contentShift]: layoutState.isSidebarOpened,
                  })}
                  >
                 
               <div className={classes.fakeToolbar} >
                <Component {...props} {...rest} />  
              </div>
            </div>
          </div>
        }
        return <Redirect to='/auth'/>
      }
    }
    />
  ) 
}

export default AuthenticationRoute;