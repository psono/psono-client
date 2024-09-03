import React from "react";
import { useParams } from "react-router-dom";

import { makeStyles } from '@mui/styles';
import { Grid, useMediaQuery, Typography, ListItemIcon, Link } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import RegisterViewForm from "./register-form";
import FrameControls from "../../components/frame-controls";
import ConfigLogo from "../../components/config-logo";
import {useTranslation} from "react-i18next";


const useStyles = makeStyles((theme) => ({
    leftSection: {
        backgroundColor: '#151f2b',
        paddingLeft: "30%",
        paddingRight: "10%",
        position: 'relative',
        height: '100vh',
        textAlign: 'center',
        '&:before': {
            content: '""',
            height: '100%',
            display: 'inline-block',
            verticalAlign: 'middle',
        },
    },
    rightSection: {
        paddingLeft: "0%",
        paddingRight: "0%",
        "@media(min-width:1500px)": {
            paddingRight: "5%",
        },
        "@media(min-width:2000px)": {
            paddingRight: "10%",
        },
    },
    title: {
        color: '#ffffff',
        textAlign: 'left',
    },
    rightContent: {
        padding: theme.spacing(4),
        position: 'relative',
        height: '100vh',
    },
    featureList: {
        marginTop: theme.spacing(4),
        listStyleType: "none",
        paddingLeft: 0,
        "& li": {
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#1f2d3a',
            padding: theme.spacing(1),
            "@media(min-width:2000px)": {
                padding: theme.spacing(2),
            },
            borderRadius: theme.shape.borderRadius,
            marginBottom: theme.spacing(1),
            color: '#ffffff',
            boxShadow: '0 3px 5px rgba(0, 0, 0, 0.2)',
            "&:hover": {
                backgroundColor: '#243447',
            },
            "& svg": {
                marginRight: theme.spacing(2),
                color: theme.palette.primary.main,
            },
        },
    },
    image: {
        width: "100%",
        maxHeight: "250px",
        marginBottom: theme.spacing(2),
    },
    container: {
        height: '100vh',
        textAlign: 'center',
        position: 'relative',
        '&:before': {
            content: '""',
            height: '100%',
            display: 'inline-block',
            verticalAlign: 'middle',
        },
    },
    leftContent: {
        display: 'inline-block',
        verticalAlign: 'middle',
        margin: 0,
        padding: 0,
        listStyleType: 'none',
    },
    moreFeatures: {
        marginTop: theme.spacing(4),
        textAlign: 'center',
        "& a": {
            color: theme.palette.primary.main,
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
            "&:hover": {
                textDecoration: 'underline',
            },
            "& svg": {
                marginLeft: theme.spacing(1),
            },
        },
    },
}));

const RegisterView = (props) => {
    const { t } = useTranslation();
    let { samlTokenId, oidcTokenId } = useParams();
    const isLargeScreen = useMediaQuery(theme => theme.breakpoints.up('lg'));
    const classes = useStyles();

    const registerForm =
        <div className={"registerbox dark"}>
            <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} height="100%"/>
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true"/>
            </a>
            <RegisterViewForm samlTokenId={samlTokenId} oidcTokenId={oidcTokenId}/>
        </div>

    if (!isLargeScreen) {
        return registerForm;
    }

    return (
        <>
            <FrameControls/>
            <Grid container>
                <Grid item md={6}>
                    <div className={classes.leftSection}>
                        <div className={classes.leftContent}>
                            <img src="img/banner-image.png" alt="Banner Image" className={classes.image}/>
                            <div className={classes.title}>
                                <Typography variant="body1">
                                    {t("REGISTER_AND_GAIN_ACCESS_TO_THE_FOLLOWING_FEATURES_FOR_FREE")}
                                </Typography>
                            </div>
                            <ul className={classes.featureList}>
                                <li>
                                    <ListItemIcon>
                                        <CheckCircleIcon/>
                                    </ListItemIcon>
                                    <Typography variant="body1">{t("FEATURE_ENCRYPTED_PASSWORD_VAULT")}</Typography>
                                </li>
                                <li>
                                    <ListItemIcon>
                                        <CheckCircleIcon/>
                                    </ListItemIcon>
                                    <Typography variant="body1">{t("FEATURE_ACCESS_ACROSS_ALL_DEVICES")}</Typography>
                                </li>
                                <li>
                                    <ListItemIcon>
                                        <CheckCircleIcon/>
                                    </ListItemIcon>
                                    <Typography variant="body1">{t("FEATURE_SECURE_SHARING")}</Typography>
                                </li>
                                <li>
                                    <ListItemIcon>
                                        <CheckCircleIcon/>
                                    </ListItemIcon>
                                    <Typography variant="body1">{t("FEATURE_PASSWORD_GENERATOR")}</Typography>
                                </li>
                                <li>
                                    <ListItemIcon>
                                        <CheckCircleIcon/>
                                    </ListItemIcon>
                                    <Typography variant="body1">{t("FEATURE_AUTOFILL_OF_FORMS")}</Typography>
                                </li>
                                <li>
                                    <ListItemIcon>
                                        <CheckCircleIcon/>
                                    </ListItemIcon>
                                    <Typography variant="body1">{t("FEATURE_MULTIFACTOR_AUTHENTICATION")}</Typography>
                                </li>
                            </ul>
                            <div className={classes.moreFeatures}>
                                <Typography variant="body1">
                                    <Link href={t("https://psono.com/features-for-users")} target="_blank"
                                          rel="noopener">
                                        {t("AND_MANY_MORE_FEATURES")}
                                        <OpenInNewIcon/>
                                    </Link>
                                </Typography>
                            </div>
                        </div>
                    </div>
                </Grid>
                <Grid item xs={12} md={6} className={classes.rightSection}>
                    <div className={classes.rightContent}>
                        {registerForm}
                    </div>
                </Grid>
            </Grid>
        </>
    );
};

export default RegisterView;
