import React from "react";
import KeyTransferForm from "./key-transfer-form";
import ConfigLogo from "../../components/config-logo";

const EnforceTwoFaView = (props) => {
    return (
        <div className={"loginbox dark"}>
            <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} height="100%"/>
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true"/>
            </a>
            <KeyTransferForm/>
        </div>
    );
};

export default EnforceTwoFaView;
