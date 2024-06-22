import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { makeStyles } from '@mui/styles';
import { Grid } from "@mui/material";
import MuiAlert from '@mui/material/Alert'
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";

import GridContainerErrors from "../grid-container-errors";
import hostService from "../../services/host";
import helperService from "../../services/helper";
import offlineCacheService from "../../services/offline-cache";
import datastoreService from "../../services/datastore";
import exportService from "../../services/export";
import datastorePasswordService from "../../services/datastore-password";
import cryptoLibrary from "../../services/crypto-library";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
    passwordField: {
        fontFamily: "'Fira Code', monospace",
    },
}));

const DialogGoOffline = (props) => {
    const classes = useStyles();
    const { open, onClose } = props;
    const { t } = useTranslation();
    const [percentageComplete, setPercentageComplete] = React.useState(0);
    const [processing, setProcessing] = React.useState(false);
    const [passphrase, setPassphrase] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [passphraseRepeat, setPassphraseRepeat] = useState("");
    const [errors, setErrors] = useState([]);

    let openRequests = 0;
    let closedRequest = 0;

    const potentiallyCloseDialog = () => {
        if (closedRequest === openRequests) {
            offlineCacheService.save();
            onClose();
        }
    };

    const loadAllDatastores = (datastoreOverview) => {
        for (var i = 0; i < datastoreOverview.datastores.length; i++) {
            openRequests = openRequests + 1;
            if (datastoreOverview.datastores[i]["type"] === "password") {
                datastorePasswordService
                    .getPasswordDatastore(datastoreOverview.datastores[i]["id"])
                    .then(function (datastore) {
                        closedRequest = closedRequest + 1;
                        openRequests = openRequests + 1;
                        exportService.getAllSecrets(datastore, true, true).then(function () {
                            closedRequest = closedRequest + 1;
                            potentiallyCloseDialog();
                        });
                    });
            } else {
                datastoreService
                    .getDatastoreWithId(datastoreOverview.datastores[i]["id"])
                    .then(function (datastore) {
                        closedRequest = closedRequest + 1;
                        setPercentageComplete(Math.round((closedRequest / openRequests) * 1000) / 10);
                        potentiallyCloseDialog();
                    });
            }
        }
        potentiallyCloseDialog();
    };

    const approve = async () => {
        setErrors([]);

        hostService.info().then(
            function (info) {
                const test_error = helperService.isValidPassword(
                    passphrase,
                    passphraseRepeat,
                    info.data["decoded_info"]["compliance_min_master_password_length"],
                    info.data["decoded_info"]["compliance_min_master_password_complexity"]
                );

                if (test_error) {
                    setErrors([test_error]);
                    return;
                }
                setProcessing(true);

                offlineCacheService.setEncryptionPassword(passphrase);
                offlineCacheService.enable();

                // exportService.on('export-started', function(){
                //     setProcessing(true)
                // });
                // exportService.on('get-secret-started', function(){
                //     openRequests = openRequests + 1;
                //     setPercentageComplete(Math.round(closedRequest / openRequests * 1000) / 10)
                // });
                //
                // exportService.on('get-secret-complete', function(){
                //     closedRequest = closedRequest + 1;
                //     setPercentageComplete(Math.round(closedRequest / openRequests * 1000) / 10)
                // });
                //
                // exportService.on('export-complete', function(){
                //     openRequests = 0;
                //     closedRequest = 0;
                //     setProcessing(false)
                // });

                exportService.on("get-secret-started", function () {
                    openRequests = openRequests + 1;
                    setPercentageComplete(Math.round((closedRequest / openRequests) * 1000) / 10);
                });

                exportService.on("get-secret-complete", function () {
                    closedRequest = closedRequest + 1;
                    setPercentageComplete(Math.round((closedRequest / openRequests) * 1000) / 10);
                });

                datastoreService.getDatastoreOverview(true).then(loadAllDatastores);
            },
            function (data) {
                console.log(data);
                // handle server is offline
                setErrors(["SERVER_OFFLINE"]);
            }
        );
    };

    return (
        <Dialog
            fullWidth
            maxWidth={"sm"}
            open={open}
            onClose={onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{t("CACHING")}</DialogTitle>
            <DialogContent>
                {processing && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <MuiAlert
                                severity="info"
                                style={{
                                    marginBottom: "5px",
                                    marginTop: "5px",
                                }}
                            >
                                {t("THE_CLIENT_IS_DOWNLOADING_ALL_CONTENT")}
                            </MuiAlert>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12} style={{ marginBottom: "8px", marginTop: "8px" }}>
                            <Box display="flex" alignItems="center">
                                <Box width="100%" mr={1}>
                                    <LinearProgress variant="determinate" value={percentageComplete} />
                                </Box>
                                <Box minWidth={35}>
                                    <span style={{ color: "white", whiteSpace: "nowrap" }}>{percentageComplete} %</span>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                )}
                {!processing && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
                                id="passphrase"
                                label={t("PASSPHRASE")}
                                name="passphrase"
                                autoComplete="off"
                                value={passphrase}
                                onChange={(event) => {
                                    setPassphrase(event.target.value);
                                }}
                                InputProps={{
                                    type: showPassword ? "text" : "password",
                                    classes: {
                                        input: classes.passwordField,
                                    },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                size="large">
                                                {showPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            {!!passphrase && (<LinearProgress variant="determinate" value={cryptoLibrary.calculatePasswordStrengthInPercent(passphrase)} />)}
                        </Grid>
                        {Boolean(passphrase) && (
                            <Grid item xs={12} sm={12} md={12}>
                                <TextField
                                    className={classes.textField}
                                    variant="outlined"
                                    margin="dense" size="small"
                                    id="passphraseRepeat"
                                    label={t("PASSPHRASE_REPEAT")}
                                    name="passphraseRepeat"
                                    autoComplete="off"
                                    value={passphraseRepeat}
                                    onChange={(event) => {
                                        setPassphraseRepeat(event.target.value);
                                    }}
                                    InputProps={{
                                        type: showPassword ? "text" : "password",
                                        classes: {
                                            input: classes.passwordField,
                                        },
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    size="large">
                                                    {showPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                        )}
                        <GridContainerErrors errors={errors} setErrors={setErrors} />
                        <Grid item xs={12} sm={12} md={12}>
                            <MuiAlert
                                severity="info"
                                style={{
                                    marginBottom: "5px",
                                    marginTop: "5px",
                                }}
                            >
                                {t("CLIENT_STORES_SECRETS_IN_LOCAL_STORAGE")}
                            </MuiAlert>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t("CLOSE")}</Button>
                <Button
                    onClick={approve}
                    variant="contained"
                    color="primary"
                    disabled={!passphrase || passphrase !== passphraseRepeat}
                >
                    <span>{t("APPROVE")}</span>
                </Button>
            </DialogActions>
        </Dialog>
    );
};

DialogGoOffline.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default DialogGoOffline;
