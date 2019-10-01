import clsx from 'clsx';
import React from 'react';
import PropTypes from 'prop-types';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import InputBase from '@material-ui/core/InputBase';
import Badge from '@material-ui/core/Badge';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import { withRouter } from 'react-router-dom';
import { fade } from '@material-ui/core/styles/colorManipulator';
import { createStyles, Theme, withStyles, WithStyles } from '@material-ui/core/styles';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import AccountCircle from '@material-ui/icons/AccountCircle';
import DeleteIcon from '@material-ui/icons/Delete';
import InfoIcon from '@material-ui/icons/Info';
import NotificationsIcon from '@material-ui/icons/Notifications';
import MoreIcon from '@material-ui/icons/MoreVert';
import apollo from '../../apollo';
import { loader } from 'graphql.macro';

// const MESH_QUERY = loader('../../graphql/getMesh.gql');
const GET_MESH_BUILDING_QUERY = loader('../../graphql/getMeshesBuilding.gql');
const DELETE_QUERY = loader('../../graphql/deleteMesh.gql');

const styles = (theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      zIndex: theme.zIndex.drawer + 1,
    },
    grow: {
      flexGrow: 1,
    },
    hide: {
      display: 'none',
    },
    menuButton: {
      marginLeft: -12,
      marginRight: 20,
    },
    title: {
      display: 'none',
      [theme.breakpoints.up('sm')]: {
        display: 'block',
      },
    },
    search: {
      position: 'relative',
      borderRadius: theme.shape.borderRadius,
      backgroundColor: fade(theme.palette.common.white, 0.15),
      '&:hover': {
        backgroundColor: fade(theme.palette.common.white, 0.25),
      },
      marginRight: theme.spacing(2),
      marginLeft: 0,
      width: '100%',
      [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(3),
        width: 'auto',
      },
    },
    searchIcon: {
      width: theme.spacing(9),
      height: '100%',
      position: 'absolute',
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputRoot: {
      color: 'inherit',
      width: '100%',
    },
    inputInput: {
      paddingTop: theme.spacing(),
      paddingRight: theme.spacing(),
      paddingBottom: theme.spacing(),
      paddingLeft: theme.spacing(10),
      transition: theme.transitions.create('width'),
      width: '100%',
      [theme.breakpoints.up('md')]: {
        width: 200,
      },
    },
    sectionDesktop: {
      display: 'none',
      [theme.breakpoints.up('md')]: {
        display: 'flex',
      },
    },
    sectionMobile: {
      display: 'flex',
      [theme.breakpoints.up('md')]: {
        display: 'none',
      },
    },
  });


export interface Props extends WithStyles<typeof styles> {
  className: string
  position: "fixed" | "absolute" | "relative" | "static" | "sticky" | undefined
  onSelectedObject: Function,
  onNavMenuClick: Function,
  leftOpen: boolean,
  rightOpen: boolean,
  match: any,
  history: any
}


interface State {
  meshes: any[];
  loading: boolean;
  anchorEl: null | HTMLElement;
  mobileMoreAnchorEl: null | HTMLElement;
}

class PrimaryAppBar extends React.Component<Props, State> {
  querySubscription: any
  state: State = {
    meshes: [],
    loading: true,
    anchorEl: null,
    mobileMoreAnchorEl: null,
  };

  componentDidMount(){
    this.querySubscription = apollo.watchQuery<any>({
      query: GET_MESH_BUILDING_QUERY,
      variables : { buildingId: this.props.match.params.buildingId }
    }).subscribe(({ data, loading }) => {
      this.setState({
        meshes: data.meshesOfBuilding || [],
        loading: loading,
      });
    });
  }

  componentWillUnmount() {
    this.querySubscription.unsubscribe();
  }

  handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleMenuClose = () => {
    this.setState({ anchorEl: null });
    this.handleMobileMenuClose();
  };

  handleMenuClick = (objectId: string, event) => {
    if(event.target === event.currentTarget) {
      this.props.onSelectedObject(objectId);
      this.handleMenuClose();
   }
  };

  handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    this.setState({ mobileMoreAnchorEl: event.currentTarget });
  };

  handleMobileMenuClose = () => {
    this.setState({ mobileMoreAnchorEl: null });
  };

  handleMobileMenuClick = (objectId: string) => {
    this.props.onSelectedObject(objectId);
    this.handleMobileMenuClose();
  };

  handleNavMenuClick = () => {
    if (this.props.onNavMenuClick){
      this.props.onNavMenuClick();
    }
  }

  handleDelete = async (objectId: string) => {
    try {
      let vars = {id: objectId};
      await apollo.mutate({mutation: DELETE_QUERY, variables:vars});
    } catch(e) {
      console.log("Failed to delete object",e);
    } finally {
      this.handleMenuClose();
    }
  }

  render() {
    const { anchorEl, mobileMoreAnchorEl } = this.state;
    const { classes } = this.props;
    const isMenuOpen = Boolean(anchorEl);
    const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

    const renderMenu = (
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={isMenuOpen}
        onClose={this.handleMenuClose}
      >
        <MenuItem onClick={this.handleMenuClose}>Geometry</MenuItem>
        { this.state.meshes.map((mesh,i) => {
            return (
              <MenuItem key={i} onClick={(e)=>this.handleMenuClick(mesh.id, e) }>
                <p>{mesh.name}</p>
                <IconButton color="inherit" onClick={()=>this.handleDelete(mesh.id) }>
                  <DeleteIcon />
                </IconButton>
              </MenuItem>
            )
          })
        }
      </Menu>
    );

    const renderMobileMenu = (
      <Menu
        anchorEl={mobileMoreAnchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={isMobileMenuOpen}
        onClose={this.handleMenuClose}
      >
        { this.state.meshes.map((mesh,i) => {
            return (
              <MenuItem key={i} onClick={(e)=>this.handleMenuClick(mesh.id, e) }>
                <IconButton color="inherit">
                  <Badge badgeContent={4} color="secondary">
                    <InfoIcon />
                  </Badge>
                </IconButton>
                <p>{mesh.name}</p>
              </MenuItem>
            )
          })
        }
        <MenuItem onClick={this.handleMobileMenuClose}>
          <IconButton color="inherit">
            <Badge badgeContent={4} color="secondary">
              <InfoIcon />
            </Badge>
          </IconButton>
          <p>Model Objects</p>
        </MenuItem>
        <MenuItem onClick={this.handleMobileMenuClose}>
          <IconButton color="inherit">
            <Badge badgeContent={11} color="secondary">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <p>Notifications</p>
        </MenuItem>
        <MenuItem onClick={this.handleProfileMenuOpen}>
          <IconButton color="inherit">
            <AccountCircle />
          </IconButton>
          <p>Profile</p>
        </MenuItem>
      </Menu>
    );

    return (
      <div className={classes.root}>
        <AppBar position={this.props.position} className={this.props.className}>
          <Toolbar>
            <IconButton 
              onClick={this.handleNavMenuClick} 
              color="inherit" 
              aria-label="Open drawer"
              className={clsx(classes.menuButton, {
                [classes.hide]: this.props.leftOpen,
              })}
            >
              <MenuIcon />
            </IconButton>
            <Typography onClick={() => this.props.history.push('/buildings')} className={classes.title} variant="h6" color="inherit" noWrap>
              Building Geometry Server
            </Typography>
            <div className={classes.search}>
              <div className={classes.searchIcon}>
                <SearchIcon />
              </div>
              <InputBase
                placeholder="Search…"
                classes={{
                  root: classes.inputRoot,
                  input: classes.inputInput,
                }}
              />
            </div>
            <div className={classes.grow} />
            <div className={classes.sectionDesktop}>
              <IconButton
                aria-owns={isMenuOpen ? 'material-appbar' : undefined}
                aria-haspopup="true"
                onClick={this.handleProfileMenuOpen}
                color="inherit"
              >
                <Badge badgeContent={this.state.meshes.length} color="secondary">
                  <InfoIcon />
                </Badge>
              </IconButton>
              <IconButton>
                <AccountCircle />
              </IconButton>
            </div>
            <div className={classes.sectionMobile}>
              <IconButton aria-haspopup="true" onClick={this.handleMobileMenuOpen} color="inherit">
                <MoreIcon />
              </IconButton>
            </div>
          </Toolbar>
        </AppBar>
        {renderMenu}
        {renderMobileMenu}
      </div>
    );
  }
}

(PrimaryAppBar as React.ComponentClass<Props>).propTypes = {
  onNavMenuClick: PropTypes.func,
  onSelectedObject: PropTypes.func.isRequired,
  className: PropTypes.string.isRequired,
  position: PropTypes.string.isRequired,
  leftOpen: PropTypes.bool,
  rightOpen: PropTypes.bool,
  history: PropTypes.func.isRequired,
} as any;
//@ts-ignore
export default withStyles(styles)(withRouter(PrimaryAppBar));