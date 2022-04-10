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

import * as openpgp from "openpgp";

import GridContainerErrors from "../grid-container-errors";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
}));

const DialogImportAsText = (props) => {
    const classes = useStyles();
    const { open, onClose, onNewGpgKeyImported } = props;
    const { t } = useTranslation();
    const [title, setTitle] = useState("");
    const [passphrase, setPassphrase] = useState("");
    const [publicKey, setPublicKey] = useState("");
    const [privateKey, setPrivateKey] = useState("");
    const [errors, setErrors] = useState([]);

    const importGpgKey = async () => {
        setErrors([]);

        if (
            !publicKey.startsWith("-----BEGIN PGP PUBLIC KEY BLOCK-----") ||
            !publicKey.endsWith("-----END PGP PUBLIC KEY BLOCK-----")
        ) {
            setErrors(["PUBLIC_KEY_MISSING_TAGS"]);
            return;
        }

        if (
            !privateKey.startsWith("-----BEGIN PGP PRIVATE KEY BLOCK-----") ||
            !privateKey.endsWith("-----END PGP PRIVATE KEY BLOCK-----")
        ) {
            setErrors(["PRIVATE_KEY_MISSING_TAGS"]);
            return;
        }

        const publicKeyObj = await openpgp.readKey({ armoredKey: publicKey });

        let privateKeyObj = await openpgp.readPrivateKey({ armoredKey: privateKey });
        try {
            privateKeyObj = await openpgp.decryptKey({
                privateKey: privateKeyObj,
                passphrase,
            });
        } catch (error) {
            if (error.message === "Error decrypting private key: Key packet is already decrypted.") {
                // pass
            } else {
                setErrors([error.message]);
                return;
            }
        }

        publicKeyObj.getPrimaryUser().then(function (primaryUser) {
            var name_email_sum = primaryUser.user.userID.userID;
            var emails = name_email_sum.match(/[^@<\s]+@[^@\s>]+/g);
            let email = "";
            if (emails.length > 0) {
                email = emails[0];
            }

            var names = name_email_sum.split(/\s+/);
            let name = "";
            if (names.length > 1) {
                names.pop();
                name = names.join(" ").replace(/"/g, "");
            }

            onNewGpgKeyImported(title, name, email, privateKeyObj.armor(), publicKeyObj.armor());
        });
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
            <DialogTitle id="alert-dialog-title">{t("IMPORT_GPG_KEY")}</DialogTitle>
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
                            id="passphrase"
                            label={t("PASSPHRASE")}
                            helperText={t("YOUR_KEYS_PASSPHRASE")}
                            name="passphrase"
                            autoComplete="passphrase"
                            value={passphrase}
                            onChange={(event) => {
                                setPassphrase(event.target.value);
                            }}
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
                                t("YOUR_PUBLIC_GPG_KEY") +
                                " -----BEGIN PGP PUBLIC KEY BLOCK----- and -----END PGP PUBLIC KEY BLOCK-----"
                            }
                            name="publicKey"
                            autoComplete="publicKey"
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
                                t("YOUR_PRIVATE_GPG_KEY") +
                                " -----BEGIN PGP PRIVATE KEY BLOCK----- and -----END PGP PRIVATE KEY BLOCK-----"
                            }
                            name="privateKey"
                            autoComplete="publicKey"
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
                    onClick={importGpgKey}
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

DialogImportAsText.propTypes = {
    onClose: PropTypes.func.isRequired,
    onNewGpgKeyImported: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default DialogImportAsText;
