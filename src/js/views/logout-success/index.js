import React, {useState} from "react";
import {Grid} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import {makeStyles} from "@material-ui/core/styles";
import {useTranslation} from "react-i18next";
import GridContainerErrors from "../../components/grid-container-errors";
import userService from "../../services/user";
import ConfigLogo from "../../components/config-logo";


const useStyles = makeStyles((theme) => ({
    disabledButton: {
        backgroundColor: "rgba(45, 187, 147, 0.50) !important",
    },
}));

const LogoutSuccessView = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const [msgs, setMsgs] = useState(['LOGOUT_SUCCESSFUL']);

    React.useEffect(() => {
        userService.logout();
    }, []);

    return (
        <div className={"logoutsuccessbox dark"}>
            <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} />
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true" />
            </a>
            <Grid container>
                <GridContainerErrors errors={msgs} setErrors={setMsgs} severity={"info"} />
            </Grid>
        </div>
    );
};

export default LogoutSuccessView;
