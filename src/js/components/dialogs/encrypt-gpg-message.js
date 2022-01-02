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
import DeleteIcon from "@material-ui/icons/Delete";
import IconButton from "@material-ui/core/IconButton";

import * as openpgp from "openpgp";

import { BarLoader } from "react-spinners";

import GridContainerErrors from "../grid-container-errors";
import Table from "../table";
import SelectFieldGpgKey from "../select-field/gpg-key";
import secretService from "../../services/secret";
import helper from "../../services/helper";
import DialogGpgAddressBook from "./gpg-address-book";
import datastoreGpgUserService from "../../services/datastore-gpg-user";
import cryptoLibrary from "../../services/crypto-library";

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

const DialogEncryptGpgMessage = (props) => {
    const classes = useStyles();
    const { open, onClose, secretId } = props;
    const { t } = useTranslation();
    const [signMessage, setSignMessage] = useState(true);
    const [recipients, setRecipients] = useState([]);
    const [gpgKey, setGpgKey] = useState(null);
    const [encryptedMessage, setEncryptedMessage] = useState("");
    const [decryptedMessage, setDecryptedMessage] = useState("");
    const [addNewGpgRecipientDialogOpen, setAddNewGpgRecipientDialogOpen] = useState(false);
    const [encrypting, setEncrypting] = useState(false);
    const [encryptionComplete, setEncryptingComplete] = useState(false);
    const [errors, setErrors] = useState([]);

    const encrypt = async () => {
        setEncrypting(true);
        setErrors([]);

        let i;

        const receivers = [];
        const publicKeys = [];

        const receiverLookupDict = {};
        const publicKeysLookupDict = [];

        // lets filter out email and key duplicates
        for (i = 0; i < recipients.length; i++) {
            const emailKey = recipients[i][1].toLowerCase();
            if (!receiverLookupDict.hasOwnProperty(emailKey)) {
                receivers.push(recipients[i][1]);
                receiverLookupDict[emailKey] = recipients[i];
            }
            const fingerprint = recipients[i][2];
            if (!publicKeysLookupDict.hasOwnProperty(fingerprint)) {
                publicKeys.push(recipients[i][3]); // we add the public key
                publicKeysLookupDict[fingerprint] = recipients[i];
            }
        }

        let options;

        function finaliseEncryption(options) {
            openpgp.encrypt(options).then(function (ciphertext) {
                setEncryptedMessage(ciphertext);
                setEncrypting(false);
                setEncryptingComplete(true);
            });
        }

        const publicKeysArray = await Promise.all(publicKeys.map((armoredKey) => openpgp.readKey({ armoredKey })));

        if (signMessage) {
            const onSuccess = async function (data) {
                options = {
                    message: await openpgp.createMessage({ text: decryptedMessage }),
                    encryptionKeys: publicKeysArray,
                    signingKeys: await openpgp.readPrivateKey({ armoredKey: data["mail_gpg_own_key_private"] }),
                };

                finaliseEncryption(options);
            };

            const onError = function () {};

            secretService.readSecret(gpgKey.secret_id, gpgKey.secret_key).then(onSuccess, onError);
        } else {
            options = {
                message: await openpgp.createMessage({ text: decryptedMessage }),
                encryptionKeys: publicKeysArray,
            };
            finaliseEncryption(options);
        }
    };
    const deleteRecipient = (recipientId) => {
        const newRecipients = recipients.filter((recipient) => recipient[0] !== recipientId);
        setRecipients(newRecipients);
    };
    const addRecipient = () => {
        setAddNewGpgRecipientDialogOpen(true);
    };
    const onAddRecipient = async (newRecipient) => {
        let publicKey;
        if (newRecipient.public_key) {
            // lets use the specified public key
            publicKey = newRecipient.public_key;
        } else if (newRecipient.user.default_public_key) {
            // lets use the default key
            publicKey = newRecipient.user.default_public_key;
        } else if (newRecipient.user.public_keys.length > 0) {
            // okay, no key was specified nor a default key exist, so lets just use the first existing key
            publicKey = newRecipient.user.public_keys[0];
        } else {
            return;
        }

        const fingerprint = await datastoreGpgUserService.getGpgFingerprint(publicKey);
        const newRecipients = helper.duplicateObject(recipients);
        newRecipients.push([cryptoLibrary.generateUuid(), newRecipient.user.email, fingerprint, publicKey]);
        setRecipients(newRecipients);
    };
    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("EMAIL") },
        { name: t("FINGERPRINT") },
        {
            name: t("DELETE"),
            options: {
                filter: false,
                sort: false,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                deleteRecipient(tableMeta.rowData[0]);
                            }}
                        >
                            <DeleteIcon />
                        </IconButton>
                    );
                },
            },
        },
    ];

    const options = {
        filterType: "checkbox",
    };

    return (
        <Dialog fullWidth maxWidth={"sm"} open={open} onClose={onClose} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
            <DialogTitle id="alert-dialog-title">{t("ENCRYPT_MESSAGE")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <GridContainerErrors errors={errors} setErrors={setErrors} />
                    {!encryptionComplete && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="decryptedMessage"
                                label={t("MESSAGE")}
                                name="decryptedMessage"
                                autoComplete="decryptedMessage"
                                value={decryptedMessage}
                                onChange={(event) => {
                                    setDecryptedMessage(event.target.value);
                                }}
                                disabled={encrypting}
                                multiline
                                minRows={3}
                            />
                        </Grid>
                    )}
                    {!encryptionComplete && (
                        <Grid item xs={12} sm={12} md={12}>
                            <Checkbox
                                checked={signMessage}
                                onChange={(event) => {
                                    setSignMessage(event.target.checked);
                                }}
                                checkedIcon={<Check className={classes.checkedIcon} />}
                                icon={<Check className={classes.uncheckedIcon} />}
                                classes={{
                                    checked: classes.checked,
                                }}
                            />{" "}
                            {t("SIGN_MESSAGE_QUESTIONMARK")}
                        </Grid>
                    )}
                    {!encryptionComplete && (
                        <Grid item xs={12} sm={12} md={12}>
                            {t("RECIPIENTS")}
                        </Grid>
                    )}
                    {!encryptionComplete && (
                        <Grid item xs={12} sm={12} md={12}>
                            <Table data={recipients} columns={columns} options={options} onCreate={addRecipient} />
                        </Grid>
                    )}
                    {!encryptionComplete && (
                        <Grid item xs={12} sm={12} md={12}>
                            <SelectFieldGpgKey
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required={signMessage}
                                value={gpgKey}
                                secretId={secretId}
                                onChange={(value) => {
                                    setGpgKey(value);
                                }}
                            />
                        </Grid>
                    )}
                    {encryptionComplete && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="encryptedMessage"
                                label={t("ENCRYPTED_MESSAGE")}
                                name="encryptedMessage"
                                autoComplete="encryptedMessage"
                                value={encryptedMessage}
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
                {!encryptionComplete && (
                    <Button
                        onClick={encrypt}
                        variant="contained"
                        color="primary"
                        disabled={!decryptedMessage || encrypting || (signMessage && !gpgKey) || recipients.length === 0}
                    >
                        <span style={!encrypting ? {} : { display: "none" }}>{t("ENCRYPT")}</span>
                        <BarLoader color={"#FFF"} height={17} width={37} loading={encrypting} />
                    </Button>
                )}
            </DialogActions>
            {addNewGpgRecipientDialogOpen && (
                <DialogGpgAddressBook open={addNewGpgRecipientDialogOpen} onSelect={onAddRecipient} onClose={() => setAddNewGpgRecipientDialogOpen(false)} />
            )}
        </Dialog>
    );
};

DialogEncryptGpgMessage.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    secretId: PropTypes.string,
};

export default DialogEncryptGpgMessage;
