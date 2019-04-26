import React from 'react';
import PropTypes from 'prop-types';
import { withStyles, WithStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Drawer from '@material-ui/core/Drawer';
import Divider from '@material-ui/core/Divider';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import classNames from 'classnames';


const drawerWidth = 340;

const styles = (theme: any) => ({
  root: {
    display: 'flex',
  },
  formTitle: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    marginTop: "20px",
    marginBottom: "20px",
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


let geometry = {
  "walls": {
    id: "walls-",
    name: "walls-",
    filename: "walls.obj",
    directory: "./geometry/env/labv2/",
  },
  "floors": {
    id: "walls-",
    name: "walls-",
    filename: "walls.obj",
    directory: "./geometry/env/labv2/",
  },
  "robot": {
    id: "robot-",
    name: "robot-",
    filename: "robot.obj",
    directory: "./geometry/robots/turtlebot2/",
  },
  "baseball": {
    id: "baseball-",
    name: "baseball-",
    filename: "baseball.obj",
    directory: "./geometry/objects/baseball/",
  },
  "box": {
    id: "box-",
    name: "box-",
    filename: "box.obj",
    directory: "./geometry/objects/box/",
  },
  "bucket": {
    id: "bucket-",
    name: "bucket-",
    filename: "bucket.obj",
    directory: "./geometry/objects/bucket/",
  },
  "cycle": {
    id: "cycle-",
    name: "cycle-",
    filename: "cycle.obj",
    directory: "./geometry/objects/cycle/",
  },
  "chair": {
    id: "chair-",
    name: "chair-",
    filename: "chair.obj",
    directory: "./geometry/objects/chair/",
  },
  "gas can": {
    id: "gas-can-",
    name: "gas-can-",
    filename: "gas-can.obj",
    directory: "./geometry/objects/gas-can/",
  },
  "gloves": {
    id: "gloves-",
    name: "gloves-",
    filename: "gloves.obj",
    directory: "./geometry/objects/gloves/",
  },
  "hard hat": {
    id: "hard-hat-",
    name: "hard-hat-",
    filename: "hard-hat.obj",
    directory: "./geometry/objects/hard-hat/",
  },
  "recycle bin": {
    id: "recycle-bin-",
    name: "recycle-bin-",
    filename: "recycle bin.obj",
    directory: "./geometry/objects/recycle-bin/",
  }
}

export interface Props extends WithStyles<typeof styles> {
  open: boolean
}

interface State {
  id: string
  name: string
  object: string
  filename: string
  directory: string
  labelWidth: number
  currentStep: number
  x: number
  y: number
  z: number
  theta: number
  physicsCollision: boolean
  physicsStationary: boolean
  open: boolean
}

class GeometryDrawer extends React.Component<Props, State> {
  classes: any
  state: State = {
    id: "",
    name: "",
    object: "",
    filename: "",
    directory: "",
    currentStep: 0,
    labelWidth: 100,
    x: 0,
    y: 0,
    z: 0,
    theta: 0,
    physicsCollision: true,
    physicsStationary: true,
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

  handleChange = (event: any) => {
    //@ts-ignore
    this.setState({ [event.target.name]: event.target.value });
  };

  handlePrev = (event: any) => {
    if (this.state.currentStep===0){
      this.setState({open: false});
    } else {
      this.setState({currentStep: this.state.currentStep-1});
    }
  }

  handleNext = (event: any) => {
    this.setState({currentStep: this.state.currentStep+1});
  }

  handleSubmit = (event: any) => {
    console.log("DONE")
  }

  componentDidUpdate(prevProps: any, prevState: any){
    if (this.state.object !== prevState.object){
      let rand = Math.floor(Math.random() * 999);
      let description = geometry[this.state.object]
      this.setState({
        id: description.id + rand,
        name: description.name + rand,
        filename: description.filename,
        directory: description.directory,
      });
    }
    if (this.props.open!==prevProps.open){
      this.setState({open: this.props.open})
    }
  }

  getMeshOptions(){
    return Object.keys(geometry).map((key)=>{
      return <MenuItem key={ key } value={ key }>{ key }</MenuItem>
    });
  }


  renderObjectForm(){
    return (
      <form className={this.classes.container} noValidate autoComplete="off">
        <Typography className={this.classes.formTitle} variant="h5" gutterBottom >Create Object</Typography>
        <TextField
          select
          name="object"
          className={classNames(this.classes.textField)}
          variant="outlined"
          label="Object"
          value={this.state.object}
          onChange={this.handleChange}
        > { this.getMeshOptions() }
        </TextField>
        <TextField
          id="outlined-id"
          name="id"
          label="ID"
          className={this.classes.textField}
          value={this.state.id}
          onChange={this.handleChange}
          margin="normal"
          variant="outlined"
        />
        <TextField
          id="outlined-name"
          name="name"
          label="Name"
          className={this.classes.textField}
          value={this.state.name}
          onChange={this.handleChange}
          margin="normal"
          variant="outlined"
        />
        <TextField
          id="outlined-directory"
          name="directory"
          label="Directory"
          className={this.classes.textField}
          value={this.state.directory}
          onChange={this.handleChange}
          margin="normal"
          variant="outlined"
        />
        <TextField
          id="outlined-filename"
          name="filename"
          label="Filename"
          value={this.state.filename}
          className={this.classes.textField}
          margin="normal"
          variant="outlined"
        />
        <Button size="large" variant="outlined" onClick={this.handlePrev} className={this.classes.button}>
          Cancel
        </Button>
        <Button size="large" variant="contained" color="primary" onClick={this.handleNext} className={this.classes.button}>
          Next
        </Button>
      </form>
    )
  }

  renderPositionForm(){
    return (
      <form className={this.classes.container} noValidate autoComplete="off">
        <Typography className={this.classes.formTitle} variant="h5" gutterBottom >Create Object</Typography>
        <TextField
          id="outlined-x"
          name="x"
          className={this.classes.textField}
          variant="outlined"
          label="X"
          value={this.state.x}
          onChange={this.handleChange}
        > { this.getMeshOptions() }
        </TextField>
        <TextField
          id="outlined-y"
          name="y"
          label="Y"
          className={this.classes.textField}
          value={this.state.y}
          onChange={this.handleChange}
          margin="normal"
          variant="outlined"
        />
        <TextField
          id="outlined-z"
          name="z"
          label="Z"
          className={this.classes.textField}
          value={this.state.z}
          onChange={this.handleChange}
          margin="normal"
          variant="outlined"
        />
        <TextField
          id="outlined-directory"
          name="theta"
          label="rotation"
          className={this.classes.textField}
          value={this.state.theta}
          onChange={this.handleChange}
          margin="normal"
          variant="outlined"
        />
        <Button size="large" variant="outlined" onClick={this.handlePrev} className={this.classes.button}>
          Back
        </Button>
        <Button size="large" variant="contained" color="primary" onClick={this.handleNext} className={this.classes.button}>
          Next
        </Button>
      </form>
    )
  }


  renderPhysicsForm(){
    return (
      <form className={this.classes.container} noValidate autoComplete="off">
        <Typography className={this.classes.formTitle} variant="h5" gutterBottom >Create Object</Typography>
        <Typography className={this.classes.formTitle} variant="h6" gutterBottom >Physics</Typography>
        <TextField
          select
          name="physicsCollision"
          className={this.classes.textField}
          variant="outlined"
          label="Object"
          value={this.state.physicsCollision}
          onChange={this.handleChange}
        >
          <MenuItem value="true">True</MenuItem>
          <MenuItem value="false">False</MenuItem>
        </TextField>
        <TextField
          select
          name="physicsStationary"
          className={this.classes.textField}
          variant="outlined"
          label="Object"
          value={this.state.physicsStationary}
          onChange={this.handleChange}
        >
          <MenuItem value="true">True</MenuItem>
          <MenuItem value="false">False</MenuItem>
        </TextField>
        <Button size="large" variant="outlined" onClick={this.handlePrev} className={this.classes.button}>
          Back
        </Button>
        <Button size="large" variant="contained" color="primary" onClick={this.handleSubmit} className={this.classes.button}>
          Create
        </Button>
      </form>
    )
  }

  renderForm = () => {
    if (this.state.currentStep==0){
      return this.renderObjectForm();
    } else if (this.state.currentStep==1){
      return this.renderPositionForm();
    } else if (this.state.currentStep==2){
      return this.renderPhysicsForm();
    } else {
      throw new Error("Unknown form step");
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
        { this.renderForm() }
      </Drawer>
    );
  }
}

//@ts-ignore
GeometryDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(GeometryDrawer);