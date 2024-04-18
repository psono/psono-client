import React from "react";
import LostPasswordViewForm from "./lost-password-form";
import { useParams } from "react-router-dom";
import FrameControls from "../../components/frame-controls";
import ConfigLogo from "../../components/config-logo";

const LostPasswordView = (props) => {
    let { samlTokenId, oidcTokenId } = useParams();
    return (<>
            <FrameControls />
            <div className={"lostpasswordbox dark"}>
                <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} />
                <LostPasswordViewForm samlTokenId={samlTokenId} oidcTokenId={oidcTokenId} />
            </div>
        </>
    );
};

export default LostPasswordView;
