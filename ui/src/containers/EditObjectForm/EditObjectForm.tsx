import React from 'react';
import PropTypes from 'prop-types';
import { withStyles, WithStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { loader } from 'graphql.macro';
import apollo from '../../apollo';
import Chip from '@material-ui/core/Chip';
import Divider from '@material-ui/core/Divider';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import RotateLeft from '@material-ui/icons/RotateLeft';
import RotateRight from '@material-ui/icons/RotateRight';
import Grid from '@material-ui/core/Grid';
import RobotTopicChip from '../RobotTopicChip/RobotTopicChip';


const MESH_BY_ID_QUERY = loader('../../graphql/getMeshById.gql');
const ROBOT_BY_ID_QUERY = loader('../../graphql/getRobotById.gql');
const MOVE_ROBOT = loader('../../graphql/moveRobot.gql');
const UPDATE_OBJECT = loader('../../graphql/updateObject.gql')
const ROBOT_LINEAR_SPEED = 0.3;
const ROBOT_ANGULAR_SPEED = 0.6;

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
  controlDivider: {
    marginTop: "30px",
    marginBottom: "10px"
  },
  checkbox: {
    margin: theme.spacing(2),
  },
  toolbar: theme.mixins.toolbar,
  hide: {
    display: 'none',
  },
  chip: {
    color: "white",
    backgroundColor: "#1f9238",
    marginRight: "10px",
    marginTop: "6px",
    height: "20px",
    fontSize: "12px",
    float: 'right' as 'right',
  },
  paddedItem: {
    marginTop: theme.spacing(2),
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
  },
});




export interface Props extends WithStyles<typeof styles> {
  objectId: null | string
  onSuccess: Function
  onCancel: Function
  type: null | string
}

interface Mesh {
  id: number
  x: number
  y: number
  z: number
  name: string
  theta: number
}

interface Robot {
  id: number
  name: string
  isRealRobot: boolean
  validControlTopics: [string]
  lastCommandReceived: string
  lastPositionReceived: string
}

interface State {
  mesh: Mesh | null
  robot: Robot | null
  loading: boolean
}




class EditObjectForm extends React.Component<Props, State> {
  querySubscription: any
  classes: any
  state: State = {
    mesh: null,
    robot: null,
    loading: true,
  };

  constructor(props: any) {
    super(props);
    this.classes = props.classes;
  }

  componentDidMount() {
    this.subscribeToObjectData(this.props.objectId);
    this.fetchRobotData(this.props.objectId);
  }

  // handleChangePositionObject = (axis, newPosotion) => {
  //     const { mesh } = this.state;
  //     const newMesh = JSON.parse(JSON.stringify(mesh));
  //     newMesh[axis] = newPosotion;
  // }

  componentDidUpdate(prevProps) {
    if (prevProps.objectId !== this.props.objectId) {
      this.querySubscription.unsubscribe();
      this.subscribeToObjectData(this.props.objectId);
    }
  }

  subscribeToObjectData(objectId) {
    this.querySubscription = apollo.watchQuery<any>({
      query: MESH_BY_ID_QUERY,
      variables: { id: objectId }
    }).subscribe(({ data, loading }) => {
      this.setState({
        loading: loading,
        mesh: data.mesh || null
      });
    });
  }

  async fetchRobotData(objectId) {
    const apolloResp = await apollo.query<any>({
      query: ROBOT_BY_ID_QUERY,
      variables: { id: objectId }
    })
    if (apolloResp) {
      this.setState({
        robot: apolloResp.data.robot || null
      });
    };
  }

  async moveRobot(linear, angular) {
    if (!this.state.mesh) {
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

  updateObject(meshId) {
    const variables = {
      id: meshId,
      x: this.state.mesh!.x,
      y: this.state.mesh!.y,
      z: this.state.mesh!.z,
      theta: this.state.mesh!.theta
    }

    apollo.mutate({
      mutation: UPDATE_OBJECT,
      variables
    })
  }

  componentWillUnmount() {
    this.querySubscription.unsubscribe();
  }


  renderSimulatedChip() {
    if (!this.state.robot) {
      return
    }
    let realRobotText = "Real Robot";
    if (!this.state.robot.isRealRobot) {
      realRobotText = "Simulated"
    }
    return <Chip className={this.classes.chip} size="small" label={realRobotText} />
  }

  renderControlBot() {
    return <React.Fragment>
      <Grid container direction="column">
        <Grid item className={this.classes.paddedItem} >
          <Typography variant="caption">
            Control Topics
      </Typography>
        </Grid>
        <Grid item className={this.classes.paddedItem} >
          <RobotTopicChip type={this.props.type} objectId={this.props.objectId} topic='robot.commands.velocity_pred' />
          <RobotTopicChip type={this.props.type} objectId={this.props.objectId} topic='robot.commands.velocity_human' />
        </Grid>
      </Grid>
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
    </React.Fragment>
  }
  renderConnectedChip() {
    if (!this.state.robot) {
      return
    }
    let connectedText = "Connected";
    //if (!this.state.robot.lastPositionReceived<Date.now(){
    //  realRobotText = "Simulated"
    //}
    return <Chip
      className={this.classes.chip}
      size="small"
      label={connectedText} />
  }

  renderUpdateButton() {
    return (
      <React.Fragment>
        <Button
          variant="contained"
          className={this.classes.button}
          onClick={() => this.props.onCancel()}
        >
          Cancel
        </Button>
        <Button
          color="primary"
          variant="contained"
          className={this.classes.button}
          onClick={() => this.updateObject(this.state.mesh!.id)}
        >
          Update object
        </Button>
      </React.Fragment>
    )
  }

  renderRobotForm() {
    if (this.state.loading) {
      return "<p>loading...</p>";
    }
    console.log(this.state.mesh)
    return (
      <form className={this.classes.container} noValidate autoComplete="off">
        <Typography className={this.classes.formTitle} variant="h5" gutterBottom >
          {this.state.mesh!.name}
          {this.renderSimulatedChip()}
          {this.renderConnectedChip()}
        </Typography>
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
          defaultValue={this.state.mesh!.x}
          onChange={e => {
            this.state.mesh!.x = +e.target.value
            this.setState({
              mesh: this.state.mesh
            })
          }}
        />
        <TextField
          id="outlined-y"
          name="y"
          label="Y"
          type="number"
          className={this.classes.textField}
          defaultValue={this.state.mesh!.y}
          margin="normal"
          variant="outlined"
          onChange={e => {
            this.state.mesh!.y = +e.target.value
            this.setState({
              mesh: this.state.mesh
            })
          }}
        />
        <TextField
          id="outlined-z"
          name="z"
          label="Z"
          type="number"
          className={this.classes.textField}
          defaultValue={this.state.mesh!.z}
          margin="normal"
          variant="outlined"
          onChange={e => {
            this.state.mesh!.z = +e.target.value
            this.setState({
              mesh: this.state.mesh
            })
          }}
        />
        <TextField
          id="outlined-theta"
          name="theta"
          type="number"
          label="rotation"
          className={this.classes.textField}
          defaultValue={this.state.mesh!.theta}
          margin="normal"
          variant="outlined"
          onChange={e => {
            this.state.mesh!.theta = +e.target.value
            this.setState({
              mesh: this.state.mesh
            })
          }}
        />
        {this.props.type === 'robot' && this.renderControlBot()}
        {this.props.type === 'object' && this.renderUpdateButton()}
      </form >
    )
  }

  render() {
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