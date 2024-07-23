import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

import { Grid } from "@mui/material";
import DatastoreTree from "../datastore-tree";
import widget from "../../services/widget";
import datastorePassword from "../../services/datastore-password";
import DialogNewFolder from "./new-folder";
import TextFieldPath from "../text-field/path";
import shareService from "../../services/share";
import TrustedUser from "../trusted-user";
import Search from "../search";

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
    search: {
        backgroundColor: theme.palette.common.white,
        position: "absolute",
        right: "28px",
        top: theme.spacing(2),
    },
}));

const DialogAcceptShare = (props) => {
    const { open, onClose, item, hideUser, title } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [path, setPath] = useState([]);
    const [newFolderOpen, setNewFolderOpen] = useState(false);
    const [newFolderData, setNewFolderData] = useState({});
    const [search, setSearch] = useState("");

    const [datastore, setDatastore] = useState(null);
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
        datastorePassword.getPasswordDatastore().then(onNewDatastoreLoaded);
        // cancel subscription to useEffect
        return () => (isSubscribed = false);
    }, []);

    const onNewDatastoreLoaded = (data) => {
        if (!isSubscribed) {
            return;
        }
        setDatastore(data);
    };

    const onNewFolderCreate = (name) => {
        // called once someone clicked the CREATE button in the dialog closes with the new name
        setNewFolderOpen(false);
        widget.newFolderSave(newFolderData["parent"], newFolderData["path"], datastore, datastorePassword, name);
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
        if (!item.share_right_grant && node.share_id) {
            return false;
        }
        // filter out all targets that are inside of a share if the item is not allowed to be shared
        if (!item.share_right_grant && node.parent_share_id) {
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
                .acceptShareRight(
                    item.share_right_id,
                    item.share_right_key,
                    item.share_right_key_nonce,
                    user.data.user_public_key
                )
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
            <DialogTitle id="alert-dialog-title">
                {t(title)}
                <div className={classes.search}>
                    <Search
                        value={search}
                        onChange={(newValue) => {
                            setSearch(newValue)
                        }}
                    />
                </div></DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextFieldPath
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            value={path}
                            setPath={setPath}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} className={classes.tree}>
                        {datastore && (
                            <DatastoreTree
                                datastore={datastore}
                                setDatastore={setDatastore}
                                onNewFolder={onNewFolder}
                                onSelectNode={onSelectNode}
                                isSelectable={isSelectable}
                                search={search}
                                deleteFolderLabel={t('DELETE')}
                                deleteItemLabel={t('DELETE')}
                            />
                        )}
                        {newFolderOpen && (
                            <DialogNewFolder
                                open={newFolderOpen}
                                onClose={() => setNewFolderOpen(false)}
                                onCreate={onNewFolderCreate}
                            />
                        )}
                    </Grid>
                    {!hideUser && (
                        <Grid
                            item
                            xs={12}
                            sm={12}
                            md={12}
                            style={{
                                marginBottom: "8px",
                            }}
                        >
                            {t("SHARED_BY")}:
                        </Grid>
                    )}
                    {!hideUser && (
                        <TrustedUser
                            user_id={item.share_right_create_user_id}
                            user_username={item.share_right_create_user_username}
                            onSetUser={setUser}
                        />
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
    title: "ACCEPT_SHARE",
};

DialogAcceptShare.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    item: PropTypes.object.isRequired,
    hideUser: PropTypes.bool.isRequired,
    title: PropTypes.string,
};

export default DialogAcceptShare;
