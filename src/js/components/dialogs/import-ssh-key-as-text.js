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

import GridContainerErrors from "../grid-container-errors";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
}));

const DialogImportSshKeyAsText = (props) => {
    const classes = useStyles();
    const { open, onClose, onNewSshKeyImported } = props;
    const { t } = useTranslation();
    const [title, setTitle] = useState("");
    const [publicKey, setPublicKey] = useState("");
    const [privateKey, setPrivateKey] = useState("");
    const [errors, setErrors] = useState([]);

    const importSshKey = async () => {
        setErrors([]);

        if (
            !publicKey.startsWith("ssh-")
        ) {
            setErrors(["PUBLIC_KEY_MISSING_TAGS"]);
            return;
        }

        if (
            !privateKey.startsWith("-----BEGIN") ||
            !privateKey.endsWith("PRIVATE KEY-----")
        ) {
            setErrors(["PRIVATE_KEY_MISSING_TAGS"]);
            return;
        }

        onNewSshKeyImported(title, privateKey, publicKey);
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
            <DialogTitle id="alert-dialog-title">{t("IMPORT_SSH_KEY")}</DialogTitle>
            <DialogContent>
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
                            id="publicKey"
                            label={t("PUBLIC_KEY")}
                            helperText={
                                t("YOUR_PUBLIC_SSH_KEY") +
                                " ssh..."
                            }
                            name="publicKey"
                            autoComplete="off"
                            value={publicKey}
                            onChange={(event) => {
                                setPublicKey(event.target.value.trim());
                            }}
                            multiline
                            minRows={3}
                            maxRows={10}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="privateKey"
                            label={t("PRIVATE_KEY")}
                            helperText={
                                t("YOUR_PRIVATE_SSH_KEY") +
                                " -----BEGIN OPENSSH PRIVATE KEY----- and -----END OPENSSH PRIVATE KEY-----"
                            }
                            name="privateKey"
                            autoComplete="off"
                            value={privateKey}
                            onChange={(event) => {
                                setPrivateKey(event.target.value.trim());
                            }}
                            multiline
                            minRows={3}
                            maxRows={10}
                            required
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t("CLOSE")}</Button>
                <Button
                    onClick={importSshKey}
                    variant="contained"
                    color="primary"
                    disabled={!title || !publicKey || !privateKey}
                >
                    <span>{t("IMPORT")}</span>
                </Button>
            </DialogActions>
        </Dialog>
    );
};

DialogImportSshKeyAsText.propTypes = {
    onClose: PropTypes.func.isRequired,
    onNewSshKeyImported: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default DialogImportSshKeyAsText;
