import React from "react";
import LoginViewForm from "./login-form";
import { useParams } from "react-router-dom";

const LoginView = (props) => {
    let { samlTokenId, oidcTokenId } = useParams();
    return (
        <div className={"loginbox dark"}>
            <img src="img/logo.png" alt="Psono Web Client" id="logo" />
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true" />
            </a>
            <LoginViewForm samlTokenId={samlTokenId} oidcTokenId={oidcTokenId} />
        </div>
    );
};

export default LoginView;
