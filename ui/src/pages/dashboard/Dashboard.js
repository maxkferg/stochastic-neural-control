import React, { useState } from "react";
import {
  Grid,
  Modal,
  TextField
} from "@material-ui/core";
import { connect }from 'react-redux';
// styles
import useStyles from "./styles";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// components
import Widget from "../../components/Widget";
import PageTitle from "../../components/PageTitle";
import Table from "./components/Table/Table";

// services
import { getCurrentUser } from '../../redux/selectors/currentUser'
import { createBuilding } from '../../services/BuildingServices';


function Dashboard(props) {
  const classes = useStyles();
  const isGuest = localStorage.getItem('role') === 'guest'
  const { currentUser, history, buildings, isFetchBuildings, setIsFetchBuildings } = props;
  const [open, setOpen] = React.useState(false);
  const [buildingName, setBuildingName] = useState('');
  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCreateBuilding = async () => {
    const variables = {
        buildingName,
        ownerId: currentUser.id
    }
    const building = await createBuilding(variables);
    const { data } = building;
    if (data.createBuilding.id) {
        setIsFetchBuildings(!isFetchBuildings)
        handleClose()
        toast('Building created')
    }
  }

  const handleChangeBuildingName = e => {
    setBuildingName(e.target.value)
  }

  return (
    <div className={classes.container}>
      <ToastContainer />
      <PageTitle title="Dashboard" onClick={handleOpen} button={!isGuest ? "Create Building" : ''} />
      <Modal
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        open={open}
        onClose={handleClose}
      >
        <div className={classes.paper}>
          <div className={classes.paperHeader}>Configure a project for building</div>
          <div> 
          <TextField  
            onChange={handleChangeBuildingName}
            id="outlined-basic"
            className={classes.textField}
            label="Building Name"
            margin="normal"
            variant="outlined"
          />
          </div>
          <span className={classes.submitButton} onClick={handleCreateBuilding}>Create Building</span>
        </div>
      </Modal>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Widget
            title="Buildings"
            upperTitle
            noBodyPadding
            disableWidgetMenu
            bodyClass={classes.tableWidget}
          >
            <Table classes={classes} history={history} setIsFetchBuildings={setIsFetchBuildings} isFetchBuildings={isFetchBuildings} buildings={buildings} />
          </Widget>
        </Grid>
      </Grid>
    </div>
  );
}

const mapStateToProps = state => ({
  currentUser: getCurrentUser(state)
})

export default connect(mapStateToProps)(Dashboard)