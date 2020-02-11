import React, { SyntheticEvent } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { green } from '@material-ui/core/colors'
import Snackbar from '@material-ui/core/Snackbar';
import ErrorIcon from '@material-ui/icons/Error';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import { closeAlert } from '../redux/actions/showAlert';

const variantIcon = {
  success: CheckCircleIcon,
  error: ErrorIcon,
};

const alertStyle = makeStyles((theme: Theme) => ({
  success: {
    backgroundColor: green[600],
  },
  error: {
    backgroundColor: theme.palette.error.dark,
  },
  icon: {
    fontSize: 20,
  },
  iconVariant: {
    opacity: 0.9,
    marginRight: theme.spacing(1),
  },
  message: {
    display: 'flex',
    alignItems: 'center',
  },
  margin: {
    margin: theme.spacing(1),
  },
}));

function Alert(props: any) {
  const { open, message, type, closeAlert } = props
  const classes = alertStyle();
  const Icon = variantIcon[type]

  const handleClose = (event?: SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    closeAlert();
  };

  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
    >
      <SnackbarContent
        className={clsx(classes[type], classes.margin)}
        message={
          <span id="client-snackbar" className={classes.message}>
            <Icon className={clsx(classes.icon, classes.iconVariant)} />
            {message}
          </span>
        }
        action={[
          <IconButton key="close" aria-label="close" color="inherit" onClick={handleClose}>
            <CloseIcon className={classes.icon} />
          </IconButton>,
        ]}
      />
    </Snackbar>
  )

}

Alert.propTypes = {
  open: PropTypes.bool,
  message: PropTypes.string,
  type: PropTypes.string,
  closeAlert: PropTypes.func,
}

const mapStateToProps = state => {
  const alertState = state.alert
  return ({
    ...alertState,
  })
}

const mapDispatchToProps = dispatch => ({
  closeAlert: () =>
    dispatch(closeAlert())
})

export default connect(mapStateToProps, mapDispatchToProps)(Alert)