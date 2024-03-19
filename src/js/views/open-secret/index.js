import React from "react";
import { useTranslation } from "react-i18next";
import secret from "../../services/secret";
import { useParams } from "react-router-dom";
import DialogUnlockOfflineCache from "../../components/dialogs/unlock-offline-cache";
import offlineCacheService from "../../services/offline-cache";

const OpenSecretView = (props) => {
    const { t } = useTranslation();
    const [percent, setPercentage] = React.useState(0);
    const [unlockOfflineCache, setUnlockOfflineCache] = React.useState(false);
    let { type, secretId } = useParams();

    React.useEffect(() => {
        if (offlineCacheService.isActive() && offlineCacheService.isLocked()) {
            setUnlockOfflineCache(true);
        } else {
            secret.redirectSecret(type, secretId).then((response) => {
                setPercentage(100);
            });
        }
    }, []);

    const onUnlockOfflineCacheClosed = () => {
        setUnlockOfflineCache(false);
        if (offlineCacheService.isActive() && offlineCacheService.isLocked()) {
            setUnlockOfflineCache(true);
        } else {
            secret.redirectSecret(type, secretId).then((response) => {
                setPercentage(100);
            });
        }
    };

    return (
        <div className="loading-lock">
            <img src="img/logo.png" alt="Psono Web Client" id="logo" />
            <div className="loading-lock-logo">
                <div className="loading-lock-logo-unloaded">
                    <i className="fa fa-lock" />
                </div>
                <div className="loading-lock-logo-loaded">
                    <i
                        style={{
                            width: percent + "%",
                            marginLeft: -200 + percent + "%",
                        }}
                        className="fa fa-lock"
                    />
                </div>
            </div>
            <div className="loading-lock-text">{t("DECRYPTING_SECRET")}</div>
            {unlockOfflineCache && (
                <DialogUnlockOfflineCache open={unlockOfflineCache} onClose={onUnlockOfflineCacheClosed} />
            )}
        </div>
    );
};

export default OpenSecretView;
