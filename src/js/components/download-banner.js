import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { makeStyles } from '@mui/styles';

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
        backgroundColor: theme.palette.primary.main,
        overflowY: "hidden",
        transition: "0.5s",
        "& a": {
            padding: "8px",
            textDecoration: "none",
            display: "block",
            transition: "0.3s",
        },
        "& a:hover": {
            color: theme.palette.lightBackground.main,
        },
        "& a:focus": {
            color: theme.palette.lightBackground.main,
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
    downloadIcon: {
        marginLeft: "5px",
    },
}));

const DownloadBanner = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const [disableDownloadBanner, setDisableDownloadBanner] = useState(false);
    const isDownloadBannerHidden = useSelector((state) => state.client.hideDownloadBanner);
    const showAndroidDownload = deviceService.isMobileAndroid();
    const showIosDownload = deviceService.isMobileIos();
    const showChromeDownload =
        !deviceService.isMobile() && deviceService.isChrome() && browserClient.getClientType() === "webclient";
    const showEdgeDownload =
        !deviceService.isMobile() && deviceService.isEdge() && browserClient.getClientType() === "webclient";
    const showFirefoxDownload =
        !deviceService.isMobile() && deviceService.isFirefox() && browserClient.getClientType() === "webclient";

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
        action().setHideDownloadBanner(true);
        event.preventDefault();
    };

    let downloadUrl = '';
    if (showAndroidDownload) {
        downloadUrl = 'https://play.google.com/store/apps/details?id=com.psono.psono';
    } else if (showIosDownload) {
        downloadUrl = 'https://apps.apple.com/us/app/psono-password-manager/id1545581224';
    } else if (showChromeDownload) {
        downloadUrl = 'https://chrome.google.com/webstore/detail/psono-free-password-manag/eljmjmgjkbmpmfljlmklcfineebidmlo';
    } else if (showEdgeDownload) {
        downloadUrl = 'https://microsoftedge.microsoft.com/addons/detail/psono-free-password-man/abobmepfpbkapdlmfhnnkebcnhgeccbm';
    } else if (showFirefoxDownload) {
        downloadUrl = 'https://addons.mozilla.org/firefox/addon/psono-pw-password-manager';
    }

    return (
        <div id="PsonoDownloadBanner">
            {!disableDownloadBanner && !isDownloadBannerHidden && downloadUrl && (
                <div className={classes.overlay}>
                    <a href="#" className={classes.closeBtn} onClick={hideDownloadBanner}>
                        <i className="fa fa-times" aria-hidden="true"/>
                    </a>
                    <div className={classes.overlayContent}>
                        <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener"
                        >
                            {t("DOWNLOAD_PSONO")}
                            <span className={classes.downloadIcon}>
                                <i className="fa fa-download" aria-hidden="true"/>
                            </span>
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DownloadBanner;
