import React from 'react';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import MenuItem from '@material-ui/core/MenuItem';
import { withStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router-dom';


const styles = (theme: any) => ({
    root: {
      display: 'flex',
      'flex-direction': 'center',
    },
    formTitle: {
      marginLeft: theme.spacing(2),
      marginRight: theme.spacing(2),
      marginTop: "20px",
      marginBottom: "20px",
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
    button: {
      margin: theme.spacing(),
      marginLeft: theme.spacing(2),
      marginRight: theme.spacing(2),
      marginTop: "20px",
      minWidth: "70px",
    },
    appBar: {
      zIndex: theme.zIndex.drawer + 1,
    },
    textField: {
      margin: theme.spacing(),
      marginLeft: theme.spacing(2),
      marginRight: theme.spacing(2),
      width: "300px",
    },
    formHelperText: {
      marginTop: "-8px",
      marginBottom: "8px",
      marginLeft: "16px",
      marginRight: "16px",
    },
    checkbox: {
      margin: theme.spacing(2),
    },
    toolbar: theme.mixins.toolbar,
    hide: {
      display: 'none',
    }
  });

class PointCloudSetting extends React.Component <{
    onSuccess: Function
    onCancel: Function
}, {
  pointSampling: String
  showModelGeometry: Boolean
  pointsLimit: Number
}> {
    classes: any
    constructor(props) {
        super(props);
        this.classes = props.classes;
        this.state = {
          pointSampling: 'random',
          showModelGeometry: true,
          pointsLimit: 0,
        }
    }

    handleChangePointSampling = (e) => {
      this.setState({ 
        pointSampling: e.target.value
      })
    }

    handleChangeShowModelGeo = (e) => {
      this.setState({ 
        showModelGeometry: e.target.value
      })
    }
    
    handleChangePointsLimit = (e) => {
      this.setState({
        pointsLimit: e.target.value
      })
    }

    render() {
      const { pointSampling, pointsLimit, showModelGeometry } = this.state;
        return <form className={this.classes.container} onSubmit={(e) => e.preventDefault()} noValidate autoComplete="off">
        <Typography className={this.classes.formTitle} variant="h5" gutterBottom >Setting config pointCloud</Typography>
        <FormControlLabel
          value="modelGeometry"
          control={<Checkbox onChange={this.handleChangeShowModelGeo} value={showModelGeometry} color="primary" />}
          label="Show Model Geometry"
          labelPlacement="start"
        />
        <TextField
          select
          name="object"
          className={this.classes.textField}
          variant="outlined"
          label="The point sampling strategy"
          value={pointSampling}
          onChange={this.handleChangePointSampling}
        > 
          <MenuItem value="random">Random</MenuItem>
          <MenuItem value="latest">Latest</MenuItem>
        </TextField>
        <TextField
          id="outlined-scale"
          name="scale"
          type="number"
          label="Points Limit"
          className={this.classes.textField}
          margin="normal"
          variant="outlined"
          value={pointsLimit}
          onChange={this.handleChangePointsLimit}
        />
        <Button size="large" variant="contained" color="primary" className={this.classes.button}>
          Change Setting
        </Button>
      </form> 
    }
}

export default withStyles(styles)(withRouter(PointCloudSetting));