import React, { useState, useEffect } from "react";
import {
  Grid,
  Modal,
  Button,
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
import { getBuildings, createBuilding, getGuestBuildings } from '../../services/BuildingServices';


function Dashboard(props) {
  const classes = useStyles();
  const isGuest = localStorage.getItem('role') === 'guest'
  const [buildings, setBuildings] = useState([]);
  const { currentUser, history } = props;
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
        const responseApollo = await getBuildings({ ownerId: currentUser.id });
        const { data } = responseApollo;
        if (data.building.length) {
          setBuildings(data.building)
        }
        handleClose()
        toast('Building created')
    }
  }

  const handleChangeBuildingName = e => {
    setBuildingName(e.target.value)
  }

  useEffect(() => {
    async function fetchBuildings() {
      if (currentUser.id || isGuest) {
        const responseApollo = isGuest ? await getGuestBuildings() : await getBuildings({ ownerId: currentUser.id });
        const { data } = responseApollo;
        const buildings = isGuest ? data.guestBuildings : data.building
        if (buildings.length) {
          setBuildings(buildings)
        }
      }
    }
    fetchBuildings()
  }, [currentUser.id])

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
          <div className={classes.paperHeader}>Create Building</div>
          <TextField  
            onChange={handleChangeBuildingName}
            id="outlined-basic"
            className={classes.textField}
            label="Building Name"
            margin="normal"
            variant="outlined"
          />
          <Button
            classes={{ root: classes.button }}
            variant="contained"
            size="large"
            color="primary"
            onClick={handleCreateBuilding}
          >
            Create Building
          </Button>
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
            <Table classes={classes} history={history} buildings={buildings} />
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