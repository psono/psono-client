import React from "react";
import {Trans, useTranslation} from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import { Grid } from "@material-ui/core";
import Divider from "@material-ui/core/Divider";

import { getStore } from "../../services/store";
import MultifactorAuthenticatorGoogleAuthenticator from "./multifactor-authentication-google-authenticator";
import MultifactorAuthenticatorYubikeyOtp from "./multifactor-authentication-yubikey-otp";
import MultifactorAuthenticatorWebauthn from "./multifactor-authentication-webauthn";
import MultifactorAuthenticatorDuo from "./multifactor-authentication-duo";
import MultifactorAuthenticatorIvalt from "./multifactor-authentication-ivalt";
import deviceService from "../../services/device";
import browserClient from "../../services/browser-client";
import userService from "../../services/user";
import { useSelector } from "react-redux";

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
    const [ivaltOpen, setIvaltOpen] = React.useState(false);
    const { ivaltSecret } = useSelector(store => store.server)

    const closeModal = () => {
        setGoogleAuthenticatorOpen(false);
        setYubikeyOtpOpen(false);
        setDuoOpen(false);
        setWebauthnOpen(false);
        setIvaltOpen(false)
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

    const onConfigureIvalt = async (event) => {
        setIvaltOpen(true);

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

            {getStore().getState().server.allowedSecondFactors.indexOf("google_authenticator") !== -1 && (
                <Grid container style={{ marginBottom: "8px" }}>
                    <Grid item xs={6} sm={6} md={4} style={{ paddingTop: "8px" }}>
                        {/*{t("TOTP_LIKE_QUANT_GA_MS", {'quant_authenticator': '<a href="https://google.com">Quant</a>'})}*/}
                        <Trans i18nKey="TOTP_LIKE_QUANT_GA_MS">
                            TOTP (like <a target={"_blank"} href={"https://quantauth.app/app/"}>Quant</a>, Google or Microsoft Authenticator)
                        </Trans>
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

            {getStore().getState().server.allowedSecondFactors.indexOf("yubikey_otp") !== -1 && (
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
            {browserClient.getClientType() !== "firefox_extension" && !deviceService.isElectron() && getStore().getState().server.allowedSecondFactors.indexOf("webauthn") !== -1 && (
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

            {getStore().getState().server.allowedSecondFactors.indexOf("duo") !== -1 && (
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

            {getStore().getState().server.allowedSecondFactors.indexOf("ivalt") !== -1 && (


                <Grid container style={{ marginBottom: "8px" }}>
                    <Grid item xs={6} sm={6} md={4} style={{ paddingTop: "8px" }}>
                        iVALT
                    </Grid>
                    <Grid item xs={6} sm={6} md={8}>
                        <Button variant="contained" color="primary" onClick={onConfigureIvalt}>
                            {t("CONFIGURE")}
                        </Button>
                    </Grid>
                    {ivaltOpen && <MultifactorAuthenticatorIvalt {...props} open={ivaltOpen} onClose={closeModal} />}
                </Grid>
            )}
        </>
    );
};

export default MultifactorAuthenticationView;
