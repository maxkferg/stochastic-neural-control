import React from 'react';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { createBuilding, getBuildings } from '../../services/BuildingServices';

const OWNER_ID = '5d8487f33a0cab41cb414652'
interface State {
    buildingName: any,
    buildings: any[]
  }
  
class Building extends React.Component<any, State> {
    time = null;
    constructor(props) {
        super(props);
        this.state = {
            buildingName: '',
            buildings: []
        };
        this.handleCreateBuilding = this.handleCreateBuilding.bind(this);
        this.handleNavigateBuilding = this.handleNavigateBuilding.bind(this);
    }
    
    async componentDidMount() {
        if (OWNER_ID) {
            const responseApollo = await getBuildings({ ownerId: OWNER_ID });

            const { data } = responseApollo;
            if (data.building.length) {
                this.setState({
                    buildings: data.building
                })
            }
        }
    }

    handleChangeBuildingName = (e) => {
        if (this.time) {
            //@ts-ignore
            clearTimeout(this.time);
        }
        const value = e.target.value;
        //@ts-ignore
        this.time = setTimeout(() => this.setState({
            buildingName: value
        }), 500);
    }

    async handleCreateBuilding() {
        const { buildingName } = this.state;
        const variables = {
            buildingName,
            ownerId: OWNER_ID
        }
        const building = await createBuilding(variables);
        const { data } = building;
        if (data.createBuilding.id) {
            alert('Create building success');
        }
    }

    handleNavigateBuilding(buildingId) {
        this.props.history.push(`/${buildingId}/model`);
    }

    generateListBuilding() {
        const { buildings } = this.state;
        return buildings.map(value =>{
            return <ListItem onClick={() => this.handleNavigateBuilding(value.id)} key={value.id}>
                <ListItemText
                primary={value.id}
                secondary={value.name}
                />
                </ListItem>
        }
        );
    }

    render() {
        return <React.Fragment>
         <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="Building name"
            name="email"
            autoComplete="email"
            autoFocus
            onChange={this.handleChangeBuildingName}
          />
           <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            onClick={this.handleCreateBuilding}
          >Button</Button>
        <List>
            {this.generateListBuilding()}
        </List>
    </React.Fragment>
    }
}

export default Building;