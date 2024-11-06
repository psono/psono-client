import React from "react";
import { useParams } from "react-router-dom";

import {makeStyles} from "@mui/styles";

import LoginViewForm from "./login-form";
import FrameControls from "../../components/frame-controls";
import ConfigLogo from "../../components/config-logo";
import DarkBox from "../../components/dark-box";
import PropTypes from "prop-types";


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

const LoginView = ({fullWidth}) => {
    const classes = useStyles();
    let { samlTokenId, oidcTokenId } = useParams();
    return (
        <>
            <FrameControls />
            <DarkBox className={fullWidth ? '' : classes.box}>
                <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} height="100%"/>
                <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                    <i className="fa fa-info-circle" aria-hidden="true"/>
                </a>
                <LoginViewForm samlTokenId={samlTokenId} oidcTokenId={oidcTokenId}/>
            </DarkBox>
        </>
    );
};

LoginView.defaultProps = {
    fullWidth: false,
};
LoginView.propTypes = {
    fullWidth: PropTypes.bool,
};

export default LoginView;
