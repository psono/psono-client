import React from "react";
import LostPasswordViewForm from "./lost-password-form";
import { useParams } from "react-router-dom";

const LostPasswordView = (props) => {
    let { samlTokenId, oidcTokenId } = useParams();
    return (
        <div className={"lostpasswordbox dark"}>
            <img src="img/logo.png" alt="Psono Web Client" id="logo" />
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true" />
            </a>
            <LostPasswordViewForm samlTokenId={samlTokenId} oidcTokenId={oidcTokenId} />
        </div>
    );
};

export default LostPasswordView;
