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

const MESH_QUERY = loader('../../graphql/getMesh.gql');
const DELETE_QUERY = loader('../../graphql/deleteMesh.gql');

const styles = (theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    grow: {
      flexGrow: 1,
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
      marginRight: theme.spacing.unit * 2,
      marginLeft: 0,
      width: '100%',
      [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing.unit * 3,
        width: 'auto',
      },
    },
    searchIcon: {
      width: theme.spacing.unit * 9,
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
      paddingTop: theme.spacing.unit,
      paddingRight: theme.spacing.unit,
      paddingBottom: theme.spacing.unit,
      paddingLeft: theme.spacing.unit * 10,
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
  //onSelectedObject: Function
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
      query: MESH_QUERY
    }).subscribe(({ data, loading }) => {
      this.setState({
        meshes: data.meshesCurrent || [],
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

  handleMenuClick = (objectId: string) => {
    //this.props.onSelectedObject(objectId);
    this.handleMenuClose();
  };

  handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    this.setState({ mobileMoreAnchorEl: event.currentTarget });
  };

  handleMobileMenuClose = () => {
    this.setState({ mobileMoreAnchorEl: null });
  };

  handleMobileMenuClick = (objectId: string) => {
    //this.props.onSelectedObject(objectId);
    this.handleMobileMenuClose();
  };

  handleDelete = async (objectId: string) => {
    try {
      let vars = {id: objectId};
      await apollo.mutate({mutation: DELETE_QUERY, variables:vars});
      this.handleMenuClose();
    } catch(e) {
      console.log("Failed to delete object",e);
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
              <MenuItem key={i} onClick={ ()=>this.handleMenuClick(mesh.id) }>
                <p>{mesh.name}</p>
                <IconButton color="inherit" onClick={ ()=>this.handleDelete(mesh.id) }>
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
              <MenuItem key={i} onClick={ ()=>this.handleMenuClick(mesh.id) }>
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
            <IconButton className={classes.menuButton} color="inherit" aria-label="Open drawer">
              <MenuIcon />
            </IconButton>
            <Typography className={classes.title} variant="h6" color="inherit" noWrap>
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
  //onSelectedObject: PropTypes.func.isRequired,
  className: PropTypes.string.isRequired,
  position: PropTypes.string.isRequired,
} as any;

export default withStyles(styles)(PrimaryAppBar);