import React from 'react';
import { makeStyles } from '@material-ui/styles';
import logo from './logo.png';
import { withRouter } from 'react-router-dom';
const useStyles = makeStyles(theme => ({
    navbarList: {
        display: 'inline-flex',
        height: '20px',
        listStyle: 'none'
    },
    navbarItem: {
        textTransform: 'uppercase',  
        paddingLeft: '32px',
        cursor: 'pointer',
    },
    landingHeader: {
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        fontWeight: 600,
        color: 'white',
        justifyContent: 'space-around',
        fontFamily: "'Open Sans', 'Helvetica', 'Arial', sans-serif"
    },
    logo: {
        width: "150px"
    },
    loginBtn: {
        cursor: 'pointer',
        height: '40px',
        width: '125px',
        backgroundColor: 'transparent',
        border: '2px solid white',
        borderRadius: '4px',
        outline: 'none',
        color: 'white',
        fontSize: '15px',
        fontWeight: 600,
        transition: 'background-color 0.25s, color 0.25s',
        "&:hover": {
            backgroundColor: 'white',
            color: '#1a65b4'
        }
    },
    
}));


export default withRouter(function LandingHeader(props) {
    const classes = useStyles();
    const { history } = props;
    return (
        <div className={classes.landingHeader}>
            <img className={classes.logo} src={logo} alt="kaka"/>
            <ul className={classes.navbarList}>
                <li className={classes.navbarItem}>home</li>
                <li className={classes.navbarItem}>pricing</li>
                <li className={classes.navbarItem}>integrations</li>
                <li className={classes.navbarItem}>features</li>
            </ul>
                <button onClick={() => history.push('/auth')}className={classes.loginBtn}>Login</button>
        </div>
    )
})