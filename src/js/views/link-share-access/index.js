import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import { Grid } from "@material-ui/core";
import Box from "@material-ui/core/Box";
import LinearProgress from "@material-ui/core/LinearProgress";
import TextField from "@material-ui/core/TextField";
import MuiAlert from "@material-ui/lab/Alert";
import Button from "@material-ui/core/Button";
import { getStore } from "../../services/store";
import browserClient from "../../services/browser-client";
import converter from "../../services/converter";
import hostService from "../../services/host";
import linkShareService from "../../services/link-share";
import TextFieldPassword from "../../components/text-field/password";
import fileTransferService from "../../services/file-transfer";
import action from "../../actions/bound-action-creators";
import GridContainerErrors from "../../components/grid-container-errors";
import host from "../../services/host";
import DialogEditEntry from "../../components/dialogs/edit-entry";
import ConfigLogo from "../../components/config-logo";

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
}));

const LinkShareAccessView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const [percentageComplete, setPercentageComplete] = useState(0);
    const [server, setServer] = useState(getStore().getState().server.url);
    const [nextStep, setNextStep] = useState("");
    const [allowCustomServer, setAllowCustomServer] = useState(false);
    const [serverCheck, setServerCheck] = useState({});
    const [processing, setProcessing] = useState(false);
    const [passphrase, setPassphrase] = useState("");
    const [passphraseRequired, setPassphraseRequired] = useState(false);
    const [view, setView] = useState("default");
    const [errors, setErrors] = useState([]);
    const creditBuyAddress = getStore().getState().server.credit_buy_address;
    let { linkShareId, linkShareSecret, backendServerUrl, verifyKey } = useParams();

    const [editEntryOpen, setEditEntryOpen] = useState(false);
    const [editEntryData, setEditEntryData] = useState({});

    let openRequests = 0;
    let closedRequest = 0;

    React.useEffect(() => {
        const onSuccess = function (config) {
            let serverUrl = config["backend_servers"][0]["url"];

            setAllowCustomServer(config.allow_custom_server);

            if (config.allow_custom_server && backendServerUrl) {
                serverUrl = converter.decodeUtf8(converter.fromBase58(backendServerUrl));
            }
            setServer(serverUrl);
            initiateLinkShareAccess(serverUrl);
        };

        const onError = function (data) {
            console.log(data);
        };

        browserClient.getConfig().then(onSuccess, onError);

        fileTransferService.register("download_started", function (max) {
            setProcessing(true);
            openRequests = max + 1;
        });

        fileTransferService.register("download_step_complete", function (newNextStep) {
            closedRequest = closedRequest + 1;
            setPercentageComplete(Math.round((closedRequest / openRequests) * 1000) / 10);
            setNextStep(newNextStep);
        });

        fileTransferService.register("download_complete", function () {
            closedRequest = closedRequest + 1;
            setPercentageComplete(100);
            setProcessing(true);
            setNextStep("DOWNLOAD_COMPLETED");
        });
    }, []);

    function initiateLinkShareAccess(serverUrl) {
        action().setServerUrl(serverUrl);
        const onError = function () {
            setErrors(["SERVER_OFFLINE"]);
        };

        const onSuccess = function (serverCheck) {
            setServerCheck(serverCheck);
            action().setServerInfo(serverCheck.info, serverCheck.verify_key);
            if (serverCheck.status !== "matched") {
                setView(serverCheck.status);
                return;
            }
            return linkShareAccess();
        };
        hostService.checkHost(serverUrl, verifyKey).then(onSuccess, onError);
    }
    function linkShareAccess() {
        setErrors([]);

        openRequests = 1;
        closedRequest = 0;
        setPercentageComplete(0);
        setNextStep("DECRYPTING");
        setProcessing(true);

        const onSuccess = function (secret) {
            openRequests = 1;
            closedRequest = 1;
            setPercentageComplete(100);
            setNextStep("DOWNLOAD_COMPLETED");
            console.log(secret);
            if (secret) {
                setEditEntryData(secret);
                setEditEntryOpen(true);
            }
        };
        const onError = function (data) {
            reset();
            if (data.hasOwnProperty("non_field_errors")) {
                if (data.non_field_errors.length === 1 && data.non_field_errors[0] === "PASSPHRASE_REQUIRED") {
                    setPassphraseRequired(true);
                    return;
                }

                setErrors(data.non_field_errors);
                setNextStep("");
                setProcessing(false);
            } else {
                console.log(data);
                setErrors([data]);
            }
        };
        return linkShareService.linkShareAccess(linkShareId, linkShareSecret, passphrase).then(onSuccess, onError);
    }

    function reset() {
        openRequests = 0;
        closedRequest = 0;
        setPercentageComplete(0);
        setNextStep("");
        setProcessing(false);
    }

    const approveHost = () => {
        host.approveHost(serverCheck.server_url, serverCheck.verify_key);
        setView("default");
        return linkShareAccess();
    };

    const cancel = () => {
        window.location.href = "index.html";
    };

    return (
        <div className={"progress-box " + classes.textCenter}>
            <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} height="100%"/>
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true"/>
            </a>
            {view === "default" && (
                <React.Fragment>
                    {!processing && (
                        <React.Fragment>
                            <Grid container>
                                <Grid item xs={12} sm={12} md={12}>
                                    <TextFieldPassword
                                        className={classes.textField}
                                        variant="outlined"
                                        margin="dense"
                                        id="passphrase"
                                        label={t("PASSPHRASE")}
                                        name="passphrase"
                                        autoComplete="off"
                                        value={passphrase}
                                        onChange={(event) => {
                                            setPassphrase(event.target.value);
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={12} md={12} style={{marginTop: "5px", marginBottom: "5px"}}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => initiateLinkShareAccess(server)}
                                        type="submit"
                                        style={{marginRight: "10px"}}
                                    >
                                        {t("SEND")}
                                    </Button>
                                </Grid>
                                {allowCustomServer && (
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
                                                setServer(event.target.value.trim());
                                            }}
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </React.Fragment>
                    )}
                    {processing && (
                        <React.Fragment>
                            <Box display="flex" alignItems="center">
                                <Box width="100%" mr={1}>
                                    <LinearProgress variant="determinate" value={percentageComplete}/>
                                </Box>
                                <Box minWidth={35}>
                                    <span style={{color: "white", whiteSpace: "nowrap"}}>{percentageComplete} %</span>
                                </Box>
                            </Box>
                            <span>{t(nextStep)}</span>
                        </React.Fragment>
                    )}
                </React.Fragment>
            )}
            {view === "new_server" && (
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
                        <Grid item xs={12} sm={12} md={12} style={{marginTop: "5px", marginBottom: "5px"}}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={approveHost}
                                type="submit"
                                style={{marginRight: "10px"}}
                            >
                                {t("APPROVE")}
                            </Button>
                            <Button variant="contained" onClick={cancel}>
                                {t("CANCEL")}
                            </Button>
                        </Grid>
                    </Grid>
                    <GridContainerErrors errors={errors} setErrors={setErrors}/>
                </>
            )}
            {view === "signature_changed" && (
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
                                margin="dense"
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
                                <br/>
                                <br/>
                                <strong>{t("CONTACT_THE_OWNER_OF_THE_SERVER")}</strong>
                            </MuiAlert>
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12} style={{marginTop: "5px", marginBottom: "5px"}}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={cancel}
                                type="submit"
                                style={{marginRight: "10px"}}
                            >
                                {t("CANCEL")}
                            </Button>
                            <Button variant="contained" onClick={approveHost}>
                                {t("IGNORE_AND_CONTINUE")}
                            </Button>
                        </Grid>
                    </Grid>
                    <GridContainerErrors errors={errors} setErrors={setErrors}/>
                </>
            )}

            {errors.length > 0 && (
                <div className="form-group alert alert-danger" ng-repeat="e in errors">
                    <strong>{t("ERROR")}:</strong>

                    {errors.map((prop, index) => {
                        return (
                            <MuiAlert
                                onClose={() => {
                                    setErrors([]);
                                }}
                                key={index}
                                severity="error"
                                style={{marginBottom: "5px"}}
                            >
                                {(prop !== "INSUFFICIENT_FUNDS" || !creditBuyAddress) && <span>{t(prop)}</span>}
                                {prop === "INSUFFICIENT_FUNDS" && creditBuyAddress && (
                                    <span>{t("INSUFFICIENT_FUNDS_WITH_CREDIT_BUY_ADDRESS")}</span>
                                )}
                                {prop === "INSUFFICIENT_FUNDS" && creditBuyAddress && (
                                    <a href={creditBuyAddress} rel="nofollow noopener" target="_blank">
                                        <span>{t("BUY")}</span>
                                    </a>
                                )}
                            </MuiAlert>
                        );
                    })}
                </div>
            )}
            {editEntryOpen && (
                <DialogEditEntry
                    open={editEntryOpen}
                    onClose={() => setEditEntryOpen(false)}
                    item={editEntryData.item}
                    data={editEntryData.data}
                    hideLinkToEntry={true}
                    hideShowHistory={true}
                    hideMoreMenu={true}
                />
            )}
        </div>
    );
};

export default LinkShareAccessView;
