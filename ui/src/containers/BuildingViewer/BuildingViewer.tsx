/**
 * Renders the Babylon viewer with state frmo the database
 */
import * as React from 'react';
import PropTypes from 'prop-types';
import BabylonViewer from '../BabylonViewer/BabylonViewer';
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import { gql } from "apollo-boost";
import { Query } from "react-apollo";


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



const styles = (theme: Theme) => ({
  fab: {
    margin: theme.spacing.unit,
    position: "absolute",
    bottom: 30 + "px",
    right: 30 + "px",
  },
});

//@ts-ignore
export interface Props extends WithStyles<typeof styles>{}

interface State {
}



class BuildingViewer extends React.Component<Props, State> {
    classes: any

    constructor(props: any) {
      super(props);
      this.state = {};
      this.classes = props.classes;
    }

    public render() {
        return (
			<Query query={GET_OBJECTS} pollInterval={500}>
			    {({ loading, error, data }) => {
			      if (loading) return 'Loading...';
			      if (error) return `Error! ${error.message}`;
			      return (
			      	<BabylonViewer geometry={data.meshesCurrent} />
			      );
			    }}
			</Query>
        );
    }
}

//@ts-ignore
BuildingViewer.propTypes = {
  classes: PropTypes.object.isRequired,
};

//@ts-ignore
export default withStyles(styles)(BuildingViewer);