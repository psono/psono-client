import React from "react";
import { useTranslation } from "react-i18next";
import { Container, Grid, Box, Typography, Button, useMediaQuery } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { makeStyles } from '@mui/styles';
import GetAppIcon from '@mui/icons-material/GetApp';

import browserClient from "../../services/browser-client";
import deviceService from "../../services/device";

const useStyles = makeStyles((theme) => ({
    root: {
        textAlign: 'center',
        backgroundColor: '#0f1118',
        color: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflowY: 'auto',
    },
    successSection: {
        width: '100%',
        backgroundColor: '#1c1f26',
        borderBottom: '1px solid #333',
    },
    successContent: {
        padding: theme.spacing(10),
        maxWidth: 'md',
        margin: '0 auto',
        textAlign: 'center',
    },
    stepsSection: {
        padding: theme.spacing(4),
        backgroundColor: '#0f1118',
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
    },
    helpSection: {
        padding: theme.spacing(8),
        backgroundColor: '#1c1f26',
        textAlign: 'center',
        borderTop: '1px solid #333',
    },
    successIcon: {
        fontSize: 80,
        color: '#2dbb93',
    },
    subtitle: {
        color: '#b0b3b8',
    },
    image: {
        maxWidth: '100%',
        maxHeight: '25vh',
    },
    stepContainer: {
        textAlign: 'center',
    },
    helpButton: {
        marginTop: theme.spacing(2),
        color: '#ffffff',
        borderColor: '#ffffff',
    },
    downloadButton: {
        marginTop: theme.spacing(2),
        color: '#ffffff',
        backgroundColor: '#2dbb93',
    },
    downloadButtonImage: {
        width: '200px',
        marginTop: theme.spacing(2),
    },
}));

const ActivateSuccessfulView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const isLargeScreen = useMediaQuery(theme => theme.breakpoints.up('sm'));

    let hasInfo = false;
    let downloadExtensionOrApp = '';
    let tipHeader = "";
    let tipDescription = "";
    let downloadLink = "";
    let downloadButtonImage = "";

    if (browserClient.getClientType() === 'webclient') {
        if (deviceService.isMobile()) {
            if (deviceService.isMobileIos()) {
                hasInfo = true;
                tipHeader = t("TIP_DOWNLOAD_BROWSER_APP");
                tipDescription = t("TO_TAKE_YOUR_PASSWORDS_WHEREVER_YOU_GO_DOWNLOAD_THE_APP");
                downloadExtensionOrApp = 'img/store-ios.png';
                downloadLink = 'https://apps.apple.com/us/app/psono-password-manager/id1545581224';
                downloadButtonImage = 'img/ios-download.svg';
            } else if (deviceService.isMobileAndroid()) {
                hasInfo = true;
                tipHeader = t("TIP_DOWNLOAD_BROWSER_APP");
                tipDescription = t("TO_TAKE_YOUR_PASSWORDS_WHEREVER_YOU_GO_DOWNLOAD_THE_APP");
                downloadExtensionOrApp = 'img/store-android.png';
                downloadLink = 'https://play.google.com/store/apps/details?id=com.psono.psono';
                downloadButtonImage = 'img/android-download.svg';
            }
        } else {
            if (deviceService.isChrome()) {
                hasInfo = true;
                tipHeader = t("TIP_DOWNLOAD_BROWSER_EXTENSION");
                tipDescription = t("TO_IMPROVE_YOUR_EXPERIENCE_DOWNLOAD_THE_BROWSER_EXTENSION");
                downloadExtensionOrApp = 'img/store-chrome.png';
                downloadLink = 'https://chrome.google.com/webstore/detail/psonopw/eljmjmgjkbmpmfljlmklcfineebidmlo';
            } else if (deviceService.isEdge()) {
                hasInfo = true;
                tipHeader = t("TIP_DOWNLOAD_BROWSER_EXTENSION");
                tipDescription = t("TO_IMPROVE_YOUR_EXPERIENCE_DOWNLOAD_THE_BROWSER_EXTENSION");
                downloadExtensionOrApp = 'img/store-edge.png';
                downloadLink = 'https://microsoftedge.microsoft.com/addons/detail/psono-free-password-man/abobmepfpbkapdlmfhnnkebcnhgeccbm';
            } else if (deviceService.isFirefox()) {
                hasInfo = true;
                tipHeader = t("TIP_DOWNLOAD_BROWSER_EXTENSION");
                tipDescription = t("TO_IMPROVE_YOUR_EXPERIENCE_DOWNLOAD_THE_BROWSER_EXTENSION");
                downloadExtensionOrApp = 'img/store-firefox.png';
                downloadLink = 'https://addons.mozilla.org/firefox/addon/psono-pw-password-manager/';
            }
        }
    }

    const successContent = <Box className={classes.successContent}>
        <CheckCircleIcon className={classes.successIcon} />
        <Typography variant="h4" gutterBottom>
            {t("SUCCESSFULLY_ACTIVATED")}
        </Typography>
        <Typography variant="subtitle1" className={classes.subtitle}>
            {t("YOU_CAN_NOW_LOGIN_AND_START_USING_THE_APP")}
        </Typography>
        <Button
            variant="contained"
            color="primary"
            href="/login"
            style={{ marginTop: '20px' }}
        >
            {t("LOGIN")}
        </Button>
    </Box>;

    return (
        <Box className={classes.root}>
            {hasInfo && (<Box className={classes.successSection}>
                {successContent}
            </Box>)}
            <Container maxWidth="md" className={classes.stepsSection}>
                {!hasInfo && (
                    <Grid container justifyContent="center">
                        <Grid item xs={12}>
                            {successContent}
                        </Grid>
                    </Grid>
                )}

                {hasInfo && (<Grid container spacing={4} justifyContent="center">
                    {downloadExtensionOrApp && isLargeScreen && (
                        <Grid item xs={12} sm={12} className={classes.stepContainer}>
                            <img src={downloadExtensionOrApp} alt={t("TIP_DOWNLOAD_BROWSER_EXTENSION")}
                                 className={classes.image}/>
                        </Grid>
                    )}

                    <Grid item xs={12} sm={12} className={classes.stepContainer}>
                        <Typography variant="h6">
                            {tipHeader}
                        </Typography>
                        <Typography variant="body2" className={classes.subtitle}>
                            {tipDescription}
                        </Typography>
                        {downloadButtonImage ? (
                            <a
                                href={downloadLink}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img src={downloadButtonImage} alt="" className={classes.downloadButtonImage}/>
                            </a>
                        ) : (
                            <Button
                                variant="contained"
                                className={classes.downloadButton}
                                href={downloadLink}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {t("DOWNLOAD")}
                            </Button>
                        )}
                    </Grid>
                </Grid>)}
            </Container>

            {/* Ensure the help section remains visible at the bottom */}
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

export default ActivateSuccessfulView;
