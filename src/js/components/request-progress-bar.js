import React, { useState } from "react";
import { useSelector } from "react-redux";
import { makeStyles } from "@material-ui/core/styles";
import Container from '@material-ui/core/Container'
import LinearProgress from '@material-ui/core/LinearProgress'

const useStyles = makeStyles((theme) => ({
    bar: ({ animationDuration }) => ({
        transitionDuration: `${animationDuration}ms`,
    }),
    container: ({ animationDuration, isFinished }) => ({
        opacity: isFinished ? 0 : 1,
        pointerEvents: 'none',
        transition: `opacity ${animationDuration}ms linear`,
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        zIndex: 2000,
    }),
}));

const RequestProgressBar = (props) => {
    const requestCounterOpen = useSelector((state) => state.transient.requestCounterOpen);
    const requestCounterClosed = useSelector((state) => state.transient.requestCounterClosed);

    const classes = useStyles(200, requestCounterOpen === 0 || requestCounterClosed === 0);

    if (requestCounterOpen === 0) {
        return null;
    }

    let progress = 0;
    if (requestCounterOpen !== 0 && requestCounterClosed !== 0) {
        progress = requestCounterClosed / requestCounterOpen  * 100;
    }
    return (

        <Container classes={{ root: classes.container }} disableGutters={true}>
            <LinearProgress
                classes={{ bar1Determinate: classes.bar }}
                value={progress * 100}
                variant="determinate"
            />
        </Container>
    );
};

export default RequestProgressBar;
