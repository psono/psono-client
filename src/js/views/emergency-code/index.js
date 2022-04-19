import React from "react";
import EmergencyCodeViewForm from "./emergency-code-form";
import { useParams } from "react-router-dom";

const EmergencyCodeView = (props) => {
    let { samlTokenId, oidcTokenId } = useParams();
    return (
        <div className={"lostpasswordbox dark"}>
            <img src="img/logo.png" alt="Psono Web Client" id="logo" />
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true" />
            </a>
            <EmergencyCodeViewForm samlTokenId={samlTokenId} oidcTokenId={oidcTokenId} />
        </div>
    );
};

export default EmergencyCodeView;
