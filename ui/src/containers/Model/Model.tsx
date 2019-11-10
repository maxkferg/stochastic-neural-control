import * as React from 'react';
import BuildingViewer from '../BuildingViewer/BuildingViewer';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';

function Model(props) {
    const { classes, onSelectedObject, onClickAddBtn} = props;
    return (
    <div>
        <div className={classes.drawerHeader} />
        <BuildingViewer onSelectedObject={onSelectedObject} />
        <Fab color="primary" aria-label="Add" className={classes.fab} onClick={onClickAddBtn()}>
          <AddIcon />
        </Fab>
    </div>
    )
}
export default Model;