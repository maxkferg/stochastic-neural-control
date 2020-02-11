import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Button
} from "@material-ui/core";
import {
  Menu as MenuIcon,
  NotificationsNone as NotificationsIcon,
  Person as AccountIcon,
  Domain as BuildingIcon,
} from "@material-ui/icons";
import apollo from '../../apollo';
import { loader } from 'graphql.macro';
import classNames from "classnames";
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
// styles
import useStyles from "./styles";

// components
import { Badge, Typography } from "../Wrappers/Wrappers";
import Notification from "../Notification/Notification";

import { getCurrentUser } from '../../redux/selectors/currentUser'

const GET_MESH_BUILDING_QUERY = loader('../../graphql/getMeshesBuilding.gql');
const DELETE_QUERY = loader('../../graphql/deleteMesh.gql');

function genNotification(noti) {
  return {
    id: noti.id,
    color: 'success',
    type: 'notification',
    message: noti.name
  }
}

function onClickSignOut(history) {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  history.push('/')
}

function Header(props) {
  const classes = useStyles();
  let querySubscription;
  const { currentUser, history, buildings } = props;
  // global
  const isGuest = localStorage.getItem('role') === 'guest'
  // local
  const [notificationsMenu, setNotificationsMenu] = useState(null);
  const [profileMenu, setProfileMenu] = useState(null);
  const [meshes, setMesh] = useState([]);
  const [activeBuilding, setActiveBuilding] = useState('')
  const [buildingMenu, setBuildingMenu] = useState(null)
  const handleDelete = async objectId => {
    toast('Mesh is deleted')
    try {
      let vars = {id: objectId};
      await apollo.mutate({mutation: DELETE_QUERY, variables:vars});
    } catch(e) {
      console.log("Failed to delete object",e);
    }
  }

  useEffect(() => {
    return () => {
      if (querySubscription) {
        querySubscription.unsubscribe()
      }
    }
  }, [])

  useEffect(() => {

    setActiveBuilding(buildings[buildings.findIndex(el => el.id === props.match.params.buildingId )])
  }, [buildings.length])

  useEffect(() => {
    if (!props.match.params.buildingId) {
      return ;
    }
   
    querySubscription = apollo.watchQuery({
      query: GET_MESH_BUILDING_QUERY,
      variables : { buildingId: props.match.params.buildingId }
    }).subscribe(({ data, loading }) => {
      setMesh(data.meshesOfBuilding || [])
    });
  }, [props.match.params.buildingId]);

  return (
    <AppBar position="fixed" className={classes.appBar}>
      <ToastContainer />
      <Toolbar className={classes.toolbar}>
        <IconButton
          color="inherit"
          onClick={() => props.history.push('/app/buildings')}
          className={classNames(
            classes.headerMenuButton,
            classes.headerMenuButtonCollapse,
          )}
        >
        <MenuIcon
          classes={{
            root: classNames(
              classes.headerIcon,
              classes.headerIconCollapse,
            ),
          }}
        />
        </IconButton>
        <Typography variant="h6" weight="medium" className={classes.logotype}>
          Lumin Robotics Admin
        </Typography>
        <div className={classes.grow} />
        {
          !isGuest
        ? <Button
            color="inherit"
            aria-haspopup="true"
            aria-controls="building-menu"
            onClick={e => {
              setBuildingMenu(e.currentTarget);
            }}
            className={classes.headerMenuButton}
          >
            <Badge
              badgeContent={buildings.length}
              color="warning"
            >
              <BuildingIcon classes={{ root: classes.headerIcon }} />
            </Badge>
            <span className={classes.buildingName}>{activeBuilding && activeBuilding.name.substring(0, 10) + (activeBuilding.name.length > 10 ? '...' : '')}</span>
          </Button>
          : null
        }
        {
          !isGuest
            ? (<IconButton
                color="inherit"
                aria-haspopup="true"
                aria-controls="mail-menu"
                onClick={e => {
                  setNotificationsMenu(e.currentTarget);
                }}
                className={classes.headerMenuButton}
              >
                <Badge
                  badgeContent={meshes.length}
                  color="warning"
                >
                  <NotificationsIcon classes={{ root: classes.headerIcon }} />
                </Badge>
              </IconButton>)
            : null
        }
        {
          !isGuest
            ? <IconButton
                aria-haspopup="true"
                color="inherit"
                className={classes.headerMenuButton}
                aria-controls="profile-menu"
                onClick={e => setProfileMenu(e.currentTarget)}
              >
                <AccountIcon classes={{ root: classes.headerIcon }} />
              </IconButton>
            : null
        }
        {
          isGuest
            ? <Button
                onClick={() => {
                  localStorage.removeItem('role')
                  props.history.push('/auth')
                }}
                className={classes.link}
              >
                Login
              </Button>
            : null
        }
        { meshes.length ? <Menu
          id="notifications-menu"
          open={Boolean(notificationsMenu)}
          anchorEl={notificationsMenu}
          onClose={() => setNotificationsMenu(null)}
          className={classes.headerMenu}
          disableAutoFocusItem
        >
          {meshes.map(mesh => (
            <MenuItem
              key={mesh.id}
              onClick={() => setNotificationsMenu(null)}
              className={classes.headerMenuItem}
            >
              <Notification extraButtonClick={() => handleDelete(mesh.id)} {...genNotification(mesh)} typographyVariant="inherit" />
            </MenuItem>
          ))}
        </Menu> : null
        }
        <Menu
          id="profile-menu"
          open={Boolean(profileMenu)}
          anchorEl={profileMenu}
          onClose={() => setProfileMenu(null)}
          className={classes.headerMenu}
          classes={{ paper: classes.profileMenu }}
          disableAutoFocusItem
        >
          <div className={classes.profileMenuUser}>
            <Typography variant="h4" weight="medium">
             {currentUser.fullName ? currentUser.fullName : 'Anonymous'} 
            </Typography>
          </div>
          <div className={classes.profileMenuUser}>
            <Typography
              className={classes.profileMenuLink}
              color="primary"
              onClick={() => onClickSignOut(history)}
            >
              Sign Out
            </Typography>
          </div>
        </Menu>
        <Menu
          id="notifications-menu"
          open={Boolean(buildingMenu)}
          anchorEl={buildingMenu}
          onClose={() => setBuildingMenu(null)}
          className={classes.headerMenu}
          disableAutoFocusItem
        >
          {buildings.map((building, key) => (
            <MenuItem
              key={building.id}
              selected={props.match.params.buildingId === building.id}
              className={classes.headerMenuItem}
              onClick={() => {
                setActiveBuilding(buildings[key])
                history.push(`/app/building/${building.id}/model`)} } 
            >
             {building.name} 
            </MenuItem>
          ))}
        </Menu> 
      </Toolbar>
    </AppBar>
  );
}


const mapStateToProps = state => ({
  currentUser: getCurrentUser(state)
})

export default connect(mapStateToProps)(withRouter(Header))