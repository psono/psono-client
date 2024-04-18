import React from "react";
import RegisterViewForm from "./register-form";
import { useParams } from "react-router-dom";
import FrameControls from "../../components/frame-controls";
import ConfigLogo from "../../components/config-logo";

const RegisterView = (props) => {
    let { samlTokenId, oidcTokenId } = useParams();
    return (<>
            <FrameControls />
            <div className={"registerbox dark"}>
                <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} />
                <RegisterViewForm samlTokenId={samlTokenId} oidcTokenId={oidcTokenId} />
            </div>
        </>
    );
};

export default RegisterView;
