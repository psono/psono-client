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
import { Checkbox, Grid } from "@mui/material";
import { Check } from "@mui/icons-material";
import MuiAlert from '@mui/material/Alert'

import HKP from "@openpgp/hkp-client";
import * as openpgp from "openpgp";

import GridContainerErrors from "../grid-container-errors";
import { getStore } from "../../services/store";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
    checked: {
        color: theme.palette.checked.main,
    },
    checkedIcon: {
        width: "20px",
        height: "20px",
        border: `1px solid ${theme.palette.greyText.main}`,
        borderRadius: "3px",
    },
    uncheckedIcon: {
        width: "0px",
        height: "0px",
        padding: "9px",
        border: `1px solid ${theme.palette.greyText.main}`,
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
    const [email, setEmail] = useState(getStore().getState().user.userEmail);
    const [publishPublicKey, setPublishPublicKey] = useState(false);
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
                    const hkp = new HKP(getStore().getState().settingsDatastore.gpgHkpKeyServer);
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
        <Dialog
            fullWidth
            maxWidth={"sm"}
            open={open}
            onClose={onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
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
                                margin="dense" size="small"
                                id="title"
                                label={t("TITLE")}
                                helperText={t("TITLE_TO_IDENTIFY_THIS_KEY")}
                                name="title"
                                autoComplete="off"
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
                                margin="dense" size="small"
                                id="name"
                                label={t("NAME")}
                                helperText={t("YOUR_REQUIRED_NAME")}
                                name="name"
                                autoComplete="off"
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
                                margin="dense" size="small"
                                id="email"
                                label={t("EMAIL")}
                                helperText={t("YOUR_REQUIRED_EMAIL")}
                                name="email"
                                autoComplete="off"
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
                <Button
                    onClick={generateGpgKey}
                    variant="contained"
                    color="primary"
                    disabled={!title || !name || !email || generating}
                >
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
