import React from "react";
import EmergencyCodeViewForm from "./emergency-code-form";
import { useParams } from "react-router-dom";
import ConfigLogo from "../../components/config-logo";

const EmergencyCodeView = (props) => {
    let { samlTokenId, oidcTokenId } = useParams();
    return (
        <div className={"lostpasswordbox dark"}>
            <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} />
            <EmergencyCodeViewForm samlTokenId={samlTokenId} oidcTokenId={oidcTokenId} />
        </div>
    );
};

export default EmergencyCodeView;
