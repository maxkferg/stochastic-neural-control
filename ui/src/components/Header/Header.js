import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
} from "@material-ui/core";
import {
  Menu as MenuIcon,
  NotificationsNone as NotificationsIcon,
  Person as AccountIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
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

// context
import {
  useLayoutState,
  useLayoutDispatch,
  toggleSidebar,
} from "../../context/LayoutContext";
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
  history.push('/')
}

function Header(props) {
  const classes = useStyles();
  let querySubscription;
  const { currentUser, history } = props;
  // global
  const layoutState = useLayoutState();
  const layoutDispatch = useLayoutDispatch();
 
  
  // local
  const [notificationsMenu, setNotificationsMenu] = useState(null);
  const [isNotificationsUnread, setIsNotificationsUnread] = useState(true);
  const [profileMenu, setProfileMenu] = useState(null);
  const [meshes, setMesh] = useState([]);

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
      querySubscription.unsubscribe()
    }
  }, [])
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
          onClick={() => toggleSidebar(layoutDispatch)}
          className={classNames(
            classes.headerMenuButton,
            classes.headerMenuButtonCollapse,
          )}
        >
          {layoutState.isSidebarOpened ? (
            <ArrowBackIcon
              classes={{
                root: classNames(
                  classes.headerIcon,
                  classes.headerIconCollapse,
                ),
              }}
            />
          ) : (
            <MenuIcon
              classes={{
                root: classNames(
                  classes.headerIcon,
                  classes.headerIconCollapse,
                ),
              }}
            />
          )}
        </IconButton>
        <Typography variant="h6" weight="medium" className={classes.logotype}>
          Lumin Robotics Admin
        </Typography>
        <div className={classes.grow} />
        <IconButton
          color="inherit"
          aria-haspopup="true"
          aria-controls="mail-menu"
          onClick={e => {
            setNotificationsMenu(e.currentTarget);
            setIsNotificationsUnread(false);
          }}
          className={classes.headerMenuButton}
        >
          <Badge
            badgeContent={isNotificationsUnread ? meshes.length : null}
            color="warning"
          >
            <NotificationsIcon classes={{ root: classes.headerIcon }} />
          </Badge>
        </IconButton>
        <IconButton
          aria-haspopup="true"
          color="inherit"
          className={classes.headerMenuButton}
          aria-controls="profile-menu"
          onClick={e => setProfileMenu(e.currentTarget)}
        >
          <AccountIcon classes={{ root: classes.headerIcon }} />
        </IconButton>

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
      </Toolbar>
    </AppBar>
  );
}


const mapStateToProps = state => ({
  currentUser: getCurrentUser(state)
})

export default connect(mapStateToProps)(withRouter(Header))