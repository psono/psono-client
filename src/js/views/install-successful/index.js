import React from "react";
import {Container, Grid, Box, Typography, Button, useMediaQuery} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { makeStyles } from '@mui/styles';
import { useTranslation } from "react-i18next";
import deviceService from "../../services/device";

const useStyles = makeStyles((theme) => ({
    root: {
        textAlign: 'center',
        backgroundColor: theme.palette.background.default,
        color: theme.palette.common.white,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflowY: 'auto',  // Ensure vertical scrolling
    },
    successSection: {
        width: '100%',
        padding: theme.spacing(10),
        backgroundColor: '#1c1f26',
        borderBottom: '1px solid #333',
        textAlign: 'center',
    },
    successContent: {
        maxWidth: 'md',
        margin: '0 auto',
    },
    stepsSection: {
        padding: theme.spacing(4),
        backgroundColor: theme.palette.background.default,
    },
    helpSection: {
        padding: theme.spacing(8),
        backgroundColor: '#1c1f26',
        textAlign: 'center',
        borderTop: '1px solid #333',
    },
    successIcon: {
        fontSize: 80,
        color: theme.palette.primary.main,
    },
    subtitle: {
        color: '#b0b3b8',
    },
    image: {
        maxWidth: '100%',
    },
    stepContainer: {
        textAlign: 'center',
    },
    helpButton: {
        marginTop: theme.spacing(2),
        color: theme.palette.common.white,
        borderColor: theme.palette.common.white,
    },
}));

const InstallSuccessfulView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const isLargeScreen = useMediaQuery(theme => theme.breakpoints.up('sm'));

    let pinExtensionImage = 'img/pin-extension-chrome.png';
    let loginOrRegisterImage = 'img/login-or-register-chrome.png';
    if (deviceService.isFirefox()) {
        pinExtensionImage = 'img/pin-extension-firefox.png';
        loginOrRegisterImage = 'img/login-or-register-firefox.png';
    }

    return (
        <Box className={classes.root}>
            <Box className={classes.successSection}>
                <Box className={classes.successContent}>
                    <CheckCircleIcon className={classes.successIcon} />
                    <Typography variant="h4" gutterBottom>
                        {t("SUCCESS_ONLY_A_FEW_MORE_STEPS")}
                    </Typography>
                    <Typography variant="subtitle1" className={classes.subtitle}>
                        {t("YOU_HAVE_SUCCESSFULLY_INSTALLED_THE_EXTENSION_LETS_GET_EVERYTHING_SET_UP")}
                    </Typography>
                </Box>
            </Box>

            <Container maxWidth="md" className={classes.stepsSection}>
                <Grid container spacing={4}>
                    {isLargeScreen && (<Grid container item xs={12} spacing={4} justifyContent="center">
                        <Grid item xs={12} sm={6} className={classes.stepContainer}>
                            <img src={pinExtensionImage} alt={t("PIN_EXTENSION")} className={classes.image}/>
                        </Grid>
                        <Grid item xs={12} sm={6} className={classes.stepContainer}>
                            <img src={loginOrRegisterImage} alt={t("LOGIN_OR_REGISTER")} className={classes.image}/>
                        </Grid>
                    </Grid>)}

                    <Grid container item xs={12} spacing={4} justifyContent="center">
                        <Grid item xs={12} sm={6} className={classes.stepContainer}>
                            <Typography variant="h6">
                                {t("STEP_1_PIN_EXTENSION_T_BROWSER_TOOLBAR")}
                            </Typography>
                            <Typography variant="body2" className={classes.subtitle}>
                                {t("CLICK_PUZZLE_ICON_IN_BROWSER_TOOLBAR_AND_OIN_EXTENSION_TO_MAKE_IT_ACCESSIBLE")}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} className={classes.stepContainer}>
                            <Typography variant="h6">
                                {t("STEP_2_LOG_IN_OR_REGISTER_TO_START_USING_THE_EXTENSION")}
                            </Typography>
                            <Typography variant="body2" className={classes.subtitle}>
                                {t("CLICK_EXTENSION_ICON_AND_LOG_IN_OR_REGISTER_TO_ACTIVATE_YOUR_ACCOUNT")}
                            </Typography>
                        </Grid>
                    </Grid>
                </Grid>
            </Container>

            <Box className={classes.helpSection}>
                <Typography variant="h6">
                    {t("NEED_MORE_HELP_CHECK_OUR_DOCUMENTATION")}
                </Typography>
                <Button
                    variant="outlined"
                    className={classes.helpButton}
                    href="https://doc.psono.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {t("GO_TO_DOCUMENTATION")}
                </Button>
            </Box>
        </Box>
    );
};

export default InstallSuccessfulView;
