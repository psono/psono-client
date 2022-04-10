import React, { useState } from "react";
import { Grid } from "@material-ui/core";
import { withStyles } from "@material-ui/styles";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import ThumbUpIcon from "@material-ui/icons/ThumbUp";
import MuiAlert from "@material-ui/lab/Alert";
import { useTranslation } from "react-i18next";
import Button from "@material-ui/core/Button";
import browserClient from "../../services/browser-client";
import helperService from "../../services/helper";
import host from "../../services/host";
import GridContainerErrors from "../../components/grid-container-errors";
import action from "../../actions/bound-action-creators";
import userService from "../../services/user";

const styles = (theme) => ({
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
    disabledButton: {
        backgroundColor: "rgba(45, 187, 147, 0.50) !important",
    },
    button: {
        color: "white !important",
    },
});

const RegisterForm = (props) => {
    const { classes } = props;
    const { t } = useTranslation();

    const [view, setView] = useState("default");
    const [username, setUsername] = useState(props.state.user.username);
    const [email, setEmail] = useState(props.state.user.username);
    const [server, setServer] = useState(props.state.server.url);
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

    const cancel = (e) => {
        setView("default");
        setErrors([]);
    };

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
        action.setServerUrl(server);

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

                let fullUsername = helperService.formFullUsername(username, domain || parsedUrl["full_domain"]);

                test_result = helperService.isValidUsername(fullUsername);
                if (test_result) {
                    setErrors([test_result]);
                    return;
                }

                userService.register(email, fullUsername, password, server).then(onRequestReturn, onError);
            },
            function (data) {
                console.log(data);
                // handle server is offline
                setErrors(["SERVER_OFFLINE"]);
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
                                margin="dense"
                                id="username"
                                label={t("USERNAME")}
                                InputProps={{
                                    endAdornment:
                                        domain && !username.includes("@") ? (
                                            <InputAdornment position="end">{"@" + domain}</InputAdornment>
                                        ) : null,
                                }}
                                name="username"
                                autoComplete="username"
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
                                margin="dense"
                                id="email"
                                type="email"
                                label={t("EMAIL")}
                                name="email"
                                autoComplete="email"
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
                                margin="dense"
                                id="password"
                                label={t("PASSWORD")}
                                InputProps={{
                                    type: "password",
                                }}
                                name="password"
                                autoComplete="password"
                                value={password}
                                onChange={(event) => {
                                    setPassword(event.target.value);
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="passwordRepeat"
                                label={t("PASSWORD_REPEAT")}
                                InputProps={{
                                    type: "password",
                                }}
                                name="passwordRepeat"
                                autoComplete="passwordRepeat"
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
                            <Button href={"index.html"}>
                                <span style={{ color: "#b1b6c1" }}>{t("ABORT")}</span>
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
                                margin="dense"
                                id="server"
                                label={t("SERVER")}
                                name="server"
                                autoComplete="server"
                                value={server}
                                onChange={(event) => {
                                    setServer(event.target.value);
                                    setDomain(helperService.getDomain(event.target.value));
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
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        browserClient.openTab("privacy-policy.html");
                    }}
                >
                    {t("PRIVACY_POLICY")}
                </a>
            </div>
        </form>
    );
};

export default withStyles(styles)(RegisterForm);
