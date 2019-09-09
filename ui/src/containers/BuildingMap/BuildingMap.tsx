import * as React from 'react';
import { ApolloProvider } from 'react-apollo';
import { ApolloProvider as ApolloHooksProvider } from 'react-apollo-hooks';
import apollo from '../../apollo';
import MapViewer from '../MapViewer';

function BuildingMap(props) {
    const { classes } = props;
    return (
        <ApolloProvider client={apollo}>
        <ApolloHooksProvider client={apollo}>
          <div className={classes.drawerHeader} />
          <MapViewer />
        </ApolloHooksProvider>
      </ApolloProvider>
    )
}

export default BuildingMap;