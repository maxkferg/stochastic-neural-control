import React from 'react';
import PropTypes from 'prop-types';
import { withStyles, WithStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { loader } from 'graphql.macro';
import apollo from '../../apollo';
import Divider from '@material-ui/core/Divider';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import RotateLeft from '@material-ui/icons/RotateLeft';
import RotateRight from '@material-ui/icons/RotateRight';
import Grid from '@material-ui/core/Grid';


const MESH_BY_ID_QUERY = loader('../../graphql/getMeshById.gql');
const MOVE_ROBOT = loader('../../graphql/moveRobot.gql');
const ROBOT_LINEAR_SPEED = 0.3;
const ROBOT_ANGULAR_SPEED = 0.6;

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
  controlDivider: {
    marginTop: "30px",
    marginBottom: "10px"
  },
  checkbox: {
    margin: 2*theme.spacing.unit,
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

interface Mesh {
  id: number
  x: number
  y: number
  z: number
  name: string
  theta: number
}

interface State {
  mesh: Mesh | null
  loading: boolean
}


class EditObjectForm extends React.Component<Props, State> {
  querySubscription: any
  classes: any
  state: State = {
    mesh: null,
    loading: true,
  };

  constructor(props: any){
    super(props);
    this.classes = props.classes;
  }

  componentDidMount(){
    this.subscribeToObjectData(this.props.objectId);
  }

  componentDidUpdate(prevProps){
    if (prevProps.objectId!==this.props.objectId){
      this.querySubscription.unsubscribe();
      this.subscribeToObjectData(this.props.objectId);
    }
  }

  subscribeToObjectData(objectId){
    this.querySubscription = apollo.watchQuery<any>({
      query: MESH_BY_ID_QUERY,
      variables: {id: objectId}
    }).subscribe(({ data, loading }) => {
      this.setState({
        loading: loading,
        mesh: data.mesh || null
      });
    });
  }

  async moveRobot(linear, angular){
    if (!this.state.mesh){
      console.log("Can not move robot until robot_id is known");
      return;
    }
    apollo.mutate({
      mutation: MOVE_ROBOT,
      variables: {
        robotId: this.state.mesh.id,
        linear: linear,
        angular: angular
      }
    })
  }

  componentWillUnmount() {
    this.querySubscription.unsubscribe();
  }

  renderRobotForm(){
    if (this.state.loading){
      return "<p>loading...</p>";
    }
    return (
      <form className={this.classes.container} noValidate autoComplete="off">
        <Typography className={this.classes.formTitle} variant="h5" gutterBottom >{this.state.mesh!.name}</Typography>
        <TextField
          id="outlined-id"
          name="id"
          label="ID"
          className={this.classes.textField}
          value={this.state.mesh!.id}
          margin="normal"
          variant="outlined"
        />
        <TextField
          id="outlined-x"
          name="x"
          className={this.classes.textField}
          variant="outlined"
          label="X"
          type="number"
          value={this.state.mesh!.x}
        />
        <TextField
          id="outlined-y"
          name="y"
          label="Y"
          type="number"
          className={this.classes.textField}
          value={this.state.mesh!.y}
          margin="normal"
          variant="outlined"
        />
        <TextField
          id="outlined-z"
          name="z"
          label="Z"
          type="number"
          className={this.classes.textField}
          value={this.state.mesh!.z}
          margin="normal"
          variant="outlined"
        />
        <TextField
          id="outlined-theta"
          name="theta"
          type="number"
          label="rotation"
          className={this.classes.textField}
          value={this.state.mesh!.theta}
          margin="normal"
          variant="outlined"
        />
        <Divider className={this.classes.controlDivider} />
        <div>
          <Grid container direction="row" justify="center" alignItems="center">
            <Grid item>
              <Button size="small" color="primary" variant="contained" name="up" className={this.classes.button}
                onClick={() => this.moveRobot(ROBOT_LINEAR_SPEED, 0)}
              >
                <ArrowUpward className={this.classes.extendedIcon} />
              </Button>
            </Grid>
          </Grid>
          <Grid container direction="row" justify="space-around" alignItems="center">
            <Grid item>
              <Button size="small" variant="contained" name="left" className={this.classes.button}
                onClick={() => this.moveRobot(0, ROBOT_ANGULAR_SPEED)}
              >
                 <RotateLeft className={this.classes.extendedIcon} />
              </Button>
            </Grid>
            <Grid item>
              <Button size="small" variant="contained" name="right" className={this.classes.button}
                onClick={() => this.moveRobot(0, -ROBOT_ANGULAR_SPEED)}
              >
                <RotateRight className={this.classes.extendedIcon} />
              </Button>
            </Grid>
          </Grid>
          <Grid container direction="row" justify="center" alignItems="center">
            <Grid item>
              <Button size="small" color="primary" variant="contained" name="up" className={this.classes.button}
                onClick={() => this.moveRobot(-ROBOT_LINEAR_SPEED, 0)}
              >
                <ArrowDownward className={this.classes.extendedIcon} />
              </Button>
            </Grid>
          </Grid>
        </div>
      </form>

    )
  }

  render(){
    return this.renderRobotForm();
  }
}

//@ts-ignore
EditObjectForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  objectId: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(EditObjectForm);