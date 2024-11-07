import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import CssBaseline from "@mui/material/CssBaseline";
import { makeStyles } from '@mui/styles';
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Button from "@mui/material/Button";
import AppBar from "@mui/material/AppBar";
import user from "../../services/user";
import Paper from "@mui/material/Paper";
import GridContainerErrors from "../../components/grid-container-errors";
import { Checkbox, Grid } from "@mui/material";
import TextField from "@mui/material/TextField";
import { Check } from "@mui/icons-material";
import Table from "../../components/table";
import SelectFieldGpgKey from "../../components/select-field/gpg-key";
import datastoreGpgUserService from "../../services/datastore-gpg-user";
import helper from "../../services/helper";
import cryptoLibrary from "../../services/crypto-library";
import browserClient from "../../services/browser-client";
import DeleteIcon from "@mui/icons-material/Delete";
import DialogGpgAddressBook from "../../components/dialogs/gpg-address-book";
import { BarLoader } from "react-spinners";
import { useParams } from "react-router-dom";
import deviceService from "../../services/device";
import ConfigLogo from "../../components/config-logo";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
    },
    contentRoot: {
        display: "flex",
        padding: "15px",
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
        [theme.breakpoints.up("sm")]: {
            width: `calc(100% - 0px)`,
            marginLeft: 0,
        },
        backgroundColor: theme.palette.lightBackground.main,
        color: "#777",
        borderColor: "rgb(231, 231, 231)",
        borderStyle: "solid",
        borderWidth: "1px",
        boxShadow: "none",
    },
    // necessary for content to be below app bar
    toolbar: {
        minHeight: deviceService.hasTitlebar() ? "82px" : "50px",
    },
    fullContent: {
        flexGrow: 1,
    },
    content: {
        height: "100%",
        width: "100%",
        overflow: "auto",
        position: "absolute",
        padding: "15px",
    },
    topLogo: {
        padding: "10px",
        height: "100%",
    },
    menuButton: {
        marginRight: theme.spacing(2),
        [theme.breakpoints.up("sm")]: {
            display: "none",
        },
    },
    topMenuButton: {
        textTransform: "none",
    },
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

const PopupPgpWriteView = (props) => {
    let { gpgMessageId } = useParams();
    const classes = useStyles();
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

    const logout = () => {
        user.logout();
    };

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

        browserClient.emitSec("write-gpg-complete", {
            message: decryptedMessage,
            message_id: gpgMessageId,
            receivers: receivers,
            public_keys: publicKeys,
            sign_message: signMessage,
            private_key: gpgKey,
        });
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
                customHeadLabelRender: () => null,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                deleteRecipient(tableMeta.rowData[0]);
                            }}
                            size="large">
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
        <div className={classes.root}>
            <CssBaseline />
            <AppBar position="fixed" className={classes.appBar}>
                <Container maxWidth="lg">
                    <Toolbar
                    >
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            className={classes.menuButton}
                            size="large">
                            <MenuIcon />
                        </IconButton>
                        <a className={classes.topLogo} href="#">
                            <ConfigLogo configKey={'logo_inverse'} defaultLogo={'img/logo-inverse.png'} height="100%" />
                        </a>
                        <div style={{ width: "100%" }}>
                            <div style={{ float: "right" }}>
                                <Button
                                    variant="contained"
                                    aria-controls="simple-menu"
                                    aria-haspopup="true"
                                    onClick={logout}
                                    color="primary"
                                    disableElevation
                                    className={classes.topMenuButton}
                                >
                                    {t("LOGOUT")}
                                </Button>
                            </div>
                        </div>
                    </Toolbar>
                </Container>
            </AppBar>
            <div className={classes.fullContent}>
                <div className={classes.toolbar} />
                <div className={classes.content}>
                    <Paper square>
                        <AppBar elevation={0} position="static" color="default">
                            <Toolbar
                            >{t("ENCRYPT_MESSAGE")}</Toolbar>
                        </AppBar>
                        <div className={classes.contentRoot}>
                            <Grid container>
                                <GridContainerErrors errors={errors} setErrors={setErrors} />
                                {!encryptionComplete && (
                                    <Grid item xs={12} sm={12} md={12}>
                                        <TextField
                                            className={classes.textField}
                                            variant="outlined"
                                            margin="dense" size="small"
                                            id="decryptedMessage"
                                            label={t("MESSAGE")}
                                            name="decryptedMessage"
                                            autoComplete="off"
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
                                        <Table
                                            data={recipients}
                                            columns={columns}
                                            options={options}
                                            onCreate={addRecipient}
                                        />
                                    </Grid>
                                )}
                                {!encryptionComplete && (
                                    <Grid item xs={12} sm={12} md={12}>
                                        <SelectFieldGpgKey
                                            className={classes.textField}
                                            variant="outlined"
                                            margin="dense" size="small"
                                            required={signMessage}
                                            value={gpgKey}
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
                                            margin="dense" size="small"
                                            id="encryptedMessage"
                                            label={t("ENCRYPTED_MESSAGE")}
                                            name="encryptedMessage"
                                            autoComplete="off"
                                            value={encryptedMessage}
                                            multiline
                                            disabled
                                            minRows={3}
                                        />
                                    </Grid>
                                )}
                                <Grid item xs={12} sm={12} md={12}>
                                    {!encryptionComplete && (
                                        <Button
                                            onClick={encrypt}
                                            variant="contained"
                                            color="primary"
                                            disabled={
                                                !decryptedMessage ||
                                                encrypting ||
                                                (signMessage && !gpgKey) ||
                                                recipients.length === 0
                                            }
                                        >
                                            <span style={!encrypting ? {} : { display: "none" }}>{t("ENCRYPT")}</span>
                                            <BarLoader color={"#FFF"} height={17} width={37} loading={encrypting} />
                                        </Button>
                                    )}
                                </Grid>
                            </Grid>
                        </div>
                    </Paper>
                </div>
            </div>
            {addNewGpgRecipientDialogOpen && (
                <DialogGpgAddressBook
                    open={addNewGpgRecipientDialogOpen}
                    onSelect={onAddRecipient}
                    onClose={() => setAddNewGpgRecipientDialogOpen(false)}
                />
            )}
        </div>
    );
};

export default PopupPgpWriteView;
