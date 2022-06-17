import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import { Grid } from "@material-ui/core";
import TextField from "@material-ui/core/TextField";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";

import datastoreGpgUserService from "../../services/datastore-gpg-user";
import datastoreService from "../../services/datastore";
import helper from "../../services/helper";
import store from "../../services/store";
import Table from "../table";

import HKP from "@openpgp/hkp-client";
import * as openpgp from "openpgp";
import cryptoLibraryService from "../../services/crypto-library";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
    fingerprint: {
        marginTop: theme.spacing(2),
    },
}));

const DialogGpgAddressBook = (props) => {
    const { open, onClose, onSelect } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [view, setView] = useState("default");
    const [editingUser, setEditingUser] = useState({});
    const [editingUserPublicKeyFingerprints, setEditingUserPublicKeyFingerprints] = useState({});
    const [email, setEmail] = useState("");
    const [newPublicKey, setNewPublicKey] = useState("");
    const [fingerprint, setFingerprint] = useState("");
    const [defaultFingerprint, setDefaultFingerprint] = useState("");
    const [addresses, setAddresses] = useState([]);
    const [errors, setErrors] = useState([]);
    const [userDict, setUserDict] = useState({});

    let isSubscribed = true;
    React.useEffect(() => {
        loadGpgUsers();
        return () => (isSubscribed = false);
    }, []);

    const loadGpgUsers = () => {
        const onSuccess = function (datastore) {
            if (!isSubscribed) {
                return;
            }
            const parsedAddresses = [];
            const newUserDict = [];
            datastoreService.filter(datastore, function (user) {
                newUserDict[user.id] = user;
                parsedAddresses.push([user.id, user.email]);
            });
            setUserDict(newUserDict);
            setAddresses(parsedAddresses);
        };
        const onError = function () {
            alert("Error, should not happen.");
        };
        return datastoreGpgUserService.getGpgUserDatastore().then(onSuccess, onError);
    };

    const searchPublicKeyServer = (searchEmail) => {
        setErrors([]);

        const hkp = new HKP(store.getState().settingsDatastore.gpgHkpKeyServer);
        const options = {
            query: searchEmail,
        };

        hkp.lookup(options).then(
            async function (publicKey) {
                if (typeof publicKey !== "undefined") {
                    setNewPublicKey(publicKey);
                    setFingerprint(await datastoreGpgUserService.getGpgFingerprint(publicKey));
                } else {
                    setErrors(["NO_PUBLIC_KEY_FOUND_FOR_EMAIL"]);
                    setNewPublicKey("");
                    setFingerprint("");
                }
            },
            function (error) {
                console.log(error);
            }
        );
    };

    const addNewRecipient = async () => {
        setErrors([]);

        const publicKeyUnArmored = await openpgp.readKey({ armoredKey: newPublicKey });

        const user = {
            id: cryptoLibraryService.generateUuid(),
            email: email,
            public_keys: [publicKeyUnArmored.armor()],
        };

        const onSuccess = function (user) {
            if (user.hasOwnProperty("error")) {
                setErrors([user.error]);
            } else {
                onClose();
                if (onSelect) {
                    onSelect({ user: user, public_key: user.default_public_key });
                }
            }
        };

        const onError = function (data) {
            if (data.hasOwnProperty("error")) {
                setErrors([data.error]);
            } else {
                console.log(data);
                alert("Error, should not happen.");
            }
        };

        datastoreGpgUserService.addUser(user).then(onSuccess, onError);
    };

    const addNewGpgKey = async () => {
        setErrors([]);

        const onSuccess = async function (data) {
            if (data.hasOwnProperty("error")) {
                setErrors([data.error]);
            } else {
                editingUser.public_keys = data.public_keys;
                setEditingUser(editingUser);
                const fingerprints = Array(editingUser.public_keys.length);
                await Promise.all(
                    editingUser.public_keys.map(async (key, index) => {
                        fingerprints[index] = await datastoreGpgUserService.getGpgFingerprint(key);
                    })
                );

                setEditingUserPublicKeyFingerprints(fingerprints);
                backToEditingAddress();
            }
        };

        const onError = function (data) {
            if (data.hasOwnProperty("error")) {
                setErrors([data.error]);
            } else {
                console.log(data);
                alert("Error, should not happen.");
            }
        };

        datastoreGpgUserService.addPublicKey(editingUser, [newPublicKey]).then(onSuccess, onError);
    };

    const back = () => {
        setEmail("");
        setFingerprint("");
        setNewPublicKey("");
        setView("default");
    };

    const backToEditingAddress = () => {
        setEmail("");
        setFingerprint("");
        setNewPublicKey("");
        setView("editing_address");
    };
    const editRecipient = async (userId) => {
        const user = userDict[userId];
        setEditingUser(user);
        const fingerprints = Array(user.public_keys.length);
        await Promise.all(
            user.public_keys.map(async (key, index) => {
                fingerprints[index] = await datastoreGpgUserService.getGpgFingerprint(key);
            })
        );

        setEditingUserPublicKeyFingerprints(fingerprints);
        setDefaultFingerprint(await datastoreGpgUserService.getGpgFingerprint(user.default_public_key));
        setView("editing_address");
    };

    const deleteRecipient = (userId) => {
        const onSuccess = function (datastore) {
            loadGpgUsers();
        };
        const onError = function (data) {
            // pass
            console.log(data);
        };

        datastoreGpgUserService.deleteUser(userDict[userId]).then(onSuccess, onError);
    };

    const selectRecipient = (rowData) => {
        const user = userDict[rowData[0]];
        onClose();
        if (onSelect) {
            onSelect({ user: user, public_key: user.default_public_key });
        }
    };

    const chooseKeyAsDefault = async (keyId) => {
        const publicKey = editingUser.public_keys[keyId];
        setDefaultFingerprint(await datastoreGpgUserService.getGpgFingerprint(publicKey));
        datastoreGpgUserService.chooseAsDefaultKey(editingUser, publicKey);
    };

    const deleteKey = (keyId) => {
        const publicKey = editingUser.public_keys[keyId];

        const onSuccess = function (data) {
            const newEditingUser = helper.duplicateObject(editingUser);
            newEditingUser.public_keys.splice(keyId, 1);
            setEditingUser(newEditingUser);
            setEditingUserPublicKeyFingerprints(
                editingUserPublicKeyFingerprints.filter((value, index) => index !== keyId)
            );
        };

        const onError = function (data) {
            if (data.hasOwnProperty("error")) {
                setErrors([data.error]);
            } else {
                console.log(data);
                alert("Error, should not happen.");
            }
        };

        datastoreGpgUserService.removePublicKey(editingUser, [publicKey]).then(onSuccess, onError);
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("EMAIL") },
        {
            name: t("EDIT"),
            options: {
                filter: false,
                sort: false,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                editRecipient(tableMeta.rowData[0]);
                            }}
                        >
                            <EditIcon />
                        </IconButton>
                    );
                },
            },
        },
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

    const columnsEditUser = [
        { name: t("ID"), options: { display: false } },
        { name: t("FINGERPRINT") },
        {
            name: t("DEFAULT"),
            options: {
                filter: false,
                sort: false,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    const isDefault = defaultFingerprint === tableMeta.rowData[1];
                    return (
                        <IconButton
                            onClick={() => {
                                chooseKeyAsDefault(tableMeta.rowData[0]);
                            }}
                            disabled={isDefault}
                        >
                            {isDefault ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                        </IconButton>
                    );
                },
            },
        },
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
                                deleteKey(tableMeta.rowData[0]);
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
        <Dialog
            fullWidth
            maxWidth={"sm"}
            open={open}
            onClose={onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{t("ADDRESS_BOOK")}</DialogTitle>
            {view === "default" && (
                <DialogContent>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <Table
                                data={addresses}
                                columns={columns}
                                options={options}
                                onCreate={() => setView("adding_address")}
                                onSelect={selectRecipient}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
            )}
            {view === "editing_address" && (
                <DialogContent>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="email"
                                label={t("EMAIL")}
                                name="email"
                                autoComplete="email"
                                value={editingUser.email}
                                required
                                disabled
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <Table
                                data={editingUserPublicKeyFingerprints.map((key, index) => [index, key])}
                                columns={columnsEditUser}
                                options={options}
                                onCreate={() => setView("adding_gpg_key")}
                                onSelect={(rowData) => {
                                    onClose();
                                    onSelect({ user: editingUser, public_key: editingUser.public_keys[rowData[0]] });
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
            )}
            {view === "adding_address" && (
                <DialogContent>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="email"
                                label={t("EMAIL")}
                                name="email"
                                autoComplete="email"
                                value={email}
                                required
                                error={Boolean(email) && !helper.isValidEmail(email)}
                                onChange={(event) => {
                                    setEmail(event.target.value);
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="newPublicKey"
                                label={t("PUBLIC_KEY")}
                                name="newPublicKey"
                                autoComplete="newPublicKey"
                                value={newPublicKey}
                                required
                                onChange={async (event) => {
                                    setNewPublicKey(event.target.value);
                                    setFingerprint(await datastoreGpgUserService.getGpgFingerprint(event.target.value));
                                }}
                                helperText={t("USE_HKP_OR_PROVIDE_THE_PUBLIC_KEY_MANUALLY_INCLUDING")}
                                error={Boolean(newPublicKey) && !fingerprint}
                                multiline
                                minRows={3}
                                maxRows={10}
                            />
                        </Grid>
                        {!fingerprint && (
                            <Grid item xs={12} sm={12} md={12}>
                                <Button
                                    onClick={() => {
                                        searchPublicKeyServer(email);
                                    }}
                                    disabled={!email || !helper.isValidEmail(email)}
                                    variant="contained"
                                >
                                    {t("SEARCH_PUBLIC_KEY_SERVER")}
                                </Button>
                            </Grid>
                        )}
                        {fingerprint && (
                            <Grid item xs={12} sm={12} md={12} className={classes.fingerprint}>
                                <TextField
                                    className={classes.textField}
                                    variant="outlined"
                                    margin="dense"
                                    id="fingerprint"
                                    label={t("FINGERPRINT")}
                                    name="fingerprint"
                                    autoComplete="fingerprint"
                                    value={fingerprint}
                                />
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
            )}
            {view === "adding_gpg_key" && (
                <DialogContent>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="email"
                                label={t("EMAIL")}
                                name="email"
                                autoComplete="email"
                                value={editingUser.email}
                                required
                                disabled
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="newPublicKey"
                                label={t("PUBLIC_KEY")}
                                name="newPublicKey"
                                autoComplete="newPublicKey"
                                value={newPublicKey}
                                required
                                onChange={async (event) => {
                                    setNewPublicKey(event.target.value);
                                    setFingerprint(await datastoreGpgUserService.getGpgFingerprint(event.target.value));
                                }}
                                helperText={t("USE_HKP_OR_PROVIDE_THE_PUBLIC_KEY_MANUALLY_INCLUDING")}
                                error={Boolean(newPublicKey) && !fingerprint}
                                multiline
                                minRows={3}
                                maxRows={10}
                            />
                        </Grid>
                        {!fingerprint && (
                            <Grid item xs={12} sm={12} md={12}>
                                <Button
                                    onClick={() => {
                                        searchPublicKeyServer(editingUser.email);
                                    }}
                                    variant="contained"
                                >
                                    {t("SEARCH_PUBLIC_KEY_SERVER")}
                                </Button>
                            </Grid>
                        )}
                        {fingerprint && (
                            <Grid item xs={12} sm={12} md={12} className={classes.fingerprint}>
                                <TextField
                                    className={classes.textField}
                                    variant="outlined"
                                    margin="dense"
                                    id="fingerprint"
                                    label={t("FINGERPRINT")}
                                    name="fingerprint"
                                    autoComplete="fingerprint"
                                    value={fingerprint}
                                />
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
            )}
            {view === "default" && (
                <DialogActions>
                    <Button onClick={onClose}>{t("CLOSE")}</Button>
                </DialogActions>
            )}
            {view === "adding_address" && (
                <DialogActions>
                    <Button
                        onClick={addNewRecipient}
                        disabled={!fingerprint || !email || !helper.isValidEmail(email)}
                        variant="contained"
                        color="primary"
                    >
                        {t("ADD")}
                    </Button>
                    <Button onClick={back}>{t("BACK")}</Button>
                </DialogActions>
            )}
            {view === "editing_address" && (
                <DialogActions>
                    <Button onClick={back}>{t("BACK")}</Button>
                </DialogActions>
            )}
            {view === "adding_gpg_key" && (
                <DialogActions>
                    <Button onClick={addNewGpgKey} disabled={!fingerprint} variant="contained" color="primary">
                        {t("ADD")}
                    </Button>
                    <Button onClick={backToEditingAddress}>{t("BACK")}</Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

DialogGpgAddressBook.propTypes = {
    onClose: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default DialogGpgAddressBook;
