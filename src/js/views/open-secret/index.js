import React from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@mui/styles";
import secret from "../../services/secret";
import { useParams } from "react-router-dom";
import DialogUnlockOfflineCache from "../../components/dialogs/unlock-offline-cache";
import offlineCacheService from "../../services/offline-cache";
import ConfigLogo from "../../components/config-logo";

const useStyles = makeStyles((theme) => ({
    loadingLock: {
        width: 340,
        height: 260,
        padding: 20,
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -70,
        marginLeft: -170,
        borderRadius: 4,
        backgroundColor: theme.palette.blueBackground.main,
        color: theme.palette.lightGreyText.main,
        textAlign: "center",
    },
    loadingLockLogo: {
        fontSize: 90,
        position: "relative",
        height: 130,
    },
    loadingLockLogoUnloaded: {
        color: theme.palette.background.default,
        position: "absolute",
        top: 0,
        marginLeft: "50%",
        "& i": {
            marginLeft: "-100%",
            overflow: "hidden",
        },
    },
    loadingLockLogoLoaded: {
        color: theme.palette.primary.main,
        position: "absolute",
        top: 0,
        marginLeft: "50%",
        "& i": {
            overflow: "hidden",
        },
    },
    loadingLockText: {
        marginTop: 20,
    },
    infolabel: {
        position: "absolute",
        top: 10,
        right: 10,
        color: theme.palette.lightGreyText.main,
        textDecoration: "none",
    }
}));

const OpenSecretView = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const [percent, setPercentage] = React.useState(0);
    const [unlockOfflineCache, setUnlockOfflineCache] = React.useState(false);
    let { type, secretId } = useParams();

    React.useEffect(() => {
        if (offlineCacheService.isActive() && offlineCacheService.isLocked()) {
            setUnlockOfflineCache(true);
        } else {
            secret.redirectSecret(type, secretId).then(() => {
                setPercentage(100);
            });
        }
    }, []);

    const onUnlockOfflineCacheClosed = () => {
        setUnlockOfflineCache(false);
        if (offlineCacheService.isActive() && offlineCacheService.isLocked()) {
            setUnlockOfflineCache(true);
        } else {
            secret.redirectSecret(type, secretId).then(() => {
                setPercentage(100);
            });
        }
    };

    return (
        <div className={classes.loadingLock}>
            <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'}/>
            <a href="https://psono.com/" target="_blank" rel="noopener" className={classes.infolabel}>
                <i className="fa fa-info-circle" aria-hidden="true" />
            </a>
            <div className={classes.loadingLockLogo}>
                <div className={classes.loadingLockLogoUnloaded}>
                    <i className="fa fa-lock" />
                </div>
                <div className={classes.loadingLockLogoLoaded}>
                    <i
                        style={{
                            width: `${percent}%`,
                            marginLeft: `${-200 + percent}%`,
                        }}
                        className="fa fa-lock"
                    />
                </div>
            </div>
            <div className={classes.loadingLockText}>{t("DECRYPTING_SECRET")}</div>
            {unlockOfflineCache && (
                <DialogUnlockOfflineCache open={unlockOfflineCache} onClose={onUnlockOfflineCacheClosed} />
            )}
        </div>
    );
};

export default OpenSecretView;
