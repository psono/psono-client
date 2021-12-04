import React from "react";
import { useTranslation } from "react-i18next";
import secret from "../../services/secret";
import { useParams } from "react-router-dom";

const OpenSecretView = (props) => {
    const { t } = useTranslation();
    const [percent, setPercentage] = React.useState(0);
    let { type, secretId } = useParams();

    React.useEffect(() => {
        secret.redirectSecret(type, secretId).then((response) => {
            setPercentage(100);
        });
    }, []);

    // $rootScope.$on("cfpLoadingBar:loading", function () {
    //     setPercentage(20);
    // });
    //
    // $rootScope.$on("cfpLoadingBar:loaded", function (status) {
    //     setPercentage(80);
    // });
    //
    // $rootScope.$on("cfpLoadingBar:completed", function () {
    //     setPercentage(100);
    // });

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
        </div>
    );
};

export default OpenSecretView;
