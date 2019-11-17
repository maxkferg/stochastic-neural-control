/**
 * Renders the Babylon viewer with state frmo the database
 */
import * as React from 'react';
import BabylonViewer from '../BabylonViewer/BabylonViewer';
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import apollo from '../../apollo';
import { withRouter } from 'react-router-dom';
import SubscriptionClient from '../../apollo/websocket';
import { loader } from 'graphql.macro';
import { difference } from 'lodash';
const SUBSCRIBE_MESH_POSITION = loader('../../graphql/subscribeMesh.gql');
import { connect } from 'react-redux';

const BUFFER_POINT = 10000;
const GET_MESH_BUILDING_QUERY = loader('../../graphql/getMeshesBuilding.gql');
const POLL_INTERVAL = 5000 // 5 seconds
const SUB_POINTS_ROBOT = loader('../../graphql/subscribePointsOfRobot.gql');
const styles = (theme: Theme) => ({
  fab: {
    margin: theme.spacing(),
    position: "absolute",
    bottom: 30 + "px",
    right: 30 + "px",
  },
});

//@ts-ignore
export interface Props extends WithStyles<typeof styles>{
  onSelectedObject: Function
  match: any
  pointCloudLimit: any
  pointCloudStrategy: any
}

interface State {
  error: boolean,
  loading: boolean,
  meshesCurrent: any,
  deleteMesh: any[],
  points: any[]
}



class BuildingViewer extends React.Component<Props, State> {
    classes: any
    subScription: any
    subPointCloud: any
    subscriptionPointCloud: any
    prevPoints: any[]

    constructor(props: any) {
      super(props);
      this.state = {
        error: false,
        loading: true,
        meshesCurrent: [],
        deleteMesh: [],
        points: []
      };
      this.prevPoints = [];
      this.classes = props.classes;
    }
    
    async componentDidMount(){
      this.subScription = apollo.watchQuery({
        query: GET_MESH_BUILDING_QUERY, 
        pollInterval: POLL_INTERVAL, 
        variables : { buildingId: this.props.match.params.buildingId }}
      ).subscribe(data => {
        // @ts-ignore
        let self = this;
        let meshesCurrent = data.data.meshesOfBuilding;
        const meshIdsFromAPI = meshesCurrent.map(el => el.id);
        const meshIdsFromState = this.state.meshesCurrent.map(el => el.id);
        const deleteMesh = difference(meshIdsFromState, meshIdsFromAPI);

        this.setState({
          loading: false,
          meshesCurrent,
          deleteMesh
        });
      })
      this.subscriptionPointCloud = SubscriptionClient.subscribe({
        query: SUB_POINTS_ROBOT,
        variables: {
          id: "5dc5e024a201cd0100000001"
        }
      }).subscribe({
        next(data) {
          const { pointsGroup } = data;
          self.setState({
            points: pointsGroup
          })
        }
      })
     }

    componentDidUpdate() {
      const { pointCloudLimit } = this.props;
      let self = this;
      if (this.subscriptionPointCloud) {
        this.subscriptionPointCloud.unsubscribe()
      }
      this.subscriptionPointCloud = SubscriptionClient.subscribe({
        query: SUB_POINTS_ROBOT,
        variables: {
          id: "5dc5e024a201cd0100000001"
        }
      }).subscribe({
        next(data) {
          const { pointCloud } = data.data;
          self.prevPoints = self.prevPoints.concat(pointCloud.pointsGroup);
          if (self.prevPoints.length> BUFFER_POINT) {
            self.setState({
              points: pointCloud.pointsGroup
            })
            self.prevPoints = []
          }
        }
      })
    }

    componentWillUnmount() {
      if (this.subScription) {
        this.subScription.unsubscribe();
      }
    }

    public render() {
     
      if (this.state.loading) return 'Loading...';
      if (this.state.error) return `Error! ${this.state.error}`;
      return <BabylonViewer points={this.state.points} geometry={this.state.meshesCurrent} deleteMesh={this.state.deleteMesh} onSelectedObject={this.props.onSelectedObject} />
    }
}

const mapStateToProps = state => ({
  pointCloudLimit: state.pointCloudSetting.limit,
  pointCloudStrategy: state.pointCloudSetting.strategy
})
//@ts-ignore
export default connect(mapStateToProps)(withStyles(styles)(withRouter(BuildingViewer)));