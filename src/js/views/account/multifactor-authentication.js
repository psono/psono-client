import React from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import { Grid } from "@material-ui/core";
import Divider from "@material-ui/core/Divider";

import store from "../../services/store";
import MultifactorAuthenticatorGoogleAuthenticator from "./multifactor-authentication-google-authenticator";
import MultifactorAuthenticatorYubikeyOtp from "./multifactor-authentication-yubikey-otp";
import MultifactorAuthenticatorWebauthn from "./multifactor-authentication-webauthn";
import MultifactorAuthenticatorDuo from "./multifactor-authentication-duo";
import deviceService from "../../services/device";
import browserClient from "../../services/browser-client";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
        [theme.breakpoints.up("md")]: {
            width: "440px",
        },
    },
}));

const MultifactorAuthenticationView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const [googleAuthenticatorOpen, setGoogleAuthenticatorOpen] = React.useState(false);
    const [yubikeyOtpOpen, setYubikeyOtpOpen] = React.useState(false);
    const [webauthnOpen, setWebauthnOpen] = React.useState(false);
    const [duoOpen, setDuoOpen] = React.useState(false);

    const closeModal = () => {
        setGoogleAuthenticatorOpen(false);
        setYubikeyOtpOpen(false);
        setDuoOpen(false);
        setWebauthnOpen(false);
    };

    const onConfigureGoogleAuthenticator = (event) => {
        setGoogleAuthenticatorOpen(true);
    };

    const onConfigureYubikeyOtp = (event) => {
        setYubikeyOtpOpen(true);
    };

    const onConfigureDuo = (event) => {
        setDuoOpen(true);
    };

    const onConfigureWebauthn = (event) => {
        setWebauthnOpen(true);
    };

    return (
        <>
            <Grid container>
                <Grid item xs={12} sm={12} md={12}>
                    <h2>{t("MULTIFACTOR_AUTHENTICATION")}</h2>
                    <p>{t("MULTIFACTOR_AUTHENTICATION_DESCRIPTION")}</p>
                    <Divider style={{ marginBottom: "20px" }} />
                </Grid>
            </Grid>

            {store.getState().server.allowedSecondFactors.indexOf("google_authenticator") !== -1 && (
                <Grid container style={{ marginBottom: "8px" }}>
                    <Grid item xs={6} sm={6} md={4} style={{ paddingTop: "8px" }}>
                        {t("GOOGLE_AUTHENTICATOR")}
                    </Grid>
                    <Grid item xs={6} sm={6} md={8}>
                        <Button variant="contained" color="primary" onClick={onConfigureGoogleAuthenticator}>
                            {t("CONFIGURE")}
                        </Button>
                    </Grid>
                    {googleAuthenticatorOpen && (
                        <MultifactorAuthenticatorGoogleAuthenticator
                            {...props}
                            open={googleAuthenticatorOpen}
                            onClose={closeModal}
                        />
                    )}
                </Grid>
            )}

            {store.getState().server.allowedSecondFactors.indexOf("yubikey_otp") !== -1 && (
                <Grid container style={{ marginBottom: "8px" }}>
                    <Grid item xs={6} sm={6} md={4} style={{ paddingTop: "8px" }}>
                        {t("YUBIKEY_OTP")}
                    </Grid>
                    <Grid item xs={6} sm={6} md={8}>
                        <Button variant="contained" color="primary" onClick={onConfigureYubikeyOtp}>
                            {t("CONFIGURE")}
                        </Button>
                    </Grid>
                    {yubikeyOtpOpen && (
                        <MultifactorAuthenticatorYubikeyOtp {...props} open={yubikeyOtpOpen} onClose={closeModal} />
                    )}
                </Grid>
            )}
            {browserClient.getClientType() !== "firefox_extension" && store.getState().server.allowedSecondFactors.indexOf("webauthn") !== -1 && (
                <Grid container style={{ marginBottom: "8px" }}>
                    <Grid item xs={6} sm={6} md={4} style={{ paddingTop: "8px" }}>
                        {t("FIDO2_WEBAUTHN")}
                    </Grid>
                    <Grid item xs={6} sm={6} md={8}>
                        <Button variant="contained" color="primary" onClick={onConfigureWebauthn}>
                            {t("CONFIGURE")}
                        </Button>
                    </Grid>
                    {webauthnOpen && (
                        <MultifactorAuthenticatorWebauthn {...props} open={webauthnOpen} onClose={closeModal} />
                    )}
                </Grid>
            )}

            {store.getState().server.allowedSecondFactors.indexOf("duo") !== -1 && (
                <Grid container style={{ marginBottom: "8px" }}>
                    <Grid item xs={6} sm={6} md={4} style={{ paddingTop: "8px" }}>
                        {t("DUO_PUSH_OR_CODE")}
                    </Grid>
                    <Grid item xs={6} sm={6} md={8}>
                        <Button variant="contained" color="primary" onClick={onConfigureDuo}>
                            {t("CONFIGURE")}
                        </Button>
                    </Grid>
                    {duoOpen && <MultifactorAuthenticatorDuo {...props} open={duoOpen} onClose={closeModal} />}
                </Grid>
            )}
        </>
    );
};

export default MultifactorAuthenticationView;
