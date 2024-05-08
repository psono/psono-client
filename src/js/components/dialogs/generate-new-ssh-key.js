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
import { Grid } from "@material-ui/core";
import MuiAlert from "@material-ui/lab/Alert";

import ssh from 'ed25519-keygen/ssh';

import GridContainerErrors from "../grid-container-errors";
import { getStore } from "../../services/store";
import cryptoLibraryService from "../../services/crypto-library";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
}));

const DialogGenerateNewSshKey = (props) => {
    const classes = useStyles();
    const { open, onClose, onNewSshKeysGenerated } = props;
    const { t } = useTranslation();
    const [generating, setGenerating] = useState(false);
    const [title, setTitle] = useState("");
    const [email, setEmail] = useState(getStore().getState().user.userEmail);
    const [errors, setErrors] = useState([]);

    const generateSshKey = async () => {
        setErrors([]);
        setGenerating(true);
        const sshKey = await ssh(cryptoLibraryService.randomBytes(32), email);
        setGenerating(false);
        onNewSshKeysGenerated(title, sshKey.privateKey, sshKey.publicKey);
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
                                {t("WE_GENERATE_YOUR_SSH_KEYS_PLEASE_WAIT")}
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
                                margin="dense"
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
                            <MuiAlert severity="info">{t("SSH_KEY_GENERATION_EXPLAINED")}</MuiAlert>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t("CLOSE")}</Button>
                <Button
                    onClick={generateSshKey}
                    variant="contained"
                    color="primary"
                    disabled={!title || !email || generating}
                >
                    <span>{t("GENERATE")}</span>
                </Button>
            </DialogActions>
        </Dialog>
    );
};

DialogGenerateNewSshKey.propTypes = {
    onClose: PropTypes.func.isRequired,
    onNewSshKeysGenerated: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    secretId: PropTypes.string,
};

export default DialogGenerateNewSshKey;
