import React, { useState, useEffect } from "react";
import { Drawer, IconButton, List } from "@material-ui/core";
import {
  ArrowBack as ArrowBackIcon,
  LocationCity as LocationCityIcon,
  Map as MapIcon,
  Navigation as SlamIcon,
  Domain as BuildingIcon,
  ImageAspectRatio as PointCloudIcon,
  SettingsApplications as SettingIcon
} from "@material-ui/icons";
import { useTheme } from "@material-ui/styles";
import { withRouter } from "react-router-dom";
import classNames from "classnames";

// styles
import useStyles from "./styles";

// components
import SidebarLink from "./components/SidebarLink/SidebarLink";

// context
import {
  useLayoutState,
  useLayoutDispatch,
  toggleSidebar,
} from "../../context/LayoutContext";

function genStructureSideBar(buildingId) {
  const structure = [
    {
      id: 0,
      label: "Model",
      link: `/app/building/${buildingId}/model`,
      icon: <LocationCityIcon />,
      disabled: !buildingId
    },
    { id: 1, label: "Map", link: `/app/building/${buildingId}/building-map`, icon: <MapIcon />, disabled: !buildingId },
    {
      id: 2,
      label: "Slam",
      link: `/app/building/${buildingId}/slam`,
      icon: <SlamIcon />,
      disabled: !buildingId
    },
    {
      id: 3,
      label: "Point Cloud",
      link: `/app/building/${buildingId}/point-cloud`,
      icon: <PointCloudIcon />,
      disabled: !buildingId
    },
    { id: 4, type: "divider" },
    { id: 5, label: "Settings", link: "/app/setting", icon: <SettingIcon /> },
  ];
  return structure
}

function Sidebar({ location, match }) {
  const classes = useStyles();
  const theme = useTheme();
  // global
  const { isSidebarOpened } = useLayoutState();
  const layoutDispatch = useLayoutDispatch();

  // local
  const [isPermanent, setPermanent] = useState(true);
  const [buildingId, setBuildingId] = useState();
  useEffect(function() {
    window.addEventListener("resize", handleWindowWidthChange);
    handleWindowWidthChange();
    return function cleanup() {
      window.removeEventListener("resize", handleWindowWidthChange);
    };
  });

  useEffect(function() {
    setBuildingId(match.params.buildingId)
  }, [match.params])
  return (
    <Drawer
      variant={isPermanent ? "permanent" : "temporary"}
      className={classNames(classes.drawer, {
        [classes.drawerOpen]: isSidebarOpened,
        [classes.drawerClose]: !isSidebarOpened,
      })}
      classes={{
        paper: classNames({
          [classes.drawerOpen]: isSidebarOpened,
          [classes.drawerClose]: !isSidebarOpened,
        }),
      }}
      open={isSidebarOpened}
    >
      <div className={classes.toolbar} />
      <div className={classes.mobileBackButton}>
        <IconButton onClick={() => toggleSidebar(layoutDispatch)}>
          <ArrowBackIcon
            classes={{
              root: classNames(classes.headerIcon, classes.headerIconCollapse),
            }}
          />
        </IconButton>
      </div>
      <List className={classes.sidebarList}>
        {genStructureSideBar(buildingId).map(link => (
          <SidebarLink
            key={link.id}
            location={location}
            isSidebarOpened={isSidebarOpened}
            {...link}
          />
        ))}
      </List>
    </Drawer>
  );

  // ##################################################################
  function handleWindowWidthChange() {
    var windowWidth = window.innerWidth;
    var breakpointWidth = theme.breakpoints.values.md;
    var isSmallScreen = windowWidth < breakpointWidth;

    if (isSmallScreen && isPermanent) {
      setPermanent(false);
    } else if (!isSmallScreen && !isPermanent) {
      setPermanent(true);
    }
  }
}

export default withRouter(Sidebar);
