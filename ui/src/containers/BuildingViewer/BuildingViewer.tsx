/**
 * Renders the Babylon viewer with state frmo the database
 */
import * as React from 'react';
import PropTypes from 'prop-types';
import BabylonViewer from '../BabylonViewer/BabylonViewer';
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import apollo from '../../apollo';
import { withRouter } from 'react-router-dom';
import SubscriptionClient from '../../apollo/websocket';
import { loader } from 'graphql.macro';
import { difference } from 'lodash';
import { getBuilding } from '../../services/BuildingServices';
const SUBSCRIBE_MESH_POSITION = loader('../../graphql/subscribeMesh.gql');
const GET_MESH_BUILDING_QUERY = loader('../../graphql/getMeshesBuilding.gql');
const POLL_INTERVAL = 5000 // 5 seconds
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
  onSelectedObject: Function,
  match: any
}

interface State {
  error: boolean,
  loading: boolean,
  meshesCurrent: any,
  deleteMesh: any[],
}



class BuildingViewer extends React.Component<Props, State> {
    classes: any
    subScription: any
    constructor(props: any) {
      super(props);
      this.state = {
        error: false,
        loading: true,
        meshesCurrent: [],
        deleteMesh: [],
      };
      this.classes = props.classes;
    }

    async componentDidMount(){
      try {
        const building = await getBuilding({ 
          buildingId: this.props.match.params.buildingId
        });
        console.log(building)
        if (!building.data.getBuilding.id) {
          throw new Error('Building not found');
        }
      } catch(error) {
        //@ts-ignore
        this.props.history.push('/no-match');
      }   
     
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

        for (let i=0; i<meshesCurrent.length; i++) {
          //let mesh = meshesCurrent[i];
          SubscriptionClient.subscribe({
            query: SUBSCRIBE_MESH_POSITION,
          }).subscribe({
            next (data) {
              for (let j=0; j<self.state.meshesCurrent.length; j++){
                if (self.state.meshesCurrent[j].id==data.data.meshPosition.id){
                  let meshCopy = Object.assign({}, self.state.meshesCurrent[j]);
                  meshCopy.x = data.data.meshPosition.position.x
                  meshCopy.y = data.data.meshPosition.position.y
                  meshCopy.z = data.data.meshPosition.position.z
                  meshCopy.theta = data.data.meshPosition.position.theta
                  self.state.meshesCurrent[j] = meshCopy;
                  self.setState({meshesCurrent: self.state.meshesCurrent});
                  if (self.state.meshesCurrent[j].id=="5d3f7bf06e30e20100000004"){
                    console.log(data.data.meshPosition.position.z)
                  }
                }
              }
            }
          });
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
      return <BabylonViewer geometry={this.state.meshesCurrent} deleteMesh={this.state.deleteMesh} onSelectedObject={this.props.onSelectedObject} />
    }
}

//@ts-ignore
BuildingViewer.propTypes = {
  onSelectedObject: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

//@ts-ignore
export default withStyles(styles)(withRouter(BuildingViewer));