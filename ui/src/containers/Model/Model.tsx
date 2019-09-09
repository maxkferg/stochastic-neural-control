import * as React from 'react';
import BuildingViewer from '../BuildingViewer/BuildingViewer';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';

function Model(props) {
    const { classes, onSelectedObject, createGeometry} = props;
    return (
    <div>
        <div className={classes.drawerHeader} />
        <BuildingViewer onSelectedObject={onSelectedObject} />
        <Fab color="primary" aria-label="Add" className={classes.fab} onClick={createGeometry}>
          <AddIcon />
        </Fab>
    </div>
    )
}
export default Model;