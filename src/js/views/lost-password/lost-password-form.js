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
import user from "../../services/user";
import converterService from "../../services/converter";
import host from "../../services/host";
import cryptoLibrary from "../../services/crypto-library";
import GridContainerErrors from "../../components/grid-container-errors";
import store from "../../services/store";
import FooterLinks from "../../components/footer-links";

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

const LostPasswordViewForm = (props) => {
    const { classes } = props;
    const { t } = useTranslation();

    const [view, setView] = useState("default");
    const [username, setUsername] = useState(store.getState().user.username);
    const [code1, setCode1] = useState("");
    const [code2, setCode2] = useState("");
    const [words, setWords] = useState("");
    const [server, setServer] = useState(store.getState().server.url);
    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");
    const [domain, setDomain] = useState("");
    const [errors, setErrors] = useState([]);
    const [recoveryData, setRecoveryData] = useState({});
    const [recoveryCode, setRecoveryCode] = useState({});
    const [allowLostPassword, setAllowLostPassword] = useState(false);
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

    const setNewPassword = (e) => {
        setErrors([]);

        host.info().then(
            function (info) {
                const test_error = helperService.isValidPassword(
                    password,
                    passwordRepeat,
                    info.data["decoded_info"]["compliance_min_master_password_length"],
                    info.data["decoded_info"]["compliance_min_master_password_complexity"]
                );

                if (test_error) {
                    setErrors([test_error]);
                    return;
                }

                function onError() {
                    alert("Error, should not happen.");
                }

                function onSuccess() {
                    setView("success");
                }
                let parsedUrl = helperService.parseUrl(server);
                let fullUsername = helperService.formFullUsername(username, domain || parsedUrl["full_domain"]);

                // Validate now the username
                user.setPassword(
                    fullUsername,
                    recoveryCode,
                    password,
                    recoveryData.user_private_key,
                    recoveryData.user_secret_key,
                    recoveryData.user_sauce,
                    recoveryData.verifier_public_key
                ).then(onSuccess, onError);
            },
            function (data) {
                console.log(data);
                // handle server is offline
                setErrors(["SERVER_OFFLINE"]);
            }
        );
    };

    const onNewConfigLoaded = (configJson) => {
        if (!isSubscribed) {
            return;
        }
        const serverUrl = configJson["backend_servers"][0]["url"];
        const domain = configJson["backend_servers"][0]["domain"];
        const allowLostPassword =
            (!configJson.hasOwnProperty("allow_lost_password") ||
                (configJson.hasOwnProperty("allow_lost_password") && configJson["allow_lost_password"])) &&
            configJson["authentication_methods"].indexOf("AUTHKEY") !== -1;
        const allowCustomServer = configJson.allow_custom_server;

        setAllowLostPassword(allowLostPassword);
        setServer(serverUrl);
        setDomain(domain);
        setAllowCustomServer(allowCustomServer);
    };

    const recoveryEnable = () => {
        setErrors([]);
        let parsedUrl = helperService.parseUrl(server);

        // Validate now the username
        let fullUsername = helperService.formFullUsername(username, domain || parsedUrl["full_domain"]);
        const testResult = helperService.isValidUsername(fullUsername);
        if (testResult) {
            setErrors([testResult]);
            return;
        }

        // Validate now the recovery code information (words and codes)
        let recoveryCode;
        if (typeof words !== "undefined" && words !== "") {
            recoveryCode = converterService.hexToBase58(converterService.wordsToHex(words.split(" ")));
        } else if (typeof code1 !== "undefined" && code1 !== "" && typeof code2 !== "undefined" && code2 !== "") {
            if (
                !cryptoLibrary.recoveryPasswordChunkPassChecksum(code1) ||
                !cryptoLibrary.recoveryPasswordChunkPassChecksum(code2)
            ) {
                setErrors(["AT_LEAST_ONE_CODE_INCORRECT"]);
                return;
            }
            recoveryCode = cryptoLibrary.recoveryCodeStripChecksums(code1 + code2);
        } else {
            setErrors(["SOMETHING_STRANGE_HAPPENED"]);
            return;
        }

        function onError(data) {
            console.log(data);
            if (data.hasOwnProperty("data") && data.data.hasOwnProperty("non_field_errors")) {
                setErrors(data.data.non_field_errors);
            } else if (!data.hasOwnProperty("data")) {
                setErrors(["SERVER_OFFLINE"]);
            } else {
                alert("Error, should not happen.");
            }
        }

        function onSuccess(data) {
            if (data.hasOwnProperty("message")) {
                setErrors([data.message]);
            } else {
                setView("set_password");
                setRecoveryCode(recoveryCode);
                setRecoveryData(data);

                // TODO start timer with data.verifier_time_valid seconds
            }
        }

        user.recoveryEnable(fullUsername, recoveryCode, server).then(onSuccess, onError);
    };

    let formContent;

    if (view === "default") {
        formContent = (
            <>
                {!allowLostPassword && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <MuiAlert
                                severity="info"
                                style={{
                                    marginBottom: "5px",
                                    marginTop: "5px",
                                }}
                            >
                                {t("PASSWORD_RESET_HAS_BEEN_DISABLED")}
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
                {allowLostPassword && (
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
                                autoComplete="off"
                                value={username}
                                onChange={(event) => {
                                    setUsername(event.target.value);
                                }}
                            />
                        </Grid>
                        <Grid item xs={6} sm={6} md={6}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="code1"
                                placeholder="DdSLuiDcPuY2F"
                                name="code1"
                                autoComplete="off"
                                value={code1}
                                onChange={(event) => {
                                    setCode1(event.target.value);
                                }}
                            />
                        </Grid>
                        <Grid item xs={6} sm={6} md={6}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="code2"
                                placeholder="Dsxf82sKQdqPs"
                                name="code2"
                                autoComplete="off"
                                value={code2}
                                onChange={(event) => {
                                    setCode2(event.target.value);
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="words"
                                placeholder={t("OR_WORDLIST")}
                                name="words"
                                autoComplete="off"
                                value={words}
                                onChange={(event) => {
                                    setWords(event.target.value);
                                }}
                            />
                        </Grid>
                    </Grid>
                )}

                {allowLostPassword && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                            <Button
                                variant="contained"
                                color="primary"
                                classes={{ disabled: classes.disabledButton }}
                                onClick={recoveryEnable}
                                type="submit"
                                disabled={(!words && (!code1 || !code2)) || !username}
                            >
                                {t("REQUEST_PASSWORD_RESET")}
                            </Button>
                            <Button href={"index.html"}>
                                <span style={{ color: "#b1b6c1" }}>{t("ABORT")}</span>
                            </Button>
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
                                autoComplete="off"
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

    if (view === "set_password") {
        formContent = (
            <>
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense"
                        id="password"
                        label={t("NEW_PASSWORD")}
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
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense"
                        id="passwordRepeat"
                        label={t("NEW_PASSWORD_REPEAT")}
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
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={setNewPassword}
                            type="submit"
                            style={{ marginRight: "10px" }}
                        >
                            {t("SET_NEW_PASSWORD")}
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

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
            }}
            name="lostpasswordForm"
            autoComplete="off"
        >
            {formContent}
            <div className="box-footer">
                <FooterLinks />
            </div>
        </form>
    );
};

export default withStyles(styles)(LostPasswordViewForm);
