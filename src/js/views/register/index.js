import React from "react";
import RegisterViewForm from "./register-form";
import { useParams } from "react-router-dom";

const RegisterView = (props) => {
    let { samlTokenId, oidcTokenId } = useParams();
    return (
        <div className={"registerbox dark"}>
            <img src="img/logo.png" alt="Psono Web Client" id="logo" />
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true" />
            </a>
            <RegisterViewForm samlTokenId={samlTokenId} oidcTokenId={oidcTokenId} />
        </div>
    );
};

export default RegisterView;
