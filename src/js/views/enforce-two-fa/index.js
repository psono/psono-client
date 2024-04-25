import React from "react";
import EnforceTwoFaViewForm from "./enforce-two-fa-form";
import ConfigLogo from "../../components/config-logo";

const EnforceTwoFaView = (props) => {
    return (
        <div className={"loginbox dark"}>
            <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'}/>
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true"/>
            </a>
            <EnforceTwoFaViewForm/>
        </div>
    );
};

export default EnforceTwoFaView;
