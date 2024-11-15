import React, {useState} from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@mui/styles";
import secret from "../../services/secret";
import { useParams } from "react-router-dom";
import DialogUnlockOfflineCache from "../../components/dialogs/unlock-offline-cache";
import offlineCacheService from "../../services/offline-cache";
import ConfigLogo from "../../components/config-logo";
import GridContainerErrors from "../../components/grid-container-errors";

const useStyles = makeStyles((theme) => ({
    loadingLock: {
        width: 340,
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
    },
    error: {
        paddingTop: 20,
    }
}));

const OpenSecretView = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const [percent, setPercentage] = React.useState(0);
    const [unlockOfflineCache, setUnlockOfflineCache] = React.useState(false);
    const [errors, setErrors] = useState([]);
    let { type, secretId } = useParams();

    React.useEffect(() => {
        redirect();
    }, []);

    const redirect = () => {

        if (offlineCacheService.isActive() && offlineCacheService.isLocked()) {
            setUnlockOfflineCache(true);
        } else {
            secret.redirectSecret(type, secretId).then(() => {
                setPercentage(100);
            }, (error) => {
                console.log(error)
                if (error.hasOwnProperty('non_field_errors')) {
                    setErrors(error.non_field_errors);
                }
            });
        }
    }

    const onUnlockOfflineCacheClosed = () => {
        setUnlockOfflineCache(false);
        redirect();
    };

    return (
        <div className={classes.loadingLock}>
            <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'}/>
            <a href="https://psono.com/" target="_blank" rel="noopener" className={classes.infolabel}>
                <i className="fa fa-info-circle" aria-hidden="true" />
            </a>
            {errors.length === 0 && (
                <>
                    <div className={classes.loadingLockLogo}>
                        <div className={classes.loadingLockLogoUnloaded}>
                            <i className="fa fa-lock"/>
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
                </>
            )}
            <div
                className={classes.error}
            >
                <GridContainerErrors errors={errors} setErrors={setErrors} />
            </div>

            {unlockOfflineCache && (
                <DialogUnlockOfflineCache open={unlockOfflineCache} onClose={onUnlockOfflineCacheClosed} />
            )}
        </div>
    );
};

export default OpenSecretView;
