import React, { useState, useEffect } from "react";
import {
  Grid,
} from "@material-ui/core";
import { connect }from 'react-redux';
// styles
import useStyles from "./styles";

// components
import Widget from "../../components/Widget";
import PageTitle from "../../components/PageTitle";
import Table from "./components/Table/Table";
// services
import { getCurrentUser } from '../../redux/selectors/currentUser'
import { getBuildings } from '../../services/BuildingServices';

function Dashboard(props) {
  const classes = useStyles();
  const [buildings, setBuildings] = useState([]);
  const { currentUser, history } = props;
  useEffect(() => {
    async function fetchBuildings() {
      if (currentUser.id) {
        const responseApollo = await getBuildings({ ownerId: currentUser.id });
        const { data } = responseApollo;
        if (data.building.length) {
          setBuildings(data.building)
        }
      }
    } 
    fetchBuildings()
  }, [currentUser.id])
  return (
    <div className={classes.container}>
      <PageTitle title="Dashboard" button="Create Building" />
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