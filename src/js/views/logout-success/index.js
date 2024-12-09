import React, {useState} from "react";
import {useTranslation} from "react-i18next";

import {Grid} from "@mui/material";
import Button from "@mui/material/Button";
import {makeStyles} from "@mui/styles";

import GridContainerErrors from "../../components/grid-container-errors";
import user from "../../services/user";
import browserClientService from "../../services/browser-client";
import ConfigLogo from "../../components/config-logo";
import DarkBox from "../../components/dark-box";

const useStyles = makeStyles((theme) => ({
    button: {
        color: "white !important",
    },
    box: {
        width: '340px',
        padding: theme.spacing(2.5),
        position: 'absolute',
        top: '60%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        borderRadius: '4px',
        [theme.breakpoints.up('sm')]: {
            width: '540px',
        },
    },
}));

const LogoutSuccessView = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const [msgs, setMsgs] = useState(['LOGOUT_SUCCESSFUL']);

    React.useEffect(() => {
        user.logout();
    }, []);

    return (
        <DarkBox className={classes.box}>
            <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} height="100%"/>
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true"/>
            </a>
            <Grid container>
                <GridContainerErrors errors={msgs} setErrors={setMsgs} severity={"info"}/>
            </Grid>
            {browserClientService.getClientType() === 'webclient' && (<Grid item xs={6} sm={6} md={6} style={{marginTop: "5px", marginBottom: "5px"}}>
                <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    href={"index.html"}
                    className={classes.button}
                >
                    {t("BACK_TO_HOME")}
                </Button>
            </Grid>)}
        </DarkBox>
    );
};

export default LogoutSuccessView;
