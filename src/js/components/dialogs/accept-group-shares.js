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
import DatastoreTree from "../datastore-tree";
import widget from "../../services/widget";
import datastorePassword from "../../services/datastore-password";
import DialogNewFolder from "./new-folder";
import TextFieldPath from "../text-field/path";
import groupsService from "../../services/groups";
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

const DialogAcceptGroupShares = (props) => {
    const { open, onClose, group, outstandingShareIndex, hideUser, title } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [path, setPath] = useState([]);
    const [newFolderOpen, setNewFolderOpen] = useState(false);
    const [newFolderData, setNewFolderData] = useState({});
    const [search, setSearch] = useState("");

    const [datastore, setDatastore] = useState(null);

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
        if (node.share_id) {
            return false;
        }
        // filter out all targets that are inside of a share if the item is not allowed to be shared
        if (node.parent_share_id) {
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

            if (typeof analyzedBreadcrumbs["parent_share_id"] !== "undefined") {
                // No grant right, yet the parent is a a share?!?
                alert("Wups, this should not happen. Error: 405989c9-44c7-4fe7-b443-4ee7c8e07ed1");
                return;
            }

            const onSuccess = function (group_details) {
                const encryptedShares = [];
                for (let i = 0; i < group_details.group_share_rights.length; i++) {
                    const share = group_details.group_share_rights[i];
                    if (!outstandingShareIndex.hasOwnProperty(share.share_id)) {
                        continue;
                    }
                    share.share_key = share.key;
                    share.share_key_nonce = share.key_nonce;
                    share.share_title = share.title;
                    share.share_title_nonce = share.title_nonce;
                    share.share_type = share.type;
                    share.share_type_nonce = share.type_nonce;
                    encryptedShares.push(share);
                }

                const shares = groupsService.decryptGroupShares(group.group_id, encryptedShares);

                return datastorePassword
                    .createShareLinksInDatastore(
                        shares,
                        analyzedBreadcrumbs["target"],
                        analyzedBreadcrumbs["parent_path"],
                        analyzedBreadcrumbs["path"],
                        analyzedBreadcrumbs["parent_share_id"],
                        analyzedBreadcrumbs["parent_datastore_id"],
                        analyzedBreadcrumbs["parent_share"],
                        datastore
                    )
                    .then(
                        () => {
                            onClose();
                        },
                        (data) => {
                            //pass
                            console.log(data);
                        }
                    );
            };

            const onError = function (data) {
                //pass
            };

            return groupsService.readGroup(group.group_id).then(onSuccess, onError);
        };
        const onError = function (data) {
            //pass
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
                </div>
            </DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextFieldPath
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
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
                            {t("INVITED_BY")}:
                        </Grid>
                    )}
                    {!hideUser && <TrustedUser user_id={group.user_id} user_username={group.user_username} />}
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

DialogAcceptGroupShares.defaultProps = {
    hideUser: false,
    title: "ACCEPT_NEW_SHARES",
};

DialogAcceptGroupShares.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    group: PropTypes.object.isRequired,
    outstandingShareIndex: PropTypes.object.isRequired,
    hideUser: PropTypes.bool.isRequired,
    title: PropTypes.string,
};

export default DialogAcceptGroupShares;
