import React, { useState } from "react";
import { Grid, Checkbox } from "@material-ui/core";
import { withStyles } from "@material-ui/styles";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import { Check } from "@material-ui/icons";
import MuiAlert from "@material-ui/lab/Alert";
import { useTranslation } from "react-i18next";
import Button from "@material-ui/core/Button";
import { BarLoader } from "react-spinners";
import { useHistory } from "react-router-dom";
import browserClient from "../../services/browser-client";
import helperService from "../../services/helper";
import user from "../../services/user";
import host from "../../services/host";
import store from "../../services/store";
import action from "../../actions/bound-action-creators";
import GridContainerErrors from "../../components/grid-container-errors";

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
    checked: {
        color: "#9c27b0",
    },
    checkedIcon: {
        width: "20px",
        height: "20px",
        border: "1px solid #666",
        borderRadius: "3px",
    },
    uncheckedIcon: {
        width: "0px",
        height: "0px",
        padding: "9px",
        border: "1px solid #666",
        borderRadius: "3px",
    },
});

const LoginViewForm = (props) => {
    const { classes } = props;
    const { t } = useTranslation();
    const history = useHistory();

    const [view, setView] = useState("default");
    const [username, setUsername] = useState(props.state.user.username);
    const [password, setPassword] = useState("");
    const [server, setServer] = useState(props.state.server.url);
    const [rememberMe, setRememberMe] = useState(false);
    const [providerId, setProviderId] = useState(0);
    const [trustDevice, setTrustDevice] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginPossible, setLoginPossible] = useState(false);
    const [domain, setDomain] = useState("");
    const [gaToken, setGaToken] = useState("");
    const [yubikeyOtpToken, setYubikeyOtpToken] = useState("");
    const [duoToken, setDuoToken] = useState("");
    const [errors, setErrors] = useState([]);
    const [multifactors, setMultifactors] = useState([]);
    const [allowRegistration, setAllowRegistration] = useState(false);
    const [loginType, setLoginType] = useState("");
    const [allowLostPassword, setAllowLostPassword] = useState(false);
    const [authkeyEnabled, setAuthkeyEnabled] = useState(false);
    const [ldapEnabled, setLdapEnabled] = useState(false);
    const [samlEnabled, setSamlEnabled] = useState(false);
    const [oidcEnabled, setOidcEnabled] = useState(false);
    const [serverCheck, setServerCheck] = useState({});
    const [samlProvider, setSamlProvider] = useState([]);
    const [oidcProvider, setOidcProvider] = useState([]);
    const [authenticationMethods, setAuthenticationMethods] = useState([]);
    const [allowCustomServer, setAllowCustomServer] = useState(true);
    const [allowUsernamePasswordLogin, setAllowUsernamePasswordLogin] = useState(true);

    React.useEffect(() => {
        if (props.samlTokenId) {
            user.samlLogin(props.samlTokenId).then(
                (requiredMultifactors) => {
                    console.log(requiredMultifactors);
                    setMultifactors(requiredMultifactors);
                    requirementCheckMfa(requiredMultifactors);
                },
                (errors) => {
                    setErrors(errors);
                }
            );
        }
        if (props.oidcTokenId) {
            user.oidcLogin(props.oidcTokenId).then(
                (requiredMultifactors) => {
                    console.log(requiredMultifactors);
                    setMultifactors(requiredMultifactors);
                    requirementCheckMfa(requiredMultifactors);
                },
                (errors) => {
                    setErrors(errors);
                }
            );
        }
        browserClient.getConfig().then(onNewConfigLoaded);
    }, []);

    const hasLdapAuth = (serverCheck) => {
        return (
            serverCheck.hasOwnProperty("info") &&
            serverCheck["info"].hasOwnProperty("authentication_methods") &&
            serverCheck["info"]["authentication_methods"].indexOf("LDAP") !== -1
        );
    };

    const verifyDuo = () => {
        let duoCode = duoToken;
        if (duoCode === "") {
            duoCode = undefined;
        }

        user.duoVerify(duoCode).then(
            () => {
                let requiredMultifactors = multifactors;
                if (store.getState().server.multifactorEnabled) {
                    helperService.removeFromArray(requiredMultifactors, "duo_2fa");
                } else {
                    requiredMultifactors = [];
                }

                setMultifactors(requiredMultifactors);
                requirementCheckMfa(requiredMultifactors);
            },
            (errors) => {
                setErrors(errors);
            }
        );
    };

    const showGa2faForm = () => {
        console.log("google_authenticator");
        setView("google_authenticator");
        setLoginLoading(false);
    };

    const showYubikeyOtp2faForm = () => {
        console.log("yubikey_otp");
        setView("yubikey_otp");
        setLoginLoading(false);
    };

    const showDuo2faForm = () => {
        console.log("duo");
        setView("duo");
        setLoginLoading(false);
        verifyDuo();
    };

    const handleMfa = (multifactors) => {
        if (store.getState().server.multifactorEnabled === false && multifactors.length > 1) {
            // show choose multifactor screen as only one is required to be solved
            setView("pick_second_factor");
            setLoginLoading(false);
        } else if (multifactors.indexOf("yubikey_otp_2fa") !== -1) {
            showYubikeyOtp2faForm();
        } else if (multifactors.indexOf("google_authenticator_2fa") !== -1) {
            showGa2faForm();
        } else if (multifactors.indexOf("duo_2fa") !== -1) {
            showDuo2faForm();
        } else {
            setView("default");
            setLoginLoading(false);
            setErrors(["Unknown multi-factor authentication requested by server."]);
            logout();
        }
    };

    const requirementCheckMfa = (multifactors) => {
        if (multifactors.length === 0) {
            user.activateToken().then(() => {
                //setLoginLoading(false);
            });
        } else {
            setLoginLoading(false);
            handleMfa(multifactors);
        }
    };

    const approveNewServer = () => {
        return approveHost();
    };

    const disapproveNewServer = () => {
        setView("default");
        setLoginLoading(false);
        setPassword("");
        setErrors([]);
    };

    const approveHost = () => {
        host.approveHost(serverCheck.server_url, serverCheck.verify_key);

        if (loginType === "SAML") {
            initiateSamlLogin(providerId);
        } else if (loginType === "OIDC") {
            initiateOidcLogin(providerId);
        } else if (loginType === "LOAD_REMOTE_CONFIG") {
            const onError = function (data) {
                console.log(data);
            };

            const onSuccess = function () {
                const onError = function (data) {
                    console.log(data);
                };

                browserClient.getConfig().then(onNewConfigLoaded, onError);
            };
            setView("default");
            host.loadRemoteConfig(serverCheck["info"]["web_client"], serverCheck["server_url"]).then(onSuccess, onError);
        } else {
            const userPassword = password;
            setPassword("");

            user.login(userPassword, serverCheck).then(
                (requiredMultifactors) => {
                    setMultifactors(requiredMultifactors);
                    requirementCheckMfa(requiredMultifactors);
                },
                (result) => {
                    setLoginLoading(false);
                    if (result.hasOwnProperty("non_field_errors")) {
                        let errors = result.non_field_errors;
                        setErrors(errors);
                    } else {
                        console.log(result);
                        setErrors([result]);
                    }
                }
            );
        }
    };

    const gaVerify = (e) => {
        const onError = function (errors) {
            setErrors(errors);
        };

        const onSuccess = function () {
            let requiredMultifactors = multifactors;
            if (store.getState().server.multifactorEnabled) {
                helperService.removeFromArray(requiredMultifactors, "google_authenticator_2fa");
            } else {
                requiredMultifactors = [];
            }
            setMultifactors(requiredMultifactors);
            requirementCheckMfa(requiredMultifactors);
        };
        user.gaVerify(gaToken).then(onSuccess, onError);
    };

    const yubikeyOtpVerify = (e) => {
        const onError = function (errors) {
            setErrors(errors);
        };

        const onSuccess = function () {
            let requiredMultifactors = multifactors;
            if (store.getState().server.multifactorEnabled) {
                helperService.removeFromArray(requiredMultifactors, "yubikey_otp_2fa");
            } else {
                requiredMultifactors = [];
            }
            setMultifactors(requiredMultifactors);
            requirementCheckMfa(requiredMultifactors);
        };
        user.yubikeyOtpVerify(yubikeyOtpToken).then(onSuccess, onError);
    };

    const duoVerify = (e) => {
        let duoCode = duoToken;
        if (duoCode === "") {
            duoCode = undefined;
        }
        const onError = function (errors) {
            setErrors(errors);
        };

        const onSuccess = function () {
            let requiredMultifactors = multifactors;
            if (store.getState().server.multifactorEnabled) {
                helperService.removeFromArray(requiredMultifactors, "duo_2fa");
            } else {
                requiredMultifactors = [];
            }
            setMultifactors(requiredMultifactors);
            requirementCheckMfa(requiredMultifactors);
        };
        user.duoVerify(duoCode).then(onSuccess, onError);
    };

    const cancel = (e) => {
        setView("default");
        setPassword("");
        setErrors([]);
    };

    const nextLoginStep = (sendPlain) => {
        let userPassword = password;
        setPassword("");

        return user.login(userPassword, serverCheck, sendPlain).then(
            (requiredMultifactors) => {
                setMultifactors(requiredMultifactors);
                requirementCheckMfa(requiredMultifactors);
            },
            (result) => {
                setLoginLoading(false);
                if (result.hasOwnProperty("non_field_errors")) {
                    const errors = result.non_field_errors;
                    setView("default");
                    setErrors(errors);
                } else {
                    console.log(result);
                    setView("default");
                    setErrors([result]);
                }
            }
        );
    };

    const disapproveSendPlain = () => {
        return nextLoginStep(false);
    };
    const approveSendPlain = () => {
        return nextLoginStep(true);
    };

    const onNewConfigLoaded = (configJson) => {
        const serverUrl = configJson["backend_servers"][0]["url"];
        const allowRegistration =
            !configJson.hasOwnProperty("allow_registration") || (configJson.hasOwnProperty("allow_registration") && configJson["allow_registration"]);
        const allowLostPassword =
            (!configJson.hasOwnProperty("allow_lost_password") || (configJson.hasOwnProperty("allow_lost_password") && configJson["allow_lost_password"])) &&
            configJson["authentication_methods"].indexOf("AUTHKEY") !== -1;
        const samlProvider = configJson.saml_provider || [];
        const oidcProvider = configJson.oidc_provider || [];
        const authenticationMethods = configJson.authentication_methods || [];
        const allowCustomServer = configJson.allow_custom_server;
        const allowUsernamePasswordLogin = authenticationMethods.includes("AUTHKEY") || authenticationMethods.includes("LDAP");
        const authkeyEnabled = configJson["authentication_methods"].indexOf("AUTHKEY") !== -1;
        const ldapEnabled = configJson["authentication_methods"].indexOf("LDAP") !== -1;
        const samlEnabled = configJson["authentication_methods"].indexOf("SAML") !== -1;
        const oidcEnabled = configJson["authentication_methods"].indexOf("OIDC") !== -1;

        setAllowLostPassword(allowLostPassword);
        setAllowRegistration(allowRegistration);
        setServer(serverUrl);
        setDomain(helperService.getDomain(serverUrl));
        setSamlProvider(samlProvider);
        setOidcProvider(oidcProvider);
        setAuthenticationMethods(authenticationMethods);
        setAllowCustomServer(allowCustomServer);
        setAllowUsernamePasswordLogin(allowUsernamePasswordLogin);
        setAuthkeyEnabled(authkeyEnabled);
        setLdapEnabled(ldapEnabled);
        setSamlEnabled(samlEnabled);
        setOidcEnabled(oidcEnabled);
    };

    const remoteConfig = (e) => {
        action.setServerUrl(server);
        setErrors([]);

        const onError = function (error) {
            console.log(error);
            setErrors(["SERVER_OFFLINE"]);
        };

        const onSuccess = function (serverCheck) {
            setServerCheck(serverCheck);
            action.setServerInfo(serverCheck.info, serverCheck.verify_key);

            if (serverCheck.status !== "matched") {
                setView(serverCheck.status);
                setLoginType("LOAD_REMOTE_CONFIG");
                return;
            }

            const onError = function (data) {
                console.log(data);
            };

            const onSuccess = function () {
                const onError = function (data) {
                    console.log(data);
                };

                browserClient.getConfig().then(onNewConfigLoaded, onError);
            };
            setView("default");
            host.loadRemoteConfig(serverCheck["info"]["web_client"], serverCheck["server_url"]).then(onSuccess, onError);
        };
        host.checkHost(server).then(onSuccess, onError);
    };

    const initiateOidcLogin = (providerId) => {};

    const initiateSamlLogin = (providerId) => {
        setLoginLoading(true);
        setLoginType("SAML");
        setErrors([]);
        setProviderId(providerId);
        return user
            .initiateSamlLogin(server, rememberMe, trustDevice, true)
            .then(
                (serverCheck) => {
                    setServerCheck(serverCheck);
                    action.setServerInfo(serverCheck.info, serverCheck.verify_key);
                    if (serverCheck.status !== "matched") {
                        setView(serverCheck.status);
                    } else {
                        user.getSamlRedirectUrl(providerId).then((result) => {
                            window.location = result.saml_redirect_url;
                        });
                    }
                },
                (result) => {
                    if (result.hasOwnProperty("errors")) {
                        let errors = result.errors;
                        setLoginLoading(false);
                        setErrors(errors);
                    } else {
                        setLoginLoading(false);
                        setErrors([result]);
                    }
                }
            )
            .catch((result) => {
                setLoginLoading(false);
                return Promise.reject(result);
            });
    };

    const initiateLogin = () => {
        setLoginLoading(true);
        setLoginType("");
        setErrors([]);
        return user
            .initiateLogin(username, server, rememberMe, trustDevice, true)
            .then(
                (serverCheck) => {
                    setServerCheck(serverCheck);
                    action.setServerInfo(serverCheck.info, serverCheck.verify_key);
                    if (serverCheck.status !== "matched") {
                        setView(serverCheck.status);
                    } else if (hasLdapAuth(serverCheck)) {
                        console.log("ask_send_plain");
                        setView("ask_send_plain");
                        setLoginLoading(false);
                    } else {
                        return nextLoginStep(false);
                    }
                },
                (result) => {
                    if (result.hasOwnProperty("errors")) {
                        setLoginLoading(false);
                        setErrors(result.errors);
                    } else {
                        console.log(result);
                        setLoginLoading(false);
                        setErrors([result]);
                    }
                }
            )
            .catch((result) => {
                setLoginLoading(false);
                console.log(result);
                // return Promise.reject(result);
            });
    };
    const redirectRegister = () => {
        history.push("register.html");
    };

    let formContent;

    if (view === "default") {
        formContent = (
            <>
                {oidcProvider.map((provider, i) => {
                    const initiateOidcLoginHelper = () => {
                        return initiateOidcLogin(provider.provider_id);
                    };
                    return (
                        <Grid container key={i}>
                            <Grid item xs={12} sm={12} md={12} style={{ marginTop: "10px" }}>
                                {provider.title}
                            </Grid>
                            <Grid item xs={12} sm={12} md={12} style={{ marginTop: "10px" }}>
                                <Button variant="contained" color="primary" onClick={initiateOidcLoginHelper} type="submit" id="sad">
                                    <span
                                        style={
                                            !loginLoading
                                                ? {}
                                                : {
                                                      display: "none",
                                                  }
                                        }
                                    >
                                        {provider.button_name}
                                    </span>
                                    <BarLoader color={"#FFF"} height={17} width={37} loading={loginLoading} />
                                </Button>
                            </Grid>
                        </Grid>
                    );
                })}
                {oidcEnabled && oidcProvider.length > 0 && (samlEnabled || authkeyEnabled || ldapEnabled) && (
                    <p className="horizontalline">
                        <span>{t("OR")}</span>
                    </p>
                )}
                {samlProvider.map((provider, i) => {
                    const initiateSamlLoginHelper = () => {
                        return initiateSamlLogin(provider.provider_id);
                    };
                    return (
                        <Grid container key={i}>
                            <Grid item xs={12} sm={12} md={12} style={{ marginTop: "10px" }}>
                                {provider.title}
                            </Grid>
                            <Grid item xs={12} sm={12} md={12} style={{ marginTop: "10px" }}>
                                <Button variant="contained" color="primary" onClick={initiateSamlLoginHelper} type="submit" id="sad">
                                    <span
                                        style={
                                            !loginLoading
                                                ? {}
                                                : {
                                                      display: "none",
                                                  }
                                        }
                                    >
                                        {provider.button_name}
                                    </span>
                                    <BarLoader color={"#FFF"} height={17} width={37} loading={loginLoading} />
                                </Button>
                            </Grid>
                        </Grid>
                    );
                })}
                {samlEnabled && samlProvider.length > 0 && (authkeyEnabled || ldapEnabled) && (
                    <p className="horizontalline">
                        <span>{t("OR")}</span>
                    </p>
                )}
                {allowUsernamePasswordLogin && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="username"
                                label={t("USERNAME")}
                                InputProps={{
                                    endAdornment: domain && !username.includes("@") ? <InputAdornment position="end">{"@" + domain}</InputAdornment> : null,
                                }}
                                name="username"
                                autoComplete="username"
                                value={username}
                                onChange={(event) => {
                                    setUsername(event.target.value);
                                    setLoginPossible(!!event.target.value && !!password);
                                }}
                            />
                        </Grid>
                    </Grid>
                )}
                {allowUsernamePasswordLogin && (
                    <Grid container>
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
                                    setLoginPossible(!!username && !!event.target.value);
                                }}
                            />
                        </Grid>
                    </Grid>
                )}

                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <Checkbox
                            tabIndex={1}
                            checked={rememberMe}
                            onChange={(event) => {
                                setRememberMe(event.target.checked);
                            }}
                            checkedIcon={<Check className={classes.checkedIcon} />}
                            icon={<Check className={classes.uncheckedIcon} />}
                            classes={{
                                checked: classes.checked,
                            }}
                        />{" "}
                        {t("REMEMBER_USERNAME_AND_SERVER")}
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <Checkbox
                            tabIndex={1}
                            checked={trustDevice}
                            onChange={(event) => {
                                setTrustDevice(event.target.checked);
                            }}
                            checkedIcon={<Check className={classes.checkedIcon} />}
                            icon={<Check className={classes.uncheckedIcon} />}
                            classes={{
                                checked: classes.checked,
                            }}
                        />{" "}
                        {t("TRUST_DEVICE")}
                    </Grid>
                </Grid>
                {allowUsernamePasswordLogin && (
                    <Grid container>
                        <Grid item xs={4} sm={4} md={4} style={{ marginTop: "5px", marginBottom: "5px" }}>
                            <Button
                                variant="contained"
                                color="primary"
                                classes={{ disabled: classes.disabledButton }}
                                onClick={initiateLogin}
                                type="submit"
                                disabled={!loginPossible || loginLoading}
                            >
                                <span style={!loginLoading ? {} : { display: "none" }}>{t("LOGIN")}</span>
                                <BarLoader color={"#FFF"} height={17} width={37} loading={loginLoading} />
                            </Button>
                            {allowRegistration && (
                                <Button onClick={redirectRegister}>
                                    <span style={{ color: "#b1b6c1" }}>{t("REGISTER")}</span>
                                </Button>
                            )}
                        </Grid>
                    </Grid>
                )}
                <GridContainerErrors errors={errors} setErrors={setErrors} />
                {allowCustomServer && (
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

    if (view === "new_server") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <h4>{t("NEW_SERVER")}</h4>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="server_fingerprint"
                            label={t("FINGERPRINT_OF_THE_NEW_SERVER")}
                            InputProps={{
                                multiline: true,
                            }}
                            name="server_fingerprint"
                            autoComplete="server_fingerprint"
                            value={serverCheck.verify_key}
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <MuiAlert
                            severity="info"
                            style={{
                                marginBottom: "5px",
                                marginTop: "5px",
                            }}
                        >
                            {t("IT_APPEARS_THAT_YOU_WANT_TO_CONNECT")}
                        </MuiAlert>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button variant="contained" color="primary" onClick={approveHost} type="submit" style={{ marginRight: "10px" }}>
                            {t("APPROVE")}
                        </Button>
                        <Button variant="contained" onClick={cancel}>
                            {t("CANCEL")}
                        </Button>
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
            </>
        );
    }

    if (view === "signature_changed") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <h4>{t("SERVER_SIGNATURE_CHANGED")}</h4>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="server_fingerprint"
                            label={t("FINGERPRINT_OF_THE_NEW_SERVER")}
                            InputProps={{
                                multiline: true,
                            }}
                            name="server_fingerprint"
                            autoComplete="server_fingerprint"
                            value={serverCheck.verify_key}
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="oldserver_fingerprint"
                            label={t("FINGERPRINT_OF_THE_OLD_SERVER")}
                            InputProps={{
                                multiline: true,
                            }}
                            name="oldserver_fingerprint"
                            autoComplete="oldserver_fingerprint"
                            value={serverCheck.verify_key_old}
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <MuiAlert
                            severity="warning"
                            style={{
                                marginBottom: "5px",
                                marginTop: "5px",
                            }}
                        >
                            {t("THE_SIGNATURE_OF_THE_SERVER_CHANGED")}
                            <br />
                            <br />
                            <strong>{t("CONTACT_THE_OWNER_OF_THE_SERVER")}</strong>
                        </MuiAlert>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button variant="contained" color="primary" onClick={disapproveNewServer} type="submit" style={{ marginRight: "10px" }}>
                            {t("CANCEL")}
                        </Button>
                        <Button variant="contained" onClick={approveNewServer}>
                            {t("IGNORE_AND_CONTINUE")}
                        </Button>
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
            </>
        );
    }

    if (view === "ask_send_plain") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <p>{t("SERVER_ASKS_FOR_YOUR_PLAINTEXT_PASSWORD")}</p>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <MuiAlert
                            severity="warning"
                            style={{
                                marginBottom: "5px",
                                marginTop: "5px",
                            }}
                        >
                            {t("ACCEPTING_THIS_WILL_SEND_YOUR_PLAIN_PASSWORD")}
                        </MuiAlert>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button variant="contained" color="primary" onClick={approveSendPlain} type="submit" style={{ marginRight: "10px" }}>
                            {t("APPROVE_UNSAFE")}
                        </Button>
                        <Button variant="contained" onClick={disapproveSendPlain}>
                            {t("DECLINE_SAFE")}
                        </Button>
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
            </>
        );
    }

    if (view === "google_authenticator") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <p>{t("ENTER_YOUR_GOOGLE_AUTHENTICATOR_CODE")}</p>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="gaToken"
                            label={t("GOOGLE_AUTHENTICATOR_CODE")}
                            name="gaToken"
                            autoComplete="gaToken"
                            required
                            value={gaToken}
                            onChange={(event) => {
                                setGaToken(event.target.value);
                            }}
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={gaVerify}
                            type="submit"
                            style={{ marginRight: "10px" }}
                            disabled={!gaToken || gaToken.length < 6}
                            classes={{ disabled: classes.disabledButton }}
                        >
                            {t("SEND")}
                        </Button>
                        <Button variant="contained" onClick={cancel}>
                            {t("CANCEL")}
                        </Button>
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
            </>
        );
    }

    if (view === "yubikey_otp") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <p>{t("ENTER_YOUR_YUBIKEY_OTP_TOKEN")}</p>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="yubikeyOtpToken"
                            label={t("YUBIKEY_TOKEN")}
                            name="yubikeyOtpToken"
                            autoComplete="yubikeyOtpToken"
                            required
                            value={yubikeyOtpToken}
                            onChange={(event) => {
                                setYubikeyOtpToken(event.target.value);
                            }}
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={yubikeyOtpVerify}
                            type="submit"
                            style={{ marginRight: "10px" }}
                            disabled={!yubikeyOtpToken || yubikeyOtpToken.length < 6}
                            classes={{ disabled: classes.disabledButton }}
                        >
                            {t("SEND")}
                        </Button>
                        <Button variant="contained" onClick={cancel}>
                            {t("CANCEL")}
                        </Button>
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
            </>
        );
    }

    if (view === "duo") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <p>{t("APPROVE_THE_PUSH_NOTIFICATION")}</p>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="duoToken"
                            label={t("DUO_CODE")}
                            name="duoToken"
                            autoComplete="duoToken"
                            required
                            value={duoToken}
                            onChange={(event) => {
                                setDuoToken(event.target.value);
                            }}
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={duoVerify}
                            type="submit"
                            style={{ marginRight: "10px" }}
                            disabled={!duoToken || duoToken.length < 6}
                            classes={{ disabled: classes.disabledButton }}
                        >
                            {t("SEND")}
                        </Button>
                        <Button variant="contained" onClick={cancel}>
                            {t("CANCEL")}
                        </Button>
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
            </>
        );
    }

    if (view === "pick_second_factor") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <p>{t("PICK_SECOND_FACTOR")}</p>
                    </Grid>
                </Grid>
                {multifactors.indexOf("google_authenticator_2fa") !== -1 && (
                    <Grid container style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Grid item xs={12} sm={12} md={12}>
                            <Button variant="contained" color="primary" onClick={showGa2faForm} type="submit">
                                {t("GOOGLE_AUTHENTICATOR")}
                            </Button>
                        </Grid>
                    </Grid>
                )}
                {multifactors.indexOf("yubikey_otp_2fa") !== -1 && (
                    <Grid container style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Grid item xs={12} sm={12} md={12}>
                            <Button variant="contained" color="primary" onClick={showYubikeyOtp2faForm} type="submit">
                                {t("YUBIKEY")}
                            </Button>
                        </Grid>
                    </Grid>
                )}
                {multifactors.indexOf("duo_2fa") !== -1 && (
                    <Grid container style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Grid item xs={12} sm={12} md={12}>
                            <Button variant="contained" color="primary" onClick={showDuo2faForm} type="submit">
                                {t("DUO")}
                            </Button>
                        </Grid>
                    </Grid>
                )}
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button variant="contained" onClick={cancel}>
                            {t("CANCEL")}
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
            name="loginForm"
            autoComplete="off"
        >
            {formContent}
            <div className="box-footer">
                <a onClick={remoteConfig} href="#">
                    {t("REMOTE_CONFIG")}
                </a>
                &nbsp;&nbsp;
                {allowLostPassword && <a href="lost-password.html">{t("LOST_PASSWORD")}</a>}&nbsp;&nbsp;
                <a href="privacy-policy.html">{t("PRIVACY_POLICY")}</a>
            </div>
        </form>
    );
};

export default withStyles(styles)(LoginViewForm);
