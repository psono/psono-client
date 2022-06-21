import React from "react";
import { useParams } from "react-router-dom";
import ActivationForm from "./activation-form";


const ActivateView = (props) => {
    let { activationCode } = useParams();

    return (
        <div className={"activationbox dark"}>
            <img src="img/logo.png" alt="Psono Web Client" id="logo" />
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true" />
            </a>
            <ActivationForm activationCode={activationCode} />
        </div>
    );
};

export default ActivateView;
