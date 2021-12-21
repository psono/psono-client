import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import GetAppIcon from "@material-ui/icons/GetApp";

import browserClient from "../services/browser-client";
import deviceService from "../services/device";
import action from "../actions/bound-action-creators";

const useStyles = makeStyles((theme) => ({
    overlay: {
        width: "100%",
        position: "fixed",
        zIndex: 1400,
        top: 0,
        left: 0,
        backgroundColor: "#2dbb93",
        overflowY: "hidden",
        transition: "0.5s",
        "& a": {
            padding: "8px",
            textDecoration: "none",
            display: "block",
            transition: "0.3s",
        },
        "& a:hover": {
            color: "#fff",
        },
        "& a:focus": {
            color: "#fff",
        },
    },
    overlayContent: {
        position: "relative",
        width: "90%",
        textAlign: "center",
        paddingLeft: "5%",
    },
    closeBtn: {
        position: "absolute",
        top: 0,
        right: "5px",
    },
    wrapIcon: {
        verticalAlign: "middle",
        display: "inline-flex",
    },
    downloadIcon: {
        fontSize: "1.2rem",
    },
}));

const DownloadBanner = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const [disableDownloadBanner, setDisableDownloadBanner] = useState(false);
    const isDownloadBannerHidden = useSelector((state) => state.client.hideDownloadBanner);
    const showAndroidDownload = deviceService.isMobileAndroid();
    const showIosDownload = deviceService.isMobileIos();
    const showChromeDownload = !deviceService.isMobile() && deviceService.isChrome() && browserClient.getClientType() === "webclient";
    const showFirefoxDownload = !deviceService.isMobile() && deviceService.isFirefox() && browserClient.getClientType() === "webclient";

    React.useEffect(() => {
        browserClient.getConfig().then(onNewConfigLoaded);
        // cancel subscription to useEffect
        return () => (isSubscribed = false);
    }, []);

    let isSubscribed = true;
    const onNewConfigLoaded = (configJson) => {
        if (!isSubscribed) {
            return;
        }
        setDisableDownloadBanner(Boolean(configJson["disable_download_bar"]));
    };

    const hideDownloadBanner = (event) => {
        action.setHideDownloadBanner(true);
    };

    return (
        <div id="PsonoDownloadBanner">
            {!disableDownloadBanner && !isDownloadBannerHidden && showAndroidDownload && (
                <div className={classes.overlay}>
                    <a href="#" className={classes.closeBtn} onClick={hideDownloadBanner}>
                        <i className="fa fa-times" aria-hidden="true" />
                    </a>
                    <div className={classes.overlayContent}>
                        <a href="https://play.google.com/store/apps/details?id=com.psono.psono" target="_blank" rel="noopener">
                            {t("DOWNLOAD_PSONO")}
                            <i className="fa fa-download" aria-hidden="true" />
                        </a>
                    </div>
                </div>
            )}
            {!disableDownloadBanner && !isDownloadBannerHidden && showIosDownload && (
                <div className={classes.overlay}>
                    <a href="#" className={classes.closeBtn} onClick={hideDownloadBanner}>
                        <i className="fa fa-times" aria-hidden="true" />
                    </a>
                    <div className={classes.overlayContent}>
                        <a href="https://apps.apple.com/us/app/psono-password-manager/id1545581224" target="_blank" rel="noopener">
                            {t("DOWNLOAD_PSONO")}
                            <i className="fa fa-download" aria-hidden="true" />
                        </a>
                    </div>
                </div>
            )}
            {!disableDownloadBanner && !isDownloadBannerHidden && showChromeDownload && (
                <div className={classes.overlay}>
                    <a href="#" className={classes.closeBtn} onClick={hideDownloadBanner}>
                        <i className="fa fa-times" aria-hidden="true" />
                    </a>
                    <div className={classes.overlayContent}>
                        <a
                            href="https://chrome.google.com/webstore/detail/psono-free-password-manag/eljmjmgjkbmpmfljlmklcfineebidmlo"
                            target="_blank"
                            rel="noopener"
                        >
                            <Typography variant="body2" className={classes.wrapIcon}>
                                {t("DOWNLOAD_PSONO")} <GetAppIcon className={classes.downloadIcon} />
                            </Typography>
                        </a>
                    </div>
                </div>
            )}
            {!disableDownloadBanner && !isDownloadBannerHidden && showFirefoxDownload && (
                <div className={classes.overlay}>
                    <a href="#" className={classes.closeBtn} onClick={hideDownloadBanner}>
                        <i className="fa fa-times" aria-hidden="true" />
                    </a>
                    <div className={classes.overlayContent}>
                        <a href="https://addons.mozilla.org/de/firefox/addon/psono-pw-password-manager/" target="_blank" rel="noopener">
                            {t("DOWNLOAD_PSONO")}
                            <i className="fa fa-download" aria-hidden="true" />
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DownloadBanner;
