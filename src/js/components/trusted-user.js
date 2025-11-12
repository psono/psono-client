import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';

import { Grid } from "@mui/material";
import TextField from "@mui/material/TextField";
import MuiAlert from '@mui/material/Alert'

import datastoreUserService from "../services/datastore-user";
import cryptoLibrary from "../services/crypto-library";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
}));

const TrustedUser = (props) => {
    const { user_id, user_username, onSetUser } = props;
    const { t } = useTranslation();
    const classes = useStyles();

    const [userIsTrusted, setUserIsTrusted] = useState(false);
    const [keysHaveChanged, setKeysHaveChanged] = useState(false);
    const [user, setUser] = useState({
        data: {
            user_id: "",
            user_username: "",
            user_public_key: "",
        },
        name: "",
    });

    let isSubscribed = true;
    React.useEffect(() => {
        const onSuccess = function (data) {
            if (!isSubscribed) {
                return;
            }

            const users = data.data;
            let serverUser = null;

            if (Object.prototype.toString.call(users) === "[object Array]") {
                users.forEach((user) => {
                    if (user.username === user_username) {
                        serverUser = {
                            data: {
                                user_id: user.id,
                                user_username: user.username,
                                user_public_key: user.public_key,
                            },
                            name: user.username,
                        };
                    }
                });
            } else {
                serverUser = {
                    data: {
                        user_id: users.id,
                        user_username: users.username,
                        user_public_key: users.public_key,
                    },
                    name: users.username,
                };
            }

            if (!serverUser) {
                return;
            }

            datastoreUserService.searchUserDatastore(user_id, user_username).then(function (trustedUser) {
                if (!isSubscribed) {
                    return;
                }

                if (trustedUser !== null) {
                    if (trustedUser.data.user_public_key === serverUser.data.user_public_key) {
                        // Keys match - user is trusted
                        setUserIsTrusted(true);
                        setKeysHaveChanged(false);
                        setUser(serverUser);
                        if (onSetUser) {
                            onSetUser(serverUser);
                        }
                    } else {
                        // Keys don't match - user's keys have changed!
                        setUserIsTrusted(false);
                        setKeysHaveChanged(true);
                        setUser(serverUser);
                        if (onSetUser) {
                            onSetUser(serverUser);
                        }
                    }
                } else {
                    // User not in trusted datastore - not trusted
                    setUserIsTrusted(false);
                    setKeysHaveChanged(false);
                    setUser(serverUser);
                    if (onSetUser) {
                        onSetUser(serverUser);
                    }
                }
            });
        };

        const onError = function (data) {
            //pass
        };

        // Always query server first
        datastoreUserService.searchUser(user_username).then(onSuccess, onError);

        // cancel subscription to useEffect
        return () => (isSubscribed = false);
    }, []);

    const trust = () => {
        const onSuccess = function (user_data_store) {
            if (typeof user_data_store.items === "undefined") {
                user_data_store.items = [];
            }

            const userObject = {
                id: cryptoLibrary.generateUuid(),
                name: "",
                type: "user",
                data: user.data,
            };

            if (user.data.user_name) {
                userObject.name += user.data.user_name;
            } else {
                userObject.name += user.data.user_username;
            }
            userObject.name += " (" + user.data.user_public_key + ")";

            if (keysHaveChanged) {
                // Keys have changed - find and update the existing entry
                const findAndUpdate = (items) => {
                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        if (item.type === "user" &&
                            item.data &&
                            (item.data.user_id === user.data.user_id ||
                             item.data.user_username === user.data.user_username)) {
                            // Found the existing user - update it with new keys
                            items[i] = userObject;
                            items[i].id = item.id; // Keep the same ID
                            return true;
                        }
                        // Recursively search in nested items
                        if (item.items && item.items.length > 0) {
                            if (findAndUpdate(item.items)) {
                                return true;
                            }
                        }
                    }
                    return false;
                };

                findAndUpdate(user_data_store.items);
            } else {
                // User is not trusted yet - add as new entry
                user_data_store.items.push(userObject);
            }

            datastoreUserService.saveDatastoreContent(user_data_store);
            setUserIsTrusted(true);
            setKeysHaveChanged(false);
        };
        const onError = function (data) {
            //pass
        };

        datastoreUserService.getUserDatastore().then(onSuccess, onError);
    };

    return (
        <>
            {Boolean(user && user.data.user_name) && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="username"
                        label={t("USERNAME") + " " + (userIsTrusted ? "" : t("NOT_TRUSTED_BRACKETS"))}
                        name="username"
                        autoComplete="off"
                        value={user.data.user_name}
                        disabled
                    />
                </Grid>
            )}
            {!Boolean(user && user.data.user_name) && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="username"
                        label={t("USERNAME") + " " + (userIsTrusted ? "" : t("NOT_TRUSTED_BRACKETS"))}
                        name="username"
                        autoComplete="off"
                        value={user.data.user_username}
                        disabled
                    />
                </Grid>
            )}
            <Grid item xs={12} sm={12} md={12}>
                <TextField
                    className={classes.textField}
                    variant="outlined"
                    margin="dense" size="small"
                    id="publicKey"
                    label={t("PUBLIC_KEY") + " " + (userIsTrusted ? "" : t("NOT_TRUSTED_BRACKETS"))}
                    name="publicKey"
                    autoComplete="off"
                    value={user.data.user_public_key}
                    disabled
                />
            </Grid>
            {!userIsTrusted && keysHaveChanged && (
                <Grid item xs={12} sm={12} md={12}>
                    <MuiAlert
                        severity="error"
                        style={{
                            marginBottom: "5px",
                            marginTop: "5px",
                        }}
                    >
                        {t("WARNING_USER_KEYS_HAVE_CHANGED")}{" "}
                        <a
                            href="#"
                            onClick={(event) => {
                                event.preventDefault();
                                trust();
                            }}
                        >
                            {t("UPDATE_TRUSTED_USER")}
                        </a>
                    </MuiAlert>
                </Grid>
            )}
            {!userIsTrusted && !keysHaveChanged && (
                <Grid item xs={12} sm={12} md={12}>
                    <MuiAlert
                        severity="warning"
                        style={{
                            marginBottom: "5px",
                            marginTop: "5px",
                        }}
                    >
                        {t("YOU_NEVER_CONFIRMED_THIS_USERS_IDENTITY")}{" "}
                        <a
                            href="#"
                            onClick={(event) => {
                                event.preventDefault();
                                trust();
                            }}
                        >
                            {t("ADD_TO_TRUSTED_USERS")}
                        </a>
                    </MuiAlert>
                </Grid>
            )}
        </>
    );
};

TrustedUser.propTypes = {
    user_id: PropTypes.string,
    user_username: PropTypes.string,
    onSetUser: PropTypes.func,
};

export default TrustedUser;
