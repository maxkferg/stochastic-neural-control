import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import classnames from "classnames";
import useStyles from "./styles";
import { useLayoutState } from "../context/LayoutContext";
import { Route, Redirect } from 'react-router-dom';
import { getBuildings, getGuestBuildings } from '../services/BuildingServices';

function AuthenticationRoute({ component: Component, ...rest }) {
  const classes = useStyles();
  const layoutState = useLayoutState();
  const [buildings, setBuildings] = useState([]);
  const [isFetchBuildings, setIsFetchBuildings] = useState(false)
  const isGuest = localStorage.getItem('role') === 'guest'
  const { currentUser } = rest

  useEffect(() => {
    async function fetchBuildings() {
      if (currentUser.id || isGuest) {
        const responseApollo = isGuest ? await getGuestBuildings() : await getBuildings({ ownerId: currentUser.id });
        const { data } = responseApollo;
        const buildings = isGuest ? data.guestBuildings : data.building
        if (buildings.length) {
          setBuildings(buildings)
        }
      }
    }
    fetchBuildings()
  }, [currentUser.id, isFetchBuildings])

  return (
    <Route {...rest} render={props => {
      const paddingContent = props.history.location.pathname.includes('buildings');
      if (localStorage.getItem('token') || localStorage.getItem('role') === 'guest') {
        return <div className={classes.root}>
          {
            //@ts-ignored
            <Header history={props.history} buildings={buildings} />
          }
          <Sidebar />
          <div
            className={classnames(classes.content, {
              [classes.paddingContent]: paddingContent,
              [classes.contentShift]: layoutState.isSidebarOpened,
            })}
          >

            <div className={classes.fakeToolbar} >
              <Component
                buildings={buildings}
                setIsFetchBuildings={setIsFetchBuildings}
                isFetchBuildings={isFetchBuildings}
                {...props}
                {...rest}
              />
            </div>
          </div>
        </div>
      }
      return <Redirect to='/auth' />
    }
    }
    />
  )
}

const mapStateToProps = state => ({
  currentUser: state.currentUser
})


export default connect(mapStateToProps)(AuthenticationRoute);