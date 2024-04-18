import React from "react";
import EnforceTwoFaViewForm from "./enforce-two-fa-form";
import ConfigLogo from "../../components/config-logo";

const EnforceTwoFaView = (props) => {
    return (
        <div className={"loginbox dark"}>
            <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} />
            <EnforceTwoFaViewForm />
        </div>
    );
};

export default EnforceTwoFaView;
