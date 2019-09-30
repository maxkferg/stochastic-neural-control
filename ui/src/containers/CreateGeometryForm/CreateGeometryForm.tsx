import React from 'react';
import PropTypes from 'prop-types';
import { withStyles, WithStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Checkbox from '@material-ui/core/Checkbox';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import MenuItem from '@material-ui/core/MenuItem';
import classNames from 'classnames';
// import apollo from '../../apollo';
import { createMeshOfBuilding } from '../../services/MeshServices';
// import { loader } from 'graphql.macro';
import GeometrySingleton from '../../services/GeometryFormServices';
// const CREATE_MESH_QUERY = loader('../../graphql/createMesh.gql');


const styles = (theme: any) => ({
  root: {
    display: 'flex',
  },
  formTitle: {
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    marginTop: "20px",
    marginBottom: "20px",
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
  physicsSimulated: boolean
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
    physicsSimulated: true,
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

  handleSubmit = async (event: any) => {
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
      physicsSimulated: this.state.physicsSimulated,
      buildingId: '5d90cdec1eaefc67ff854068'
    }
    const apolloResp = await createMeshOfBuilding(vars);
    console.log("TCL: CreateGeometryForm -> handleSubmit -> apolloResp", apolloResp)
    // apollo.mutate({mutation: CREATE_MESH_QUERY, variables:vars}).then((result) => {
    //   this.props.onSuccess();
    //   this.setState({currentStep: 0});
    //   console.log("Mutation succeeded");
    // }).catch((e) => {
    //   console.log("Mutation failed", e);
    // })
  }

  handleChange = (event: any) => {
    if (event.target.type === "checkbox"){
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
      let description = GeometrySingleton.getInstance()[this.state.object]
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
    return Object.keys(GeometrySingleton.getInstance()).map((key)=>{
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
          <FormHelperText className={this.classes.formHelperText} >
            If set to true, this item will be treated as solid and will
            can collide with other objects.
          </FormHelperText>
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
          <FormHelperText className={this.classes.formHelperText} >
            If set to true, this object will always remain in the same place.
            It will be assigned a mass of zero.
          </FormHelperText>
        <FormGroup row>
          <FormControlLabel
            control={
              <Checkbox
                color="primary"
                className={this.classes.checkbox}
                checked={this.state.physicsSimulated}
                onChange={this.handleChange}
                value="physicsSimulated"
              />
            }
            label="Simulate Physics"
          />
          <FormHelperText className={this.classes.formHelperText} >
            If set to true, this object will be added to the physics simulator.
            The position of this object will be governed by the simulation.
            Do not set this to true for real robots.</FormHelperText>
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