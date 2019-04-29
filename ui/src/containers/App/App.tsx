import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import IconButton from '@material-ui/core/IconButton';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import Divider from '@material-ui/core/Divider';
import AddIcon from '@material-ui/icons/Add';
import Fab from '@material-ui/core/Fab';
import AppBar from '../AppBar/AppBar';
import EditObjectForm from '../EditObjectForm/EditObjectForm';
import CreateGeometryForm from '../CreateGeometryForm/CreateGeometryForm';
import BuildingViewer from '../BuildingViewer/BuildingViewer';

const drawerWidth = 340;

const styles = theme => ({
  root: {
    display: 'flex',
  },
  appBar: {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: drawerWidth,
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 20,
  },
  hide: {
    display: 'none',
  },
  fab: {
    margin: theme.spacing.unit,
    position: 'absolute'  as 'absolute',
    bottom: 30 + "px",
    right: 30 + "px",
  } ,
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    ...theme.mixins.toolbar,
    justifyContent: 'flex-start',
  },
  content: {
    flexGrow: 1,
    padding: 0,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginRight: -drawerWidth,
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: 0,
  },
});


// @ts-ignore
class PersistentDrawerRight extends React.Component {
  state = {
    open: false,
    creatingGeometry: true,
    editingObject: false,
    selectedObjectId: "",
  };

  handleDrawerOpen = () => {
    this.setState({ open: true });
  };

  handleDrawerClose = () => {
    this.setState({ open: false });
  };

  createGeometry = () => {
    this.setState({
      open: true,
      editingObject: false,
      creatingGeometry: true
    });
  }

  onSelectedObject = (objectId: string) => {
    this.setState({
      open: true,
      editingObject: true,
      creatingGeometry: false,
      selectedObjectId: objectId,
    });
  }

  renderRightForm(){
    if (this.state.creatingGeometry){
      return <CreateGeometryForm onSuccess={this.handleDrawerClose} onCancel={this.handleDrawerClose} />
    } else if (this.state.editingObject){
      return <EditObjectForm objectId={this.state.selectedObjectId} onSuccess={this.handleDrawerClose} onCancel={this.handleDrawerClose} />
    } else {
      console.error("Should always be creating or editing an object");
      return <p>Edit or create an object</p>
    }
  }


  render() {
    // @ts-ignore
    const { classes, theme } = this.props;
    const { open } = this.state;

    return (
      <div className={classes.root}>
        <CssBaseline />
        <AppBar position="fixed" className={classNames(classes.appBar, {[classes.appBarShift]: open,})}>
          {/*<Toolbar disableGutters={!open}>
            <IconButton
              color="inherit"
              aria-label="Open drawer"
              onClick={this.handleDrawerOpen}
              className={classNames(classes.menuButton, open && classes.hide)}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" color="inherit" noWrap>
              Persistent drawer
            </Typography>
          </Toolbar>*/}
        </AppBar>
        <main
          className={classNames(classes.content, {
            [classes.contentShift]: open,
          })}
        >
          <div className={classes.drawerHeader} />
          <BuildingViewer onSelectedObject={this.onSelectedObject} />
          <Fab color="primary" aria-label="Add" className={classes.fab} onClick={this.createGeometry}>
            <AddIcon />
          </Fab>
        </main>
        <Drawer
          className={classes.drawer}
          variant="persistent"
          anchor="right"
          open={open}
          classes={{
            paper: classes.drawerPaper,
          }}
        >
          <div className={classes.drawerHeader}>
            <IconButton onClick={this.handleDrawerClose}>
              {theme.direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </div>
          <Divider />
          { this.renderRightForm() }
        </Drawer>
      </div>
    );
  }
}

// @ts-ignore
PersistentDrawerRight.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(PersistentDrawerRight);