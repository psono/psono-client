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
                <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                    <i className="fa fa-info-circle" aria-hidden="true" />
                </a>
                <RegisterViewForm samlTokenId={samlTokenId} oidcTokenId={oidcTokenId} />
            </div>
        </>
    );
};

export default RegisterView;
