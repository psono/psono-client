import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import { makeStyles } from "@material-ui/core/styles";
import { Checkbox, Grid } from "@material-ui/core";
import { Check } from "@material-ui/icons";
import MuiAlert from "@material-ui/lab/Alert";

import HKP from "@openpgp/hkp-client";
import * as openpgp from "openpgp";

import GridContainerErrors from "../grid-container-errors";
import store from "../../services/store";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
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
}));

const DialogGenerateNewGpgKey = (props) => {
    const classes = useStyles();
    const { open, onClose, onNewGpgKeysGenerated } = props;
    const { t } = useTranslation();
    const [generating, setGenerating] = useState(false);
    const [title, setTitle] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState(store.getState().user.userEmail);
    const [publishPublicKey, setPublishPublicKey] = useState(true);
    const [errors, setErrors] = useState([]);

    const generateGpgKey = async () => {
        setErrors([]);
        setGenerating(true);
        const options = {
            userIDs: [{ name: name, email: email }],
            type: "rsa",
            rsaBits: 4096,
            passphrase: "",
        };
        openpgp.generateKey(options).then(
            function (key) {
                if (publishPublicKey) {
                    const hkp = new HKP(store.getState().settingsDatastore.gpgHkpKeyServer);
                    hkp.upload(key.publicKeyArmored).then(
                        function () {
                            onNewGpgKeysGenerated(title, name, email, key.privateKey, key.publicKey);
                        },
                        function () {
                            setGenerating(false);
                            onNewGpgKeysGenerated(title, name, email, key.privateKey, key.publicKey);
                        }
                    );
                } else {
                    setGenerating(false);
                    onNewGpgKeysGenerated(title, name, email, key.privateKey, key.publicKey);
                }
            },
            function () {
                setGenerating(false);
                setErrors(["INVALID_EMAIL_IN_EMAIL"]);
            }
        );
    };

    return (
        <Dialog fullWidth maxWidth={"sm"} open={open} onClose={onClose} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
            <DialogTitle id="alert-dialog-title">{t("GENERATE_NEW_GPG_KEY")}</DialogTitle>
            <DialogContent>
                {generating && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <MuiAlert
                                severity="info"
                                style={{
                                    marginBottom: "5px",
                                    marginTop: "5px",
                                }}
                            >
                                {t("WE_GENERATE_YOUR_GPG_KEYS_PLEASE_WAIT")}
                            </MuiAlert>
                        </Grid>
                    </Grid>
                )}
                {!generating && (
                    <Grid container>
                        <GridContainerErrors errors={errors} setErrors={setErrors} />
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="title"
                                label={t("TITLE")}
                                helperText={t("TITLE_TO_IDENTIFY_THIS_KEY")}
                                name="title"
                                autoComplete="title"
                                value={title}
                                onChange={(event) => {
                                    setTitle(event.target.value);
                                }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="name"
                                label={t("NAME")}
                                helperText={t("YOUR_REQUIRED_NAME")}
                                name="name"
                                autoComplete="name"
                                value={name}
                                onChange={(event) => {
                                    setName(event.target.value);
                                }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="email"
                                label={t("EMAIL")}
                                helperText={t("YOUR_REQUIRED_EMAIL")}
                                name="email"
                                autoComplete="email"
                                type="email"
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value);
                                }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <Checkbox
                                checked={publishPublicKey}
                                onChange={(event) => {
                                    setPublishPublicKey(event.target.checked);
                                }}
                                checkedIcon={<Check className={classes.checkedIcon} />}
                                icon={<Check className={classes.uncheckedIcon} />}
                                classes={{
                                    checked: classes.checked,
                                }}
                            />{" "}
                            {t("PUBLISH_PUBLIC_KEY")}
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <MuiAlert
                                severity="info"
                                style={{
                                    marginBottom: "5px",
                                    marginTop: "5px",
                                }}
                            >
                                {t("NAME_AND_EMAIL_ADDRESS_WILL_BE_PUBLICLY_AVAILABLE")}
                            </MuiAlert>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t("CLOSE")}</Button>
                <Button onClick={generateGpgKey} variant="contained" color="primary" disabled={!title || !name || !email || generating}>
                    <span>{t("GENERATE")}</span>
                </Button>
            </DialogActions>
        </Dialog>
    );
};

DialogGenerateNewGpgKey.propTypes = {
    onClose: PropTypes.func.isRequired,
    onNewGpgKeysGenerated: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    secretId: PropTypes.string,
};

export default DialogGenerateNewGpgKey;
