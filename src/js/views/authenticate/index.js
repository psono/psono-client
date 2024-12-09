import React from "react";
import {useTranslation} from "react-i18next";

import {Grid} from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import Button from "@mui/material/Button";
import { makeStyles } from '@mui/styles';

import FooterLinks from "../../components/footer-links";
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
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        borderRadius: '4px',
        [theme.breakpoints.up('sm')]: {
            width: '540px',
        },
    },
}));
const AuthenticateView = (props) => {

    const classes = useStyles();
    const { t } = useTranslation();
    return (
        <DarkBox className={classes.box}>
            <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} height="100%"/>
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true"/>
            </a>
            <Grid container>
                <Grid item xs={12} sm={12} md={12} style={{textAlign: "center"}}>
                    <ThumbUpIcon style={{fontSize: 160}}/>
                </Grid>
                <Grid item xs={6} sm={6} md={6} style={{marginTop: "5px", marginBottom: "5px"}}>
                    <Button
                        variant="contained"
                        color="primary"
                        type="submit"
                        href={"index.html"}
                        className={classes.button}
                    >
                        {t("BACK_TO_HOME")}
                    </Button>
                </Grid>
            </Grid>
            <div className="box-footer">
                <FooterLinks/>
            </div>
        </DarkBox>
    );
};

export default AuthenticateView;
