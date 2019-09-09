import clsx from 'clsx';
import React from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import PointCloudIcon from '@material-ui/icons/ImageAspectRatio';
import SlamIcon from '@material-ui/icons/Navigation';
import SettingsIcon from '@material-ui/icons/SettingsApplications';
import ModelIcon from '@material-ui/icons/LocationCity';
import MapIcon from '@material-ui/icons/Map';




const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: 36,
  },
  hide: {
    display: 'none',
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  drawerOpen: {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: theme.spacing(7) + 1,
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9) + 1,
    },
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
}));

// @ts-ignore
export default function NavDrawer(props) {
    const classes = useStyles();
    const theme = useTheme();
    const [open, setOpen] = React.useState(props.open);

    React.useEffect(() => {
        setOpen(props.open);
    }, [props.open])

    function handleDrawerClose(){
      props.onClose();
      setOpen(false);
    }

    function handleIconClick(key){
      const { history } = props;
      history.push('/' + key);
    }

    return (
      <Drawer
        variant="permanent"
        className={clsx(classes.drawer, {
          [classes.drawerOpen]: open,
          [classes.drawerClose]: !open,
        })}
        classes={{
          paper: clsx({
            [classes.drawerOpen]: open,
            [classes.drawerClose]: !open,
          }),
        }}
        open={open}
      >
        <div className={classes.toolbar}>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </div>
        <Divider />
        <List>
            <ListItem button onClick={() => handleIconClick("model")} key="Model">
              <ListItemIcon><ModelIcon /></ListItemIcon>
              <ListItemText primary={"Model"} />
            </ListItem>
            <ListItem button onClick={() => handleIconClick("building-map")} key="Building Map">
              <ListItemIcon><MapIcon /></ListItemIcon>
              <ListItemText primary={"Map"} />
            </ListItem>
            <ListItem button onClick={() => handleIconClick("slam")} key="SLAM">
              <ListItemIcon><SlamIcon /></ListItemIcon>
              <ListItemText primary={"SLAM"} />
            </ListItem>
            <ListItem button onClick={() => handleIconClick("pointcloud")} key="PointCloud">
              <ListItemIcon><PointCloudIcon /></ListItemIcon>
              <ListItemText primary="PointCloud" />
            </ListItem>
            <Divider />
            <ListItem button onClick={() => handleIconClick("settings")} key="Settings">
              <ListItemIcon><SettingsIcon /></ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
        </List>
      </Drawer>
    )
}