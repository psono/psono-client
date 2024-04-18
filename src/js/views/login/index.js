import React from "react";
import LoginViewForm from "./login-form";
import { useParams } from "react-router-dom";
import FrameControls from "../../components/frame-controls";
import ConfigLogo from "../../components/config-logo";

const LoginView = (props) => {
    let { samlTokenId, oidcTokenId } = useParams();
    return (
        <>
            <FrameControls />
            <div className={"loginbox dark"}>
                <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} />
                <LoginViewForm samlTokenId={samlTokenId} oidcTokenId={oidcTokenId} />
            </div>
        </>
    );
};

export default LoginView;
