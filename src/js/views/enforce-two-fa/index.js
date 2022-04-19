import React from "react";
import EnforceTwoFaViewForm from "./enforce-two-fa-form";

const EnforceTwoFaView = (props) => {
    return (
        <div className={"loginbox dark"}>
            <img src="img/logo.png" alt="Psono Web Client" id="logo" />
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true" />
            </a>
            <EnforceTwoFaViewForm />
        </div>
    );
};

export default EnforceTwoFaView;
