import React from 'react';
import Hero from './hero.png';
import { makeStyles } from '@material-ui/styles';
import { Button } from '@material-ui/core'
import { withRouter } from 'react-router-dom';

const useStyles = makeStyles(theme => ({
    landingContentImage: {
        display: 'flex'
    },
    landingContent: {
    },
    landingContentDescription: {
        color: 'white',
        fontFamily: "'Open Sans', 'Helvetica', 'Arial', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontSize: '30px',
    },
    contentImage: {
        maxWidth: '60%',
        margin: 'auto',
    },
    firstDescription: {
        fontSize: '70px',
        fontWeight: 600
    },
    secDescription: {
        marginBottom: '30px',
        fontWeight: 300
    },
    guestBtn: {
        color: 'white',
        borderColor: 'white',
        borderWidth: 0,
        fontSize: 16
    }
}));

export default withRouter(function LandingContent(props) {
    const classes = useStyles();
    return (
        <div className={classes.landingContent}>
            <div className={classes.landingContentDescription}>
                <div className={classes.firstDescription}>The Manage Building Auto</div>
                <div className={classes.secDescription}>Easy manage building with automatic bot</div>
            </div>
            <div className={classes.landingContentImage}>
                <img className={classes.contentImage} src={Hero} alt="hero" />
            </div>
        </div>
    )
})