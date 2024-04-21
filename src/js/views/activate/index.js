import React from "react";
import { useParams } from "react-router-dom";
import ActivationForm from "./activation-form";
import ConfigLogo from "../../components/config-logo";


const ActivateView = (props) => {
    let { activationCode } = useParams();

    return (
        <div className={"activationbox dark"}>
            <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'}/>
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true"/>
            </a>
            <ActivationForm activationCode={activationCode}/>
        </div>
    );
};

export default ActivateView;
