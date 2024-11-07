import React, { useState } from "react";
import { Grid } from "@mui/material";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import GridContainerErrors from "../../components/grid-container-errors";
import MuiAlert from '@mui/material/Alert'
import userService from "../../services/user";
import { getStore } from "../../services/store";
import MultifactorAuthenticatorGoogleAuthenticator from "../account/multifactor-authentication-google-authenticator";
import MultifactorAuthenticatorYubikeyOtp from "../account/multifactor-authentication-yubikey-otp";
import MultifactorAuthenticatorDuo from "../account/multifactor-authentication-duo";
import FooterLinks from "../../components/footer-links";
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
        "& .MuiInputBase-root": {
            color: theme.palette.lightGreyText.main,
        },
        "& .MuiInputAdornment-root .MuiTypography-colorTextSecondary": {
            color: theme.palette.greyText.main,
        },
        "& MuiFormControl-root": {
            color: theme.palette.lightGreyText.main,
        },
        "& label": {
            color: theme.palette.lightGreyText.main,
        },
        "& .MuiInput-underline:after": {
            borderBottomColor: "green",
        },
        "& .MuiOutlinedInput-root": {
            "& fieldset": {
                borderColor: theme.palette.greyText.main,
            },
        },
    },
    button: {
        color: "white !important",
    },
    regularButtonText: {
        color: theme.palette.lightGreyText.main,
    },
}));

const EnforceTwoFaViewForm = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();

    const hasTwoFactor = useSelector((state) => state.user.hasTwoFactor);
    const [googleAuthenticatorOpen, setGoogleAuthenticatorOpen] = React.useState(false);
    const [yubikeyOtpOpen, setYubikeyOtpOpen] = React.useState(false);
    const [duoOpen, setDuoOpen] = React.useState(false);
    const [errors, setErrors] = useState([]);

    const closeModal = () => {
        setGoogleAuthenticatorOpen(false);
        setYubikeyOtpOpen(false);
        setDuoOpen(false);
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

    const logout = () => {
        window.location.href = 'logout-success.html';
    };

    if (hasTwoFactor) {
        setTimeout(function () {
            // Timeout required, otherwise hasTwoFactor is not persisted
            window.location.href = "index.html";
        }, 1);
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
            }}
            name="enforce2FaForm"
            autoComplete="off"
        >
            <Grid container>
                {getStore().getState().server.allowedSecondFactors.indexOf("google_authenticator") !== -1 && (
                    <Grid container style={{ marginBottom: "8px" }}>
                        <Grid item xs={6} sm={6} md={4} style={{ paddingTop: "8px" }}>
                            {t("TOTP")}
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
                <Grid item xs={12} sm={12} md={12}>
                    <MuiAlert
                        severity="info"
                        style={{
                            marginBottom: "5px",
                            marginTop: "5px",
                        }}
                    >
                        {t("ADMINISTRATOR_REQUIRES_SECOND_FACTOR")}
                    </MuiAlert>
                </Grid>
            </Grid>
            <Grid container>
                <Grid item xs={6} sm={6} md={6} style={{ marginTop: "5px", marginBottom: "5px" }}>
                    <Button
                        onClick={logout}
                        type="submit"
                    >
                        <span className={classes.regularButtonText}>{t("LOGOUT")}</span>
                    </Button>
                </Grid>
            </Grid>
            <GridContainerErrors errors={errors} setErrors={setErrors} />
            <div className="box-footer">
                <FooterLinks />
            </div>
        </form>
    );
};

export default EnforceTwoFaViewForm;
