import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles, WithStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Divider from '@material-ui/core/Divider';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import IconButton from '@material-ui/core/IconButton';
import CreateGeometryForm from '../CreateGeometryForm/CreateGeometryForm';

const drawerWidth = 340;

const styles = (theme: any) => ({
  root: {
    display: 'flex',
  },
  button: {
    margin: theme.spacing.unit,
    marginTop: "20px",
    minWidth: "70px",
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
    paddingLeft: "10px",
    paddingRight: "10px",
  },
  textField: {
    margin: theme.spacing.unit,
    width: "300px",
  },
  toolbar: theme.mixins.toolbar,
  hide: {
    display: 'none',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.unit * 3,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: -drawerWidth,
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  },
});

export interface Props extends WithStyles<typeof styles> {
  objectId: null | string
  open: boolean
}

interface State {
  open: boolean
}

class GeometryDrawer extends React.Component<Props, State> {
  classes: any
  state: State = {
    open: false,
  };

  constructor(props: any){
    super(props);
    this.classes = props.classes;
  }

  handleDrawerOpen = () => {
    this.setState({ open: true });
  };

  handleDrawerClose = () => {
    this.setState({ open: false });
  };

  componentDidUpdate(prevProps: Props){
    if (prevProps.open !== this.props.open){
      this.setState({open: this.props.open});
    }
  }

  render(){
    let hide = this.state.open ? "" : this.classes.hide;
    return (
      <Drawer
        className={classNames(this.classes.drawer, hide)}
        anchor="right"
        variant="permanent"
        open={this.state.open}
        classes={{
          paper: this.classes.drawerPaper,
        }}
      >
      <div className={this.classes.drawerHeader}>
        <IconButton onClick={this.handleDrawerClose}>
          <ChevronRightIcon />
        </IconButton>
        </div>
        <Divider />
        <CreateGeometryForm objectId={this.props.objectId} onCancel={this.handleDrawerClose} onSuccess={this.handleDrawerClose} />
      </Drawer>
    );
  }
}

//@ts-ignore
GeometryDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  objectId: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(GeometryDrawer);