import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { Grid } from "@mui/material";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import { makeStyles } from '@mui/styles';
import MuiAlert from '@mui/material/Alert'
import Button from "@mui/material/Button";

import browserClient from "../../services/browser-client";
import helperService from "../../services/helper";
import user from "../../services/user";
import converterService from "../../services/converter";
import host from "../../services/host";
import cryptoLibrary from "../../services/crypto-library";
import GridContainerErrors from "../../components/grid-container-errors";
import action from "../../actions/bound-action-creators";
import { getStore } from "../../services/store";
import FooterLinks from "../../components/footer-links";

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
    disabledButton: {
        backgroundColor: "rgba(45, 187, 147, 0.50) !important",
    },
    button: {
        color: "white !important",
    },
    inputAdornment: {
        color: "#b1b6c1",
    },
}));

const EmergencyCodeViewForm = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();

    const [view, setView] = useState("default");
    const [remainingWaitingTime, setRemainingWaitingTime] = useState(-1);
    const [username, setUsername] = useState("");
    const [emergencyCode, setEmergencyCode] = useState("");
    const [code1, setCode1] = useState("");
    const [code2, setCode2] = useState("");
    const [words, setWords] = useState("");
    const [server, setServer] = useState(getStore().getState().server.url);
    const [serverCheck, setServerCheck] = useState({});
    const [domain, setDomain] = useState("");
    const [errors, setErrors] = useState([]);
    const [allowCustomServer, setAllowCustomServer] = useState(true);

    React.useEffect(() => {
        browserClient.getConfig().then(onNewConfigLoaded);
    }, []);

    const cancel = (e) => {
        setView("default");
        setErrors([]);
    };

    const onNewConfigLoaded = (configJson) => {
        const serverUrl = configJson["backend_servers"][0]["url"];
        const domain = configJson["backend_servers"][0]["domain"];
        const allowCustomServer = configJson.allow_custom_server;

        setServer(serverUrl);
        setDomain(domain);
        setAllowCustomServer(allowCustomServer);
    };

    const arm = (localEmergencyCode, serverCheck) => {
        let parsedUrl = helperService.parseUrl(server);
        let fullUsername = helperService.formFullUsername(username, domain || parsedUrl["full_domain_without_www"]);

        function onError(data) {
            setView("default");
            console.log(data);
            if (data.hasOwnProperty("data") && data.data.hasOwnProperty("non_field_errors")) {
                setErrors(data.data.non_field_errors);
            } else if (data.hasOwnProperty("data") && data.data.hasOwnProperty("detail")) {
                setErrors([data.data.detail]);
            } else if (!data.hasOwnProperty("data")) {
                setErrors(["SERVER_OFFLINE"]);
            } else {
                alert("Error, should not happen.");
            }
        }

        function onSuccess(data) {
            if (data.status === "active") {
                window.location.href = "index.html";
            }

            setView(data.status); // started, waiting
            if (data.remaining_wait_time) {
                setRemainingWaitingTime(data.remaining_wait_time);
            }
        }
        user.armEmergencyCode(
            fullUsername,
            localEmergencyCode,
            server,
            serverCheck["info"],
            serverCheck["verify_key"]
        ).then(onSuccess, onError);
    };

    const approveHost = () => {
        host.approveHost(serverCheck.server_url, serverCheck.verify_key);
        arm(emergencyCode, serverCheck);
    };

    const approveNewServer = () => {
        return approveHost();
    };

    const disapproveNewServer = () => {
        setView("default");
        setErrors([]);
    };

    const armEmergencyCode = () => {
        setErrors([]);
        action().setServerUrl(server);

        let parsedUrl = helperService.parseUrl(server);
        let fullUsername = helperService.formFullUsername(username, domain || parsedUrl["full_domain_without_www"]);
        const test_result = helperService.isValidUsername(fullUsername);
        if (test_result) {
            setErrors([test_result]);
            return;
        }

        // Validate now the recovery code information (words and codes)
        let localEmergencyCode;
        if (typeof words !== "undefined" && words !== "") {
            localEmergencyCode = converterService.hexToBase58(converterService.wordsToHex(words.split(" ")));
        } else if (typeof code1 !== "undefined" && code1 !== "" && typeof code2 !== "undefined" && code2 !== "") {
            if (
                !cryptoLibrary.recoveryPasswordChunkPassChecksum(code1) ||
                !cryptoLibrary.recoveryPasswordChunkPassChecksum(code2)
            ) {
                setErrors(["AT_LEAST_ONE_CODE_INCORRECT"]);
                return;
            }
            localEmergencyCode = cryptoLibrary.recoveryCodeStripChecksums(code1 + code2);
        } else {
            setErrors(["SOMETHING_STRANGE_HAPPENED"]);
            return;
        }

        setEmergencyCode(localEmergencyCode);

        const onError = function () {
            setErrors(["SERVER_OFFLINE"]);
        };

        const onSuccess = function (serverCheck) {
            setServerCheck(serverCheck);
            action().setServerInfo(serverCheck.info, serverCheck.verify_key);
            console.log(serverCheck.status);
            if (serverCheck.status !== "matched") {
                setView(serverCheck.status);
                return;
            }

            arm(localEmergencyCode, serverCheck);
        };
        host.checkHost(server).then(onSuccess, onError);
    };

    let formContent;

    if (view === "default") {
        formContent = (
            <>
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
                    <Grid item xs={6} sm={6} md={6}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
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
                            margin="dense" size="small"
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
                            margin="dense" size="small"
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
                <Grid container>
                    <Grid item xs={6} sm={6} md={6} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            classes={{ disabled: classes.disabledButton }}
                            onClick={armEmergencyCode}
                            type="submit"
                            disabled={(!words && (!code1 || !code2)) || !username}
                        >
                            {t("ACTIVATE_EMERGENCY_CODE")}
                        </Button>
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
                {allowCustomServer && (
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

    if (view === "started") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <MuiAlert
                            onClose={() => {
                                setErrors([]);
                            }}
                            severity="success"
                            style={{ marginBottom: "5px" }}
                        >
                            {t("EMERGENCY_CODE_ACTIVATED")} {remainingWaitingTime} {t("SECONDS")}
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
            </>
        );
    }

    if (view === "waiting") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <MuiAlert
                            onClose={() => {
                                setErrors([]);
                            }}
                            severity="success"
                            style={{ marginBottom: "5px" }}
                        >
                            {t("EMERGENCY_CODE_WAITING")} {remainingWaitingTime} {t("SECONDS")}
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
                            margin="dense" size="small"
                            id="server_fingerprint"
                            label={t("FINGERPRINT_OF_THE_NEW_SERVER")}
                            InputProps={{
                                multiline: true,
                            }}
                            name="server_fingerprint"
                            autoComplete="off"
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
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={approveHost}
                            type="submit"
                            style={{ marginRight: "10px" }}
                        >
                            {t("APPROVE")}
                        </Button>
                        <Button onClick={cancel}>
                            <span style={{color: "#b1b6c1"}}>{t("CANCEL")}</span>
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
                            margin="dense" size="small"
                            id="server_fingerprint"
                            label={t("FINGERPRINT_OF_THE_NEW_SERVER")}
                            InputProps={{
                                multiline: true,
                            }}
                            name="server_fingerprint"
                            autoComplete="off"
                            value={serverCheck.verify_key}
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="oldserver_fingerprint"
                            label={t("FINGERPRINT_OF_THE_OLD_SERVER")}
                            InputProps={{
                                multiline: true,
                            }}
                            name="oldserver_fingerprint"
                            autoComplete="off"
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
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={disapproveNewServer}
                            type="submit"
                            style={{ marginRight: "10px" }}
                        >
                            {t("CANCEL")}
                        </Button>

                        <Button onClick={approveNewServer}>
                            <span style={{color: "#b1b6c1"}}>{t("IGNORE_AND_CONTINUE")}</span>
                        </Button>
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
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

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
            }}
            name="emergencyCodeForm"
            autoComplete="off"
        >
            {formContent}
            <div className="box-footer">
                <FooterLinks />
            </div>
        </form>
    );
};

export default EmergencyCodeViewForm;
