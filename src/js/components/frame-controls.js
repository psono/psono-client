import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Container from "@material-ui/core/Container";
import { makeStyles } from "@material-ui/core/styles";

import browserClient from "../services/browser-client";
import deviceService from "../services/device";
import action from "../actions/bound-action-creators";

const useStyles = makeStyles((theme) => ({
    container: {
        height: "32px",
    },
    titlebar: {
        display: 'block',
        position: 'fixed',
        height: '32px',
        width: `calc(100% - 2px)`,
        padding: '4px',
        color: '#b1b6c1',
    },
    dragRegion: {
        width: `calc(100% + 132px)`,
        height: '100%',
        display: 'grid',
        gridTemplateColumns: 'auto 138px',
    },
    windowTitle: {
        gridColumn: 1,
        display: 'flex',
        alignItems: 'center',
        marginLeft: '8px',
        overflow: 'hidden',
        fontFamily: '"Segoe UI", sans-serif',
        fontSize: '12px',
    },
    windowTitleText: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        lineHeight: 1.5,
    },
    macTitle: {
        gridColumn: 1,
        display: 'flex',
        alignItems: 'center',
        marginLeft: '8px',
        overflow: 'hidden',
        fontFamily: '"Segoe UI", sans-serif',
        fontSize: '12px',
        justifyContent: 'center',
    },
    macTitleText: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        lineHeight: 1.5,
    },
}));

const FrameControls = (props) => {
    const classes = useStyles();
    const hasTitlebar = deviceService.hasTitlebar();
    const isMac = deviceService.isMac();

    if (!hasTitlebar) return null;

    let title;
    if (isMac) {
        title = (
            <div className={classes.macTitle}>
                <span className={classes.macTitleText}>Psono</span>
            </div>
        )
    } else {
        title = (
            <div className={classes.windowTitle}>
                <span className={classes.windowTitleText}>Psono</span>
            </div>
        )
    }

    return (
        <Container
            maxWidth={false}
            disableGutters={true}
            className={classes.container}
        >
            <div className={classes.titlebar}>
                <div className={classes.dragRegion + " drag"}>
                    {title}
                </div>
            </div>
        </Container>
    )
};

export default FrameControls;
