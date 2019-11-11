import React from 'react';
//import PropTypes from 'prop-types';
import { withStyles, WithStyles } from '@material-ui/core/styles';
import { loader } from 'graphql.macro';
import apollo from '../../apollo';
import Chip from '@material-ui/core/Chip';
import DoneIcon from '@material-ui/icons/Done';
import PauseIcon from '@material-ui/icons/Pause';
import { includes, remove} from 'lodash';
const ROBOT_BY_ID_QUERY = loader('../../graphql/getRobotById.gql');
const UPDATE_ROBOT_MUTATION = loader('../../graphql/updateRobot.gql');


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
  chip: {
    marginTop: "5px",
    marginBottom: "5px",
  }
})


interface Props extends WithStyles<typeof styles> {
  objectId: string | null
  topic: string
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
  //mesh: Mesh | null
  robot: Robot | null
  loading: boolean
  enabled: boolean
}

/**
 * RobotTopicChip
 * Select what topic to use for control actions
 *
 */
class RobotTopicChip extends React.Component<Props, State> {
  querySubscription: any
  classes: any
  state: State = {
    robot: null,
    loading: true,
    enabled: false
  };

  constructor(props: any){
    super(props);
    this.classes = props.classes;
  }

  componentDidMount(){
    if (this.props.objectId){
      this.fetchRobotData()
    }
  }

  componentWillUpdate(prevProps){
    if (this.props.objectId !== prevProps.objectId) {
      this.fetchRobotData()
    }
  }

  /**
   * fetchRobotData
   * Fetch data for this element using Apollo
   *
   */
  async fetchRobotData(){
    const apolloResponse = await apollo.query<any>({
      query: ROBOT_BY_ID_QUERY,
      variables: {id: this.props.objectId}
    })
    this.updateState(apolloResponse)
  }

  /**
   * updateControlTopics
   * Enable or disable reading from this topic
   *
   */
  async updateControlTopics(enable){
    let topics: string[] = []
    //if (this.state.robot){
    //  topics = this.state.robot!.validControlTopics
    //}
    if (enable && !includes(topics, this.props.topic)){
      topics.push(this.props.topic);
    }
    if (!enable){
      remove(topics, this.props.topic);
    }

    const apolloResponse = await apollo.mutate<any>({
      mutation: UPDATE_ROBOT_MUTATION,
      variables: {
        id: this.props.objectId,
        validControlTopics: topics
      }
    })
    // Predictive UI
    this.setState({enabled: enable});
    this.updateState(apolloResponse);
  }


  /**
   * updateState
   * Update the state of this object using the data
   * from Apollo
   *
   */
  updateState(apolloResponse){
    if (apolloResponse) {
      if (!apolloResponse.data.robot){
        throw new Error("Apollo did valid data")
      }
      let robot = apolloResponse.data.robot;
      let enabled = includes(robot.validControlTopics, this.props.topic);
      this.setState({
        robot: robot || null,
        enabled: enabled,
      });
    };
  }


  renderEnabled(){
    return (    
      <Chip
        label={this.props.topic}
        clickable
        className={this.classes.chip}
        onClick={() => this.updateControlTopics(false)}
        color="primary"
        onDelete={()=>{}}
        deleteIcon={<DoneIcon />}
      />
    )
  }

  renderDisabled(){
    return (    
      <Chip
        label={this.props.topic}
        clickable
        className={this.classes.chip}
        onClick={() => this.updateControlTopics(true)}
        variant="outlined"
        onDelete={()=>{}}
        deleteIcon={<PauseIcon />}
      />
    )
  }

  render(){
    if (this.state.enabled){
      return this.renderEnabled();
    } else {
      return this.renderDisabled()
    }
  }
}



export default withStyles(styles)(RobotTopicChip);