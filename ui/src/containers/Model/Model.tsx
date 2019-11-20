import * as React from 'react';
import BuildingViewer from '../BuildingViewer/BuildingViewer';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';

function Model(props) {
    const { classes, onSelectedObject, onClickAddBtn} = props;
    const isGuest = localStorage.getItem('role') === 'guest'
    return (
    <div>
        <div className={classes.drawerHeader} />
        {
          //@ts-ignore
          <BuildingViewer onSelectedObject={!isGuest ? onSelectedObject : function():void{}} />
        }
        {
          !isGuest
            ? (<Fab color="primary" aria-label="Add" className={classes.fab} onClick={onClickAddBtn()}>
                <AddIcon />
              </Fab>)
            : null
        }
    </div>
    )
}
export default Model;