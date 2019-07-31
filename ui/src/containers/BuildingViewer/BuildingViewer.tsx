/**
 * Renders the Babylon viewer with state frmo the database
 */
import * as React from 'react';
import PropTypes from 'prop-types';
import BabylonViewer from '../BabylonViewer/BabylonViewer';
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import { gql } from "apollo-boost";
//import { Query } from "react-apollo";
//import { WebSocketLink } from 'apollo-link-ws';
//import ApolloClient from 'apollo-client';
import GraphqlClient from '../../apollo';


import { WebSocketLink } from "apollo-link-ws";
import { SubscriptionClient } from "subscriptions-transport-ws";

const GRAPHQL_ENDPOINT = "ws://localhost:8888/graphql";

const client = new SubscriptionClient(GRAPHQL_ENDPOINT, {
  reconnect: true
});

const link = new WebSocketLink(client);

import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';

const WSClient = new ApolloClient({
  link: link,
  cache: new InMemoryCache()
});




const GET_OBJECTS = gql`
    query GetMesh {
        meshesCurrent(deleted: false) {
            id
            name
            type
            width
            height
            depth
            scale
            x
            y
            z
            theta
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


const SUBSCRIBE_MESH_POSITION = gql`    
  subscription SubscribeMesh($id: String) {
    meshPosition(id: $id) {
        id,
        position {
          x:x,
          y:y,
          z:z,
          theta:theta
        }
    }
}
`;




const styles = (theme: Theme) => ({
  fab: {
    margin: theme.spacing.unit,
    position: "absolute",
    bottom: 30 + "px",
    right: 30 + "px",
  },
});

//@ts-ignore
export interface Props extends WithStyles<typeof styles>{
  onSelectedObject: Function
}

interface State {
  error: boolean,
  loading: boolean,
  meshesCurrent: any,
}



class BuildingViewer extends React.Component<Props, State> {
    classes: any

    constructor(props: any) {
      super(props);
      this.state = {
        error: false,
        loading: true,
        meshesCurrent: [],
      };
      this.classes = props.classes;
    }

    componentDidMount(){
      GraphqlClient.query({query: GET_OBJECTS}).then(data => {
        // @ts-ignore
        let self = this;
        let meshesCurrent = data.data.meshesCurrent;

        this.setState({ 
          loading: false,
          meshesCurrent: meshesCurrent,
        });

        for (let i=0; i<meshesCurrent.length; i++){
          //let mesh = meshesCurrent[i];
          WSClient.subscribe({
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
      return <BabylonViewer geometry={this.state.meshesCurrent} onSelectedObject={this.props.onSelectedObject} />
    }
}

//@ts-ignore
BuildingViewer.propTypes = {
  onSelectedObject: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

//@ts-ignore
export default withStyles(styles)(BuildingViewer);