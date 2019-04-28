import React from 'react';
import PropTypes from 'prop-types';
import { withStyles, WithStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Checkbox from '@material-ui/core/Checkbox';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import MenuItem from '@material-ui/core/MenuItem';
import classNames from 'classnames';
import apollo from '../../apollo';
import { gql } from 'apollo-boost';



const styles = (theme: any) => ({
  root: {
    display: 'flex',
  },
  formTitle: {
    marginLeft: 2*theme.spacing.unit,
    marginRight: 2*theme.spacing.unit,
    marginTop: "20px",
    marginBottom: "20px",
  },
  button: {
    margin: theme.spacing.unit,
    marginLeft: 2*theme.spacing.unit,
    marginRight: 2*theme.spacing.unit,
    marginTop: "20px",
    minWidth: "70px",
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  textField: {
    margin: theme.spacing.unit,
    marginLeft: 2*theme.spacing.unit,
    marginRight: 2*theme.spacing.unit,
    width: "300px",
  },
  checkbox: {
    margin: 2*theme.spacing.unit,
  },
  toolbar: theme.mixins.toolbar,
  hide: {
    display: 'none',
  }
});


let geometry = {
  "walls": {
    id: "walls-",
    name: "walls-",
    type: "wall",
    filetype: "obj",
    filename: "walls.obj",
    directory: "./geometry/env/labv2/",
    scale: 1.0,
  },
  "floors": {
    id: "floor-",
    name: "floor-",
    type: "floor",
    filetype: "obj",
    filename: "floors.obj",
    directory: "./geometry/env/labv2/",
    scale: 1.0,
  },
  "robot": {
    id: "robot-",
    name: "robot-",
    type: "robot",
    filetype: "obj",
    filename: "turtlebot.obj",
    directory: "./geometry/robots/turtlebot2/",
    scale: 0.001,
  },
  "baseball": {
    id: "baseball-",
    name: "baseball-",
    type: "object",
    filetype: "obj",
    filename: "baseball.obj",
    directory: "./geometry/objects/baseball/",
    scale: 0.001,
  },
  "box": {
    id: "box-",
    name: "box-",
    type: "object",
    filetype: "obj",
    filename: "box.obj",
    directory: "./geometry/objects/box/",
    scale: 0.001,
  },
  "bucket": {
    id: "bucket-",
    name: "bucket-",
    type: "object",
    filetype: "obj",
    filename: "bucket.obj",
    directory: "./geometry/objects/bucket/",
    scale: 0.001,
  },
  "cycle": {
    id: "cycle-",
    name: "cycle-",
    type: "object",
    filetype: "obj",
    filename: "cycle.obj",
    directory: "./geometry/objects/cycle/",
    scale: 0.001,
  },
  "chair": {
    id: "chair-",
    name: "chair-",
    type: "object",
    filetype: "obj",
    filename: "chair.obj",
    directory: "./geometry/objects/chair/",
    scale: 0.03,
  },
  "gas can": {
    id: "gas-can-",
    name: "gas-can-",
    type: "object",
    filetype: "obj",
    filename: "gas-can.obj",
    directory: "./geometry/objects/gas-can/",
    scale: 0.1,
  },
  "gloves": {
    id: "gloves-",
    name: "gloves-",
    type: "object",
    filetype: "obj",
    filename: "gloves.obj",
    directory: "./geometry/objects/gloves/",
    scale: 0.001,
  },
  "hard hat": {
    id: "hard-hat-",
    name: "hard-hat-",
    type: "object",
    filetype: "obj",
    filename: "hard-hat.obj",
    directory: "./geometry/objects/hard-hat/",
    scale: 0.001,
  },
  "recycle bin": {
    id: "recycle-bin-",
    name: "recycle-bin-",
    type: "object",
    filetype: "obj",
    filename: "recycle bin.obj",
    directory: "./geometry/objects/recycle-bin/",
    scale: 0.001,
  }
}

const CREATE_MESH_QUERY = gql`
  mutation CreateMesh(
    $name: String!
    $type: String!
    $x: Float!
    $y: Float!
    $z: Float!
    $theta: Float!
    $width: Float!
    $height: Float!
    $depth: Float!
    $scale: Float!
    $filetype: String!
    $filename: String!
    $directory: String!
    $physicsCollision: Boolean!
    $physicsStationary: Boolean!
  ) {
      createMesh(
        name: $name
        type: $type
        x: $x
        y: $y
        z: $z
        theta: $theta
        width: $width
        height: $height
        depth: $depth
        scale: $scale
        geometry: {
          filetype: $filetype
          filename: $filename
          directory: $directory
        }
        physics: {
          collision: $physicsCollision
          stationary: $physicsStationary
        }
      ) {
          id,
          name,
          type,
          width,
          height,
          depth,
          scale
          geometry {
            filetype
            filename
            directory
          }
          physics {
            collision
            stationary
          }
      }
  }
`;


export interface Props extends WithStyles<typeof styles> {
  objectId: null | string
  onSuccess: Function
  onCancel: Function
}

interface State {
  id: string
  name: string
  type: string
  object: string
  filetype: string
  filename: string
  directory: string
  labelWidth: number
  currentStep: number
  x: number
  y: number
  z: number
  theta: number
  scale: number
  width: number
  height: number
  depth: number
  physicsCollision: boolean
  physicsStationary: boolean
}

class CreateGeometryForm extends React.Component<Props, State> {
  classes: any
  state: State = {
    id: "",
    name: "",
    type: "",
    object: "",
    filetype: "",
    filename: "",
    directory: "",
    currentStep: 0,
    labelWidth: 100,
    x: 0,
    y: 0,
    z: 0,
    width: 0,
    height: 0,
    depth: 0,
    theta: 0,
    scale: 1,
    physicsCollision: false,
    physicsStationary: true,
  };

  constructor(props: any){
    super(props);
    this.state.id = this.props.objectId || "";
    this.classes = props.classes;
  }

  handlePrev = (event: any) => {
    if (this.state.currentStep===0){
      this.props.onCancel();
    } else {
      this.setState({currentStep: this.state.currentStep-1});
    }
  }

  handleNext = (event: any) => {
    this.setState({currentStep: this.state.currentStep+1});
  }

  handleSubmit = (event: any) => {
    let vars = {
      id: this.state.id,
      name: this.state.name,
      type: this.state.type,
      object: this.state.object,
      filetype: this.state.filetype,
      filename: this.state.filename,
      directory: this.state.directory,
      x: this.state.x,
      y: this.state.y,
      z: this.state.z,
      scale: this.state.scale,
      width: this.state.width,
      height: this.state.height,
      depth: this.state.depth,
      theta: this.state.theta,
      physicsCollision: this.state.physicsCollision,
      physicsStationary: this.state.physicsStationary,
    }
    apollo.mutate({mutation: CREATE_MESH_QUERY, variables:vars}).then((result) => {
      this.props.onSuccess();
      this.setState({currentStep: 0});
      console.log("Mutation succeeded");
    }).catch(() => {
      console.log("Mutation failed")
    })

  }

  handleChange = (event: any) => {
    if (typeof(event.checked) !== "undefined"){
      //@ts-ignore
      this.setState({ [event.target.value]: event.target.checked });
    } else if (event.target.type && event.target.type=="number"){
      let value = parseFloat(event.target.value);
      //@ts-ignore
      this.setState({ [event.target.name]: value });
    } else {
      //@ts-ignore
      this.setState({ [event.target.name]: event.target.value });
    }
  };

  componentDidUpdate(prevProps: any, prevState: any){
    if (this.state.object !== prevState.object){
      let rand = Math.floor(Math.random() * 999);
      let description = geometry[this.state.object]
      this.setState({
        id: this.state.id || description.id + rand,
        name: description.name + rand,
        type: description.type,
        scale: description.scale,
        filename: description.filename,
        filetype: description.filetype,
        directory: description.directory,
      });
    }
    if (this.props.objectId !== null && this.props.objectId !== this.state.id){
      this.setState({id: this.props.objectId})
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
          select
          id="outlined-type"
          name="type"
          label="Object Type"
          className={this.classes.textField}
          value={this.state.type}
          onChange={this.handleChange}
          margin="normal"
          variant="outlined"
        >
          <MenuItem value="wall">Wall</MenuItem>
          <MenuItem value="floor">Floor</MenuItem>
          <MenuItem value="object">Object</MenuItem>
          <MenuItem value="robot">Robot</MenuItem>
        </TextField>
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
        <TextField
          id="outlined-filetype"
          name="filetype"
          label="File Type"
          value={this.state.filetype}
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
          type="number"
          value={this.state.x}
          onChange={this.handleChange}
        > { this.getMeshOptions() }
        </TextField>
        <TextField
          id="outlined-y"
          name="y"
          label="Y"
          type="number"
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
          type="number"
          className={this.classes.textField}
          value={this.state.z}
          onChange={this.handleChange}
          margin="normal"
          variant="outlined"
        />
        <TextField
          id="outlined-theta"
          name="theta"
          type="number"
          label="rotation"
          className={this.classes.textField}
          value={this.state.theta}
          onChange={this.handleChange}
          margin="normal"
          variant="outlined"
        />
        <TextField
          id="outlined-scale"
          name="scale"
          type="number"
          label="Object Scale"
          className={this.classes.textField}
          value={this.state.scale}
          onChange={this.handleChange}
          margin="normal"
          variant="outlined"
          inputProps={{
            labelWidth: 150
          }}
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
        <FormGroup row>
          <FormControlLabel
            control={
              <Checkbox
                color="primary"
                className={this.classes.checkbox}
                checked={this.state.physicsCollision}
                onChange={this.handleChange}
                value="physicsCollision"
              />
            }
            label="Enable Collision"
          />
        </FormGroup>
        <FormGroup row>
          <FormControlLabel
            control={
              <Checkbox
                color="primary"
                className={this.classes.checkbox}
                checked={this.state.physicsStationary}
                onChange={this.handleChange}
                value="physicsStationary"
              />
            }
            label="Fix Position"
          />
        </FormGroup>
        <Button size="large" variant="outlined" onClick={this.handlePrev} className={this.classes.button}>
          Back
        </Button>
        <Button size="large" variant="contained" color="primary" onClick={this.handleSubmit} className={this.classes.button}>
          Create
        </Button>
      </form>
    )
  }

  render(){
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
}

//@ts-ignore
CreateGeometryForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(CreateGeometryForm);