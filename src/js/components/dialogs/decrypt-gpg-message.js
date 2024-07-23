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

import HKP from "@openpgp/hkp-client";
import * as openpgp from "openpgp";

import { BarLoader } from "react-spinners";

import GridContainerErrors from "../grid-container-errors";
import { getStore } from "../../services/store";
import datastorePasswordService from "../../services/datastore-password";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
}));

const DialogDecryptGpgMessage = (props) => {
    const classes = useStyles();
    const { open, onClose } = props;
    const { t } = useTranslation();
    const [encryptedMessage, setEncryptedMessage] = useState("");
    const [decryptedMessage, setDecryptedMessage] = useState("");
    const [decrypting, setDecrypting] = useState(false);
    const [decryptingComplete, setDecryptingComplete] = useState(false);
    const [errors, setErrors] = useState([]);

    const decrypt = () => {
        setDecrypting(true);

        const pgpSender = [];

        function decrypt(publicKey) {
            return datastorePasswordService.getAllOwnPgpKeys().then(async function (privateKeys) {
                const privateKeysArray = [];

                for (let i = 0; i < privateKeys.length; i++) {
                    const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeys[i] });
                    privateKeysArray.push(privateKey);
                }

                const message = await openpgp.readMessage({
                    armoredMessage: encryptedMessage, // parse armored message
                });

                let options;
                if (publicKey) {
                    options = {
                        message: message, // parse armored message
                        verificationKeys: await openpgp.readKey({ armoredKey: publicKey }),
                        decryptionKeys: privateKeysArray,
                    };
                } else {
                    options = {
                        message: message, // parse armored message
                        decryptionKeys: privateKeysArray,
                    };
                }

                openpgp.decrypt(options).then(
                    function (plaintext) {
                        setDecryptedMessage(plaintext.data);
                        setDecryptingComplete(true);
                        setDecrypting(false);
                    },
                    function (error) {
                        console.log(error);
                        setErrors([error.message]);
                        setDecrypting(false);
                    }
                );
            });
        }
        // TODO check how this logic works in the old client. pgpSender is always an empty list
        const gpgHkpSearch = getStore().getState().settingsDatastore.gpgHkpSearch;
        if (gpgHkpSearch && pgpSender && pgpSender.length) {
            const hkp = new HKP(getStore().getState().settingsDatastore.gpgHkpKeyServer);
            const options = {
                query: pgpSender,
            };
            hkp.lookup(options).then(
                function (public_key) {
                    decrypt(public_key);
                },
                function (error) {
                    console.log(error);
                    console.log(error.message);
                    decrypt();
                }
            );
        } else {
            decrypt();
        }
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
            <DialogTitle id="alert-dialog-title">{t("DECRYPT_MESSAGE")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <GridContainerErrors errors={errors} setErrors={setErrors} />
                    {!decryptingComplete && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
                                id="encryptedMessage"
                                label={t("ENCRYPTED_MESSAGE")}
                                name="encryptedMessage"
                                autoComplete="off"
                                value={encryptedMessage}
                                onChange={(event) => {
                                    setEncryptedMessage(event.target.value);
                                }}
                                disabled={decrypting}
                                multiline
                                minRows={3}
                            />
                        </Grid>
                    )}
                    {decryptingComplete && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
                                id="decryptedMessage"
                                label={t("DECRYPTED_MESSAGE")}
                                name="decryptedMessage"
                                autoComplete="off"
                                value={decryptedMessage}
                                multiline
                                disabled
                                minRows={3}
                            />
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t("CLOSE")}</Button>
                {!decryptingComplete && (
                    <Button
                        onClick={decrypt}
                        variant="contained"
                        color="primary"
                        disabled={!encryptedMessage || decrypting}
                    >
                        <span style={!decrypting ? {} : { display: "none" }}>{t("DECRYPT")}</span>
                        <BarLoader color={"#FFF"} height={17} width={37} loading={decrypting} />
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

DialogDecryptGpgMessage.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default DialogDecryptGpgMessage;
