import React from "react";
import { Button } from "@material-ui/core";
import {
  NotificationsNone as NotificationsIcon,
  ThumbUp as ThumbUpIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalOffer as TicketIcon,
  BusinessCenter as DeliveredIcon,
  SmsFailed as FeedbackIcon,
  DiscFull as DiscIcon,
  Email as MessageIcon,
  Report as ReportIcon,
  Error as DefenceIcon,
  AccountBox as CustomerIcon,
  Done as ShippedIcon,
  Publish as UploadIcon,
  Delete as DeleteIcon
} from "@material-ui/icons";
import { useTheme } from "@material-ui/styles";
import classnames from "classnames";
import tinycolor from "tinycolor2";

// styles
import useStyles from "./styles";

// components
import { Typography } from "../Wrappers";

const typesIcons = {
  "e-commerce": <ShoppingCartIcon />,
  notification: <NotificationsIcon />,
  offer: <TicketIcon />,
  info: <ThumbUpIcon />,
  message: <MessageIcon />,
  feedback: <FeedbackIcon />,
  customer: <CustomerIcon />,
  shipped: <ShippedIcon />,
  delivered: <DeliveredIcon />,
  defence: <DefenceIcon />,
  report: <ReportIcon />,
  upload: <UploadIcon />,
  disc: <DiscIcon />,
  delete: <DeleteIcon />
};

export default function Notification({ variant, ...props }) {
  var classes = useStyles();
  var theme = useTheme();

  const icon = getIconByType(props.type);
  const iconDelete = getIconByType('delete');

  const iconDeleteWithStyles = React.cloneElement(iconDelete, {
    classes: {
      root: classes.notificationIcon,
    },
    style: {
      color:
        variant !== "contained" &&
        theme.palette[props.color] &&
        theme.palette[props.color].main,
    },
  });

  const iconWithStyles = React.cloneElement(icon, {
    classes: {
      root: classes.notificationIcon,
    },
    style: {
      color:
        variant !== "contained" &&
        theme.palette[props.color] &&
        theme.palette[props.color].main,
    },
  });

  return (
    <div
      className={classnames(classes.notificationContainer, props.className, {
        [classes.notificationContained]: variant === "contained",
        [classes.notificationContainedShadowless]: props.shadowless,
      })}
      style={{
        backgroundColor:
          variant === "contained" &&
          theme.palette[props.color] &&
          theme.palette[props.color].main,
      }}
    >
      <div
        className={classnames(classes.notificationIconContainer, {
          [classes.notificationIconContainerContained]: variant === "contained",
          [classes.notificationIconContainerRounded]: variant === "rounded",
        })}
        style={{
          backgroundColor:
            variant === "rounded" &&
            theme.palette[props.color] &&
            tinycolor(theme.palette[props.color].main)
              .setAlpha(0.15)
              .toRgbString(),
        }}
      >
        {iconWithStyles}
      </div>
      <div className={classes.messageContainer}>
        <Typography
          className={classnames({
            [classes.containedTypography]: variant === "contained",
          })}
          variant={props.typographyVariant}
          size={variant !== "contained" && !props.typographyVariant && "md"}
        >
          {props.message}
        </Typography>
        
        {props.extraButtonClick && (
          <Button
            onClick={props.extraButtonClick}
            disableRipple
            className={classes.extraButton}
          >
            <div
              className={classnames(classes.notificationIconContainer, {
                [classes.notificationIconContainerContained]: variant === "contained",
                [classes.notificationIconContainerRounded]: variant === "rounded",
              })}
              style={{
                backgroundColor:
                  variant === "rounded" &&
                  theme.palette[props.color] &&
                  tinycolor(theme.palette[props.color].main)
                    .setAlpha(0.15)
                    .toRgbString(),
              }}
            >
              {iconDeleteWithStyles}
            </div>
          </Button>
        )}
      </div>
    </div>
  );
}

// ####################################################################
function getIconByType(type = "offer") {
  return typesIcons[type];
}
