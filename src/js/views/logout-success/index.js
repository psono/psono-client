import React, {useState} from "react";
import {Grid} from "@mui/material";
import {useTranslation} from "react-i18next";
import GridContainerErrors from "../../components/grid-container-errors";
import user from "../../services/user";
import ConfigLogo from "../../components/config-logo";


const LogoutSuccessView = (props) => {
    const [msgs, setMsgs] = useState(['LOGOUT_SUCCESSFUL']);

    React.useEffect(() => {
        user.logout();
    }, []);

    return (
        <div className={"logoutsuccessbox dark"}>
            <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} height="100%"/>
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true"/>
            </a>
            <Grid container>
                <GridContainerErrors errors={msgs} setErrors={setMsgs} severity={"info"}/>
            </Grid>
        </div>
    );
};

export default LogoutSuccessView;
