import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {ClipLoader} from "react-spinners";

import { Grid } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import {makeStyles, useTheme} from "@material-ui/core/styles";
import MuiAlert from "@material-ui/lab/Alert";

import GridContainerErrors from "../../components/grid-container-errors";
import FooterLinks from "../../components/footer-links";
import userService from "../../services/user";
import { getStore } from "../../services/store";
import ButtonDanger from "../../components/button-danger";
import serverSecretService from "../../services/server-secret";
import TextField from "@material-ui/core/TextField";
import LinearProgress from "@material-ui/core/LinearProgress";
import cryptoLibrary from "../../services/crypto-library";
import helperService from "../../services/helper";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
        "& .MuiInputBase-root": {
            color: "#b1b6c1",
        },
        "& .MuiInputAdornment-root .MuiTypography-colorTextSecondary": {
            color: "#666",
        },
        "& MuiFormControl-root": {
            color: "#b1b6c1",
        },
        "& label": {
            color: "#b1b6c1",
        },
        "& .MuiInput-underline:after": {
            borderBottomColor: "green",
        },
        "& .MuiOutlinedInput-root": {
            "& fieldset": {
                borderColor: "#666",
            },
        },
    },
    passwordComplexityWrapper: {
        "& .MuiLinearProgress-colorPrimary": {
            backgroundColor: "#151f2b",
        },
    },
    disabledButton: {
        backgroundColor: "rgba(45, 187, 147, 0.50) !important",
    },
    button: {
        color: "white !important",
    },
    loader: {
        textAlign: "center",
        marginTop: "20px",
        marginBottom: "20px",
        margin: "auto",
    },
}));

const KeyTransferForm = (props) => {
    const classes = useStyles();
    const theme = useTheme();
    const { t } = useTranslation();

    const serverSecretExists = useSelector((state) => state.user.serverSecretExists);
    const [errors, setErrors] = useState([]);
    const [view, setView] = useState("default");
    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");

    const logout = () => {
        window.location.href = 'logout-success.html';
    };

    if (userService.requireServerSecret() === serverSecretExists) {
        setTimeout(function () {
            // Timeout required, otherwise hasTwoFactor is not persisted
            window.location.href = "index.html";
        }, 1);
    }

    const approveCreation = async () => {
        setView('loading');

        await serverSecretService.createServerSecret();

        // loading screen can stay as we will redirect the user
        // setView('default');
    }

    const approveDeletion = async () => {
        let testError = helperService.isValidPassword(
            password,
            passwordRepeat,
            getStore().getState().server.complianceMinMasterPasswordLength,
            getStore().getState().server.complianceMinMasterPasswordComplexity,
        );

        if (testError) {
            setErrors([testError]);
            return;
        }
        setView('loading');

        await serverSecretService.deleteServerSecret(password);

        // loading screen can stay as we will redirect the user
        // setView('default');
    }

    if (view === 'loading') {
        return (
            <div className={classes.root}>
                <div className={classes.loader}>
                    <ClipLoader color={theme.palette.primary.main}/>
                </div>
            </div>)
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
            }}
            name="serverSecretsForm"
            autoComplete="off"
        >
            <Grid container>
                <Grid item xs={12} sm={12} md={12}>
                    <MuiAlert
                        severity="info"
                        style={{
                            marginBottom: "5px",
                            marginTop: "5px",
                        }}
                    >
                        {serverSecretExists ? t("ADMINISTRATOR_REQUIRES_ACCOUNT_SWITCH_TO_CLIENT_SIDE_ENCRYPTION") : t("ADMINISTRATOR_REQUIRES_ACCOUNT_SWITCH_TO_SERVER_SIDE_ENCRYPTION")}
                    </MuiAlert>
                </Grid>
                {serverSecretExists && <>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="password"
                            label={t("PASSWORD")}
                            InputProps={{
                                type: "password",
                            }}
                            name="password"
                            autoComplete="off"
                            value={password}
                            onChange={(event) => {
                                setPassword(event.target.value);
                            }}
                        />
                        <div className={classes.passwordComplexityWrapper}><LinearProgress variant="determinate"
                                                                                           value={cryptoLibrary.calculatePasswordStrengthInPercent(password)}
                                                                                           classes={{
                                                                                               colorPrimary: classes.colorPrimary,
                                                                                               barColorPrimary: classes.barColorPrimary
                                                                                           }}/></div>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="passwordRepeat"
                            label={t("PASSWORD_REPEAT")}
                            error={password && passwordRepeat && passwordRepeat !== password}
                            InputProps={{
                                type: "password",
                            }}
                            name="passwordRepeat"
                            autoComplete="off"
                            value={passwordRepeat}
                            onChange={(event) => {
                                setPasswordRepeat(event.target.value);
                            }}
                        />
                    </Grid>
                </>}
            </Grid>
            <Grid container>
                <Grid item xs={6} sm={6} md={6} style={{ marginTop: "5px", marginBottom: "5px" }}>
                    {serverSecretExists && <Button
                        variant="contained"
                        color="primary"
                        onClick={approveDeletion}
                        disabled={
                            !password || !passwordRepeat || password !== passwordRepeat
                        }
                        type="submit"
                        style={{marginRight: "10px"}}
                    >
                        {t("APPROVE")}
                    </Button>}

                    {!serverSecretExists && <ButtonDanger
                        onClick={approveCreation}
                        style={{marginRight: "10px"}}
                        autoFocus
                    >
                        {t("APPROVE")}
                    </ButtonDanger>}
                    <Button
                        variant="contained"
                        classes={{ disabled: classes.disabledButton }}
                        onClick={logout}
                        type="submit"
                    >
                        {t("LOGOUT")}
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

export default KeyTransferForm;
