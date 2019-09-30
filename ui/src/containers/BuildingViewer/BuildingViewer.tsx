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
import { getMeshesOfBuilding } from '../../services/MeshServices';
// const MESH_QUERY = loader('../../graphql/getMesh.gql');
const SUBSCRIBE_MESH_POSITION = loader('../../graphql/subscribeMesh.gql');
const GET_MESH_BUILDING_QUERY = loader('../../graphql/getMeshesBuilding.gql');

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
      console.log(this.props.match);
      if (this.props.match) {
        const { match } = this.props;
        if (match.params.buildingId) {
          const { 
            buildingId
          } = match.params;
          const data = await getMeshesOfBuilding({
            buildingId
          })
          console.log("TCL: BuildingViewer -> componentDidMount -> data", data);
        }
      }
     
      apollo.watchQuery({query: GET_MESH_BUILDING_QUERY, pollInterval: 1000, variables : { buildingId: this.props.match.params.buildingId }}).subscribe(data => {
        // @ts-ignore
        let self = this;
        let meshesCurrent = data.data.meshesOfBuilding;
        const deleteMesh = this.state.meshesCurrent.filter(el => meshesCurrent.indexOf(el) === -1).map(el => el.id)
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