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
import MuiAlert from "@material-ui/lab/Alert";

import datastoreUserService from "../../services/datastore-user";
import cryptoLibrary from "../../services/crypto-library";
import DatastoreTree from "../datastore-tree";
import widget from "../../services/widget";
import datastorePassword from "../../services/datastore-password";
import DialogNewFolder from "./new-folder";
import TextFieldPath from "../text-field-path";
import shareService from "../../services/share";

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
    tree: {
        marginTop: "8px",
        marginBottom: "8px",
    },
}));

const DialogAcceptShare = (props) => {
    const { open, onClose, item, hideUser } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [path, setPath] = useState([]);
    const [newFolderOpen, setNewFolderOpen] = useState(false);
    const [newFolderData, setNewFolderData] = useState({});

    const [datastore, setDatastore] = useState(null);
    const [userIsTrusted, setUserIsTrusted] = useState(false);
    const [user, setUser] = useState({
        data: {
            user_name: "",
            user_username: "",
            user_public_key: "",
        },
    });

    let isSubscribed = true;
    React.useEffect(() => {
        datastorePassword.getPasswordDatastore().then(onNewDatastoreLoaded);
        datastoreUserService.searchUserDatastore(item.share_right_create_user_id, item.share_right_create_user_username).then(function (user) {
            if (!isSubscribed) {
                return;
            }
            if (user !== null) {
                setUserIsTrusted(true);
                setUser(user);
                return;
            }

            const onSuccess = function (data) {
                const users = data.data;
                if (Object.prototype.toString.call(users) === "[object Array]") {
                    users.map((user) => {
                        if (user.username === item.share_right_create_user_username) {
                            setUser({
                                data: {
                                    user_id: user.id,
                                    user_username: user.username,
                                    user_public_key: user.public_key,
                                },
                                name: user.username,
                            });
                        }
                    });
                } else {
                    setUser({
                        data: {
                            user_id: users.id,
                            user_username: users.username,
                            user_public_key: users.public_key,
                        },
                        name: users.username,
                    });
                }
            };
            const onError = function (data) {
                //pass
            };
            return datastoreUserService.searchUser(item.share_right_create_user_username).then(onSuccess, onError);
        });
        // cancel subscription to useEffect
        return () => (isSubscribed = false);
    }, []);

    const onNewDatastoreLoaded = (data) => {
        if (!isSubscribed) {
            return;
        }
        setDatastore(data);
    };

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

    const onNewFolderCreate = (name) => {
        // called once someone clicked the CREATE button in the dialog closes with the new name
        setNewFolderOpen(false);
        widget.openNewFolder(newFolderData["parent"], newFolderData["path"], datastore, datastorePassword, name);
    };
    const onNewFolder = (parent, path) => {
        // called whenever someone clicks on a new folder Icon
        setNewFolderOpen(true);
        setNewFolderData({
            parent: parent,
            path: path,
        });
    };

    const onSelectNode = (parent, path, nodePath) => {
        setPath(Array.from(nodePath));
    };

    const isSelectable = (node) => {
        // filter out all targets that are a share if the item is not allowed to be shared
        if (!item.share_rights.grant && node.share_id) {
            return false;
        }
        // filter out all targets that are inside of a share if the item is not allowed to be shared
        if (!item.share_rights.grant && node.parent_share_id) {
            return false;
        }
        //
        if (!node.hasOwnProperty("share_rights")) {
            return true;
        }
        // we need both read and write permission on the target folder in order to update it with the new content
        if (!!(node.share_rights.read && node.share_rights.write)) {
            return true;
        }

        return false;
    };

    const onConfirm = () => {
        const onSuccess = function (datastore) {
            const breadcrumbs = { id_breadcrumbs: path.map((node) => node.id) };

            const analyzedBreadcrumbs = datastorePassword.analyzeBreadcrumbs(breadcrumbs, datastore);

            if (item.share_right_grant === false && typeof analyzedBreadcrumbs["parent_share_id"] !== "undefined") {
                // No grant right, yet the parent is a a share?!?
                alert("Wups, this should not happen. Error: 781f3da7-d38b-470e-a3c8-dd5787642230");
            }

            const onSuccess = function (share) {
                if (typeof share.name === "undefined") {
                    share.name = item.share_right_title;
                }

                const shares = [share];

                const onSuccess = function () {
                    onClose();
                };
                const onError = function (data) {
                    console.log(data);
                };

                return datastorePassword
                    .createShareLinksInDatastore(
                        shares,
                        analyzedBreadcrumbs["target"],
                        analyzedBreadcrumbs["parent_path"],
                        analyzedBreadcrumbs["path"],
                        analyzedBreadcrumbs["parent_share_id"],
                        analyzedBreadcrumbs["parent_datastore_id"],
                        datastore,
                        analyzedBreadcrumbs["parent_share"]
                    )
                    .then(onSuccess, onError);
            };

            const onError = function (data) {
                //pass
                console.log(data);
            };
            return shareService
                .acceptShareRight(item.share_right_id, item.share_right_key, item.share_right_key_nonce, user.data.user_public_key)
                .then(onSuccess, onError);
        };
        const onError = function (data) {
            //pass
            console.log(data);
        };

        return datastorePassword.getPasswordDatastore().then(onSuccess, onError);
    };

    return (
        <Dialog
            fullWidth
            maxWidth={"sm"}
            open={open}
            onClose={() => {
                onClose();
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{t("ACCEPT_SHARE")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextFieldPath className={classes.textField} variant="outlined" margin="dense" value={path} setPath={setPath} />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} className={classes.tree}>
                        {datastore && <DatastoreTree datastore={datastore} onNewFolder={onNewFolder} onSelectNode={onSelectNode} isSelectable={isSelectable} />}
                        {newFolderOpen && <DialogNewFolder open={newFolderOpen} onClose={() => setNewFolderOpen(false)} onCreate={onNewFolderCreate} />}
                    </Grid>
                    {!hideUser && (
                        <Grid item xs={12} sm={12} md={12}>
                            {t("SHARED_BY")}:
                        </Grid>
                    )}
                    {!hideUser && Boolean(user.data.user_name) && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="username"
                                label={t("USERNAME") + " " + (userIsTrusted ? "" : t("NOT_TRUSTED_BRACKETS"))}
                                name="username"
                                autoComplete="username"
                                value={user.data.user_name}
                                disabled
                            />
                        </Grid>
                    )}
                    {!hideUser && !Boolean(user.data.user_name) && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="username"
                                label={t("USERNAME") + " " + (userIsTrusted ? "" : t("NOT_TRUSTED_BRACKETS"))}
                                name="username"
                                autoComplete="username"
                                value={user.data.user_username}
                                disabled
                            />
                        </Grid>
                    )}
                    {!hideUser && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="publicKey"
                                label={t("PUBLIC_KEY") + " " + (userIsTrusted ? "" : t("NOT_TRUSTED_BRACKETS"))}
                                name="publicKey"
                                autoComplete="publicKey"
                                value={user.data.user_public_key}
                                disabled
                            />
                        </Grid>
                    )}
                    {!userIsTrusted && !hideUser && (
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
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        onClose();
                    }}
                >
                    {t("CLOSE")}
                </Button>
                <Button onClick={onConfirm} variant="contained" color="primary">
                    {t("OK")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

DialogAcceptShare.defaultProps = {
    hideUser: false,
};

DialogAcceptShare.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    item: PropTypes.object.isRequired,
    hideUser: PropTypes.bool.isRequired,
};

export default DialogAcceptShare;
