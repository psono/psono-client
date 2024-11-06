import React, { useState } from "react";
import { Grid } from "@mui/material";
import { makeStyles } from '@mui/styles';
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import MuiAlert from '@mui/material/Alert'
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import browserClient from "../../services/browser-client";
import helperService from "../../services/helper";
import host from "../../services/host";
import GridContainerErrors from "../../components/grid-container-errors";
import action from "../../actions/bound-action-creators";
import userService from "../../services/user";
import { getStore } from "../../services/store";
import FooterLinks from "../../components/footer-links";
import cryptoLibrary from "../../services/crypto-library";

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
    passwordComplexityWrapper: {
        "& .MuiLinearProgress-colorPrimary": {
            backgroundColor: theme.palette.blueBackground.main,
        },
    },
    disabledButton: {
        backgroundColor: "rgba(45, 187, 147, 0.50) !important",
    },
    button: {
        color: "white !important",
    },
    inputAdornment: {
        color: theme.palette.lightGreyText.main,
    },
    regularButtonText: {
        color: theme.palette.lightGreyText.main,
    },
}));

const RegisterForm = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();

    const [view, setView] = useState("default");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [server, setServer] = useState(getStore().getState().server.url);
    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");
    const [domain, setDomain] = useState("");
    const [errors, setErrors] = useState([]);
    const [msgs, setMsgs] = useState([]);
    const [allowRegistration, setAllowRegistration] = useState(false);
    const [allowCustomServer, setAllowCustomServer] = useState(true);

    let isSubscribed = true;
    React.useEffect(() => {
        browserClient.getConfig().then(onNewConfigLoaded);
        return () => (isSubscribed = false);
    }, []);

    const onNewConfigLoaded = (configJson) => {
        if (!isSubscribed) {
            return;
        }
        const serverUrl = configJson["backend_servers"][0]["url"];
        const domain = configJson["backend_servers"][0]["domain"];
        const allowRegistration =
            !configJson.hasOwnProperty("allow_registration") ||
            (configJson.hasOwnProperty("allow_registration") && configJson["allow_registration"]);
        const allowCustomServer = configJson.allow_custom_server;

        setAllowRegistration(allowRegistration);
        setServer(serverUrl);
        setDomain(domain);
        setAllowCustomServer(allowCustomServer);
    };

    const register = () => {
        setErrors([]);
        setMsgs([]);

        let test_result;

        function onError() {
            alert("Error, should not happen.");
        }

        function onRequestReturn(data) {
            if (data.response === "success") {
                setView("success");
                setMsgs(["SUCCESSFUL_CHECK_EMAIL"]);
            } else {
                // handle server is offline
                if (data.error_data === null) {
                    setErrors(["SERVER_OFFLINE"]);
                    return;
                }

                // server is not offline and returned some errors
                let _errors = [];
                for (let property in data.error_data) {
                    if (!data.error_data.hasOwnProperty(property)) {
                        continue;
                    }
                    for (let i = 0; i < data.error_data[property].length; i++) {
                        _errors.push(data.error_data[property][i]);
                    }
                }
                setErrors(_errors);
            }
        }
        action().setServerUrl(server);

        host.info().then(
            function (info) {
                let test_error = helperService.isValidPassword(
                    password,
                    passwordRepeat,
                    info.data["decoded_info"]["compliance_min_master_password_length"],
                    info.data["decoded_info"]["compliance_min_master_password_complexity"]
                );

                if (test_error) {
                    setErrors([test_error]);
                    return;
                }

                test_result = helperService.isValidEmail(email);
                if (test_result !== true) {
                    setErrors(["INVALID_EMAIL_FORMAT"]);
                    return;
                }
                let parsedUrl = helperService.parseUrl(server);

                let fullUsername = helperService.formFullUsername(username, domain || parsedUrl["full_domain_without_www"]);

                test_result = helperService.isValidUsername(fullUsername);
                if (test_result) {
                    setErrors([test_result]);
                    return;
                }

                userService.register(email, fullUsername, password, server).then(onRequestReturn, onError);
            },
            function (result) {
                if (result.hasOwnProperty("errors")) {
                    let errors = result.errors;
                    setErrors(errors);
                } else if (typeof (result) === 'object') {
                    console.log(result);
                    setErrors(["RECEIVED_MALFORMED_RESPONSE"]);
                } else {
                    console.log(result);
                    setErrors([result]);
                }
            }
        );
    };

    let formContent;

    if (view === "default") {
        formContent = (
            <>
                {!allowRegistration && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <MuiAlert
                                severity="info"
                                style={{
                                    marginBottom: "5px",
                                    marginTop: "5px",
                                }}
                            >
                                {t("REGISTRATION_HAS_BEEN_DISABLED")}
                            </MuiAlert>
                        </Grid>
                        <Grid item xs={6} sm={6} md={6} style={{ marginTop: "5px", marginBottom: "5px" }}>
                            <Button
                                variant="contained"
                                color="primary"
                                type="submit"
                                href={"index.html"}
                                className={classes.button}
                            >
                                {t("BACK_TO_HOME")}
                            </Button>
                        </Grid>
                    </Grid>
                )}
                {allowRegistration && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
                                id="username"
                                label={t("USERNAME")}
                                InputProps={{
                                    endAdornment:
                                        domain && !username.includes("@") ? (
                                            <InputAdornment position="end"><span className={classes.inputAdornment}>{"@" + domain}</span></InputAdornment>
                                        ) : null,
                                }}
                                name="username"
                                autoComplete="off"
                                value={username}
                                onChange={(event) => {
                                    setUsername(event.target.value);
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
                                id="email"
                                type="email"
                                label={t("EMAIL")}
                                name="email"
                                autoComplete="off"
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value);
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
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
                            <div className={classes.passwordComplexityWrapper}><LinearProgress variant="determinate" value={cryptoLibrary.calculatePasswordStrengthInPercent(password)} classes={{colorPrimary: classes.colorPrimary, barColorPrimary: classes.barColorPrimary}} /></div>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
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
                    </Grid>
                )}

                {allowRegistration && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                            <Button
                                variant="contained"
                                color="primary"
                                classes={{ disabled: classes.disabledButton }}
                                onClick={register}
                                type="submit"
                                disabled={
                                    !username || !email || !password || !passwordRepeat || password !== passwordRepeat
                                }
                            >
                                {t("REGISTER")}
                            </Button>
                            <Button
                                href={"index.html"}
                            >
                                <span className={classes.regularButtonText}>{t("ABORT")}</span>
                            </Button>
                        </Grid>
                    </Grid>
                )}
                <GridContainerErrors errors={errors} setErrors={setErrors} />
                {allowCustomServer && allowRegistration && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
                                id="server"
                                label={t("SERVER")}
                                name="server"
                                autoComplete="off"
                                value={server}
                                onChange={(event) => {
                                    setServer(event.target.value.trim());
                                    setDomain(helperService.getDomainWithoutWww(event.target.value.trim()));
                                }}
                            />
                        </Grid>
                    </Grid>
                )}
            </>
        );
    }

    if (view === "success") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ textAlign: "center" }}>
                        <ThumbUpIcon style={{ fontSize: 160 }} />
                    </Grid>
                    <GridContainerErrors errors={msgs} setErrors={setMsgs} severity={"info"} />
                    <Grid item xs={6} sm={6} md={6} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            type="submit"
                            href={"index.html"}
                            className={classes.button}
                        >
                            {t("BACK_TO_HOME")}
                        </Button>
                    </Grid>
                </Grid>
            </>
        );
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
            }}
            name="registerForm"
            autoComplete="off"
        >
            {formContent}
            <div className="box-footer">
                <FooterLinks />
            </div>
        </form>
    );
};

export default RegisterForm;
