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
import AppBar from '../AppBar/AppBar';
import EditObjectForm from '../EditObjectForm/EditObjectForm';
import CreateGeometryForm from '../CreateGeometryForm/CreateGeometryForm';
import NavDrawer from '../NavDrawer';
import AppNavigation from '../../navigation/AppNavigation';

const drawerWidth = 340;
const leftDrawWidth = 240;

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
  appBarShiftLeft: {
      marginLeft: leftDrawWidth,
      width: `calc(100% - ${leftDrawWidth}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 20,
  },
  hide: {
    display: 'none',
  },
  fab: {
    margin: theme.spacing(),
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
  contentError: {
    width: "1800px",
    marginTop: "50px",
    marginLeft: "50px",
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
    navMenuOpen: false,
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

  /**  
   * handleLeftDrawerClose
   * Call this function whenever the left draw is closed
   */
  handleLeftDrawerClose = () => {
    this.setState({ navMenuOpen: false });
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
      navMenuOpen: false,
      editingObject: true,
      creatingGeometry: false,
      selectedObjectId: objectId,
    });
  }

  /** 
   * handleNavMenuClick
   * Expand the navigation draw
   * Called when the MiniNav button is clicked in the AppBar
   */
  handleNavMenuClick = () => {
    this.setState({navMenuOpen: true})
  }

  renderRightForm(){
    if (this.state.creatingGeometry){
      return <CreateGeometryForm objectId={this.state.selectedObjectId} onSuccess={this.handleDrawerClose} onCancel={this.handleDrawerClose} />
    } else if (this.state.editingObject){
      return <EditObjectForm objectId={this.state.selectedObjectId} onSuccess={this.handleDrawerClose} onCancel={this.handleDrawerClose} />
    } else {
      console.error("Should always be creating or editing an object");
      return <p>Edit or create an object</p>
    }
  }

  render() {
    // @ts-ignore
    const { classes, theme, history } = this.props;
    const { open } = this.state;
    return (
      <div className={classes.root}>
        <CssBaseline />
        <AppBar 
          position="fixed"
          leftOpen={this.state.navMenuOpen}
          rightOpen={open}
          onSelectedObject={this.onSelectedObject} 
          onNavMenuClick={this.handleNavMenuClick}
          className={classNames(classes.appBar, {
              [classes.appBarShift]: open,
              [classes.appBarShiftLeft]: this.state.navMenuOpen,
            })
          }>
        </AppBar>
        <NavDrawer 
          history={history}
          open={this.state.navMenuOpen} 
          onClose={this.handleLeftDrawerClose} 
        />
        <main
          className={classNames(classes.content, {
            [classes.contentShift]: open,
          })}
        >
          <AppNavigation classes={classes} onSelectedObject={this.onSelectedObject} createGeometry={this.createGeometry}/>
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
  history: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(PersistentDrawerRight);