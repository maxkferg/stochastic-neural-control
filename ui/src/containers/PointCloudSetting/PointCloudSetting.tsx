import React from 'react';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
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
    inputLabel: any
}> {
    classes: any
    constructor(props) {
        super(props);
        this.classes = props.classes;
        this.state = {
            inputLabel: React.createRef()
        }
    }
    render() {
        const { inputLabel } = this.state; 
        return <form className={this.classes.container} noValidate autoComplete="off">
        <Typography className={this.classes.formTitle} variant="h5" gutterBottom >Setting config pointCloud</Typography>
        <FormControlLabel
          value="modelGeometry"
          control={<Checkbox onChange={() => console.log('kakak')} color="primary" />}
          label="Show Model Geometry"
          labelPlacement="start"
        />
        <FormControl variant="outlined" className={this.classes.formControl}>
            <InputLabel ref={inputLabel} shtmlFor="outlined-age-native-simple">
            Age
            </InputLabel>
            <Select
            native
            value={'kaka'}
            inputProps={{
                name: 'age',
                id: 'outlined-age-native-simple',
            }}
            >
            <option value="" />
            <option value={10}>Ten</option>
            <option value={20}>Twenty</option>
            <option value={30}>Thirty</option>
            </Select>
        </FormControl>
        <TextField
          id="outlined-scale"
          name="scale"
          type="number"
          label="Points Limit"
          className={this.classes.textField}
          margin="normal"
          variant="outlined"
        />
        <Button size="large" variant="contained" color="primary" className={this.classes.button}>
          Change
        </Button>
      </form> 
    }
}

export default withStyles(styles)(withRouter(PointCloudSetting));