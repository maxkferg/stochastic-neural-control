import React from 'react';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { createBuilding } from '../../services/BuildingServices';


const OWNER_ID = '5d8487f33a0cab41cb414652'
interface State {
    buildingName: any
  }
  
class Building extends React.Component<any, State> {
    time = null;
    constructor(props) {
        super(props);
        this.state = {
            buildingName: ''
        };
        this.handleCreateBuilding = this.handleCreateBuilding.bind(this);
    }
    
    componentDidMount() {
        console.log(OWNER_ID);
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
    </React.Fragment>
    }
}

export default Building;