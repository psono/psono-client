import React from "react";
import { useParams } from "react-router-dom";

import LostPasswordViewForm from "./lost-password-form";
import FrameControls from "../../components/frame-controls";
import ConfigLogo from "../../components/config-logo";
import DarkBox from "../../components/dark-box";
import {makeStyles} from "@mui/styles";


const useStyles = makeStyles((theme) => ({
    box: {
        width: '340px',
        padding: theme.spacing(2.5),
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        borderRadius: '4px',
        [theme.breakpoints.up('sm')]: {
            width: '540px',
        },
    },
}));

const LostPasswordView = (props) => {
    const classes = useStyles();
    let { samlTokenId, oidcTokenId } = useParams();
    return (<>
            <FrameControls />
            <DarkBox className={classes.box}>
                <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} height="100%"/>
                <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                    <i className="fa fa-info-circle" aria-hidden="true"/>
                </a>
                <LostPasswordViewForm samlTokenId={samlTokenId} oidcTokenId={oidcTokenId}/>
            </DarkBox>
        </>
    );
};

export default LostPasswordView;
