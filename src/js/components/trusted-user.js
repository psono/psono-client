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
        datastoreUserService.searchUserDatastore(user_id, user_username).then(function (user) {
            if (!isSubscribed) {
                return;
            }
            if (user !== null) {
                setUserIsTrusted(true);
                setUser(user);
                if (onSetUser) {
                    onSetUser(user);
                }
                return;
            }

            const onSuccess = function (data) {
                const users = data.data;
                if (Object.prototype.toString.call(users) === "[object Array]") {
                    users.map((user) => {
                        if (user.username === user_username) {
                            const _user = {
                                data: {
                                    user_id: user.id,
                                    user_username: user.username,
                                    user_public_key: user.public_key,
                                },
                                name: user.username,
                            };
                            setUser(_user);
                            if (onSetUser) {
                                onSetUser(_user);
                            }
                        }
                    });
                } else {
                    const _user = {
                        data: {
                            user_id: users.id,
                            user_username: users.username,
                            user_public_key: users.public_key,
                        },
                        name: users.username,
                    };
                    setUser(_user);
                    if (onSetUser) {
                        onSetUser(_user);
                    }
                }
            };
            const onError = function (data) {
                //pass
            };
            return datastoreUserService.searchUser(user_username).then(onSuccess, onError);
        });
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

            user_data_store.items.push(userObject);

            datastoreUserService.saveDatastoreContent(user_data_store);
            setUserIsTrusted(true);
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
            {!userIsTrusted && (
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
