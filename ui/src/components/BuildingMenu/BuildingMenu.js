import React from 'react';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import ListItemText from '@material-ui/core/ListItemText';
import { Link } from "react-router-dom";

const StyledMenu = withStyles(theme => ({
  paper: {
    border: '1px solid #d3d4d5',
    marginLeft: theme.spacing(1.5)
  },
}))(props => (
  <Menu
    elevation={0}
    getContentAnchorEl={null}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'center',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
));

const StyledMenuItem = withStyles(theme => ({
  root: {
    '&:focus': {
      backgroundColor: theme.palette.primary.main,
      '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
        color: theme.palette.common.white,
      },
    },
  },
}))(MenuItem);

const useStyle = makeStyles(theme => ({
  menuTitle: {
    textAlign: 'center'
  },
  linkStyle: {
    textDecoration: 'none'
  },
  selected: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white
  }
}))

export default function BuildingMenu(props) {
  const { buildingMenu, onClose, buildings, selectedBuilding } = props
  const classes = useStyle()
  const renderBuildingItems = building =>
    <Link className={classes.linkStyle} to={`/app/building/${building.id}/model`} key={building.id}>
      <StyledMenuItem className={selectedBuilding === building.id ? classes.selected : ''}>
        <ListItemText primary={building.name} />
      </StyledMenuItem>
    </Link>

  return (
    <div>
      <StyledMenu
        id="customized-menu"
        anchorEl={buildingMenu}
        keepMounted
        open={Boolean(buildingMenu)}
        onClose={onClose}
      >
        <div className={classes.menuTitle}>
          <Typography variant="h5" gutterBottom>
            List building
          </Typography>
        </div>
        {buildings.map(renderBuildingItems)}
      </StyledMenu>
    </div>
  );
}