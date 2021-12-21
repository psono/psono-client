import React, { useState } from "react";
import { connect, useSelector } from "react-redux";
import { bindActionCreators } from "redux";
import { useTranslation } from "react-i18next";
import { differenceInSeconds } from "date-fns";
import { ClipLoader } from "react-spinners";
import { alpha, makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import DeleteSweepIcon from "@material-ui/icons/DeleteSweep";
import InputBase from "@material-ui/core/InputBase";
import IconButton from "@material-ui/core/IconButton";
import MenuOpenIcon from "@material-ui/icons/MenuOpen";
import Divider from "@material-ui/core/Divider";
import ClearIcon from "@material-ui/icons/Clear";
import MuiAlert from "@material-ui/lab/Alert";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Typography from "@material-ui/core/Typography";
import CreateNewFolderIcon from "@material-ui/icons/CreateNewFolder";
import AddIcon from "@material-ui/icons/Add";

import actionCreators from "../../actions/action-creators";

import Base from "../../containers/base";
import BaseTitle from "../../containers/base-title";
import BaseContent from "../../containers/base-content";
import widget from "../../services/widget";
import datastorePassword from "../../services/datastore-password";
import DialogNewFolder from "../../components/dialogs/new-folder";
import DialogNewEntry from "../../components/dialogs/new-entry";
import DatastoreTree from "../../components/datastore-tree";
import DialogNewShare from "../../components/dialogs/new-share";
import DialogEditFolder from "../../components/dialogs/edit-folder";
import DialogEditEntry from "../../components/dialogs/edit-entry";
import fileTransferService from "../../services/file-transfer";
import secretService from "../../services/secret";
import { useParams } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        padding: "15px",
    },
    loader: {
        marginTop: "30px",
        marginBottom: "30px",
        margin: "auto",
    },
    toolbarRoot: {
        display: "flex",
    },
    toolbarTitle: {
        display: "none",
        [theme.breakpoints.up("sm")]: {
            display: "block",
        },
    },
    search: {
        borderRadius: theme.shape.borderRadius,
        backgroundColor: alpha(theme.palette.common.white, 0.25),
        "&:hover": {
            backgroundColor: alpha(theme.palette.common.white, 0.45),
        },
        marginLeft: "auto",
        position: "absolute",
        right: 0,
        [theme.breakpoints.up("sm")]: {
            marginRight: theme.spacing(1),
        },
    },
    inputRoot: {
        color: "inherit",
    },
    inputInput: {
        padding: theme.spacing(1, 1, 1, 0),
        fontSize: "0.875em",
        // vertical padding + font size from searchIcon
        paddingLeft: "1em",
        transition: theme.transitions.create("width"),
        width: "100%",
        [theme.breakpoints.up("sm")]: {
            width: "10ch",
            "&:focus": {
                width: "20ch",
            },
        },
    },
    iconButton: {
        padding: 10,
        display: "inline-flex",
    },
    divider: {
        height: 28,
        margin: 0,
        marginBottom: -10,
        display: "inline-flex",
    },
    topMessage: {
        marginBottom: 20,
    },
    icon: {
        fontSize: "18px",
    },
    listItemIcon: {
        minWidth: theme.spacing(4),
    },
}));

const DatastoreView = (props) => {
    let { defaultSearch } = useParams();
    const serverStatus = useSelector((state) => state.server.status);
    const recurrenceInterval = useSelector((state) => state.server.complianceCentralSecurityReportsRecurrenceInterval);
    const classes = useStyles();
    const { t } = useTranslation();
    const [search, setSearch] = useState(defaultSearch || "");
    const [anchorEl, setAnchorEl] = useState(null);

    const [newFolderOpen, setNewFolderOpen] = useState(false);
    const [newFolderData, setNewFolderData] = useState({});

    const [newEntryOpen, setNewEntryOpen] = useState(false);
    const [newEntryData, setNewEntryData] = useState({});

    const [editFolderOpen, setEditFolderOpen] = useState(false);
    const [editFolderData, setEditFolderData] = useState({});

    const [editEntryOpen, setEditEntryOpen] = useState(false);
    const [editEntryData, setEditEntryData] = useState({});

    const [newShareOpen, setNewShareOpen] = useState(false);
    const [newShareData, setNewShareData] = useState({});

    const [datastore, setDatastore] = useState(null);

    let isSubscribed = true;
    React.useEffect(() => {
        datastorePassword.getPasswordDatastore().then(onNewDatastoreLoaded);
        return () => (isSubscribed = false);
    }, []);

    const onNewDatastoreLoaded = (data) => {
        if (!isSubscribed) {
            return;
        }
        setDatastore(data);
    };

    const onClear = () => {
        setSearch("");
    };

    let newSecurityReport = "NOT_REQUIRED";
    if (recurrenceInterval > 0) {
        if (
            serverStatus.hasOwnProperty("data") &&
            serverStatus.data.hasOwnProperty("last_security_report_created") &&
            serverStatus.data.last_security_report_created !== null
        ) {
            const lastSecurityReportAgeSeconds = differenceInSeconds(new Date(), new Date(serverStatus.data.last_security_report_created));

            if (lastSecurityReportAgeSeconds > recurrenceInterval) {
                newSecurityReport = "REQUIRED";
            } else {
                const days_28 = 28 * 24 * 3600;
                const days_14 = 14 * 24 * 3600;
                if (recurrenceInterval >= days_28 && lastSecurityReportAgeSeconds > recurrenceInterval - days_14) {
                    newSecurityReport = "SOON_REQUIRED";
                } else {
                    newSecurityReport = "NOT_REQUIRED";
                }
            }
        } else {
            newSecurityReport = "REQUIRED";
        }
    }

    const onNewShareCreate = (name) => {
        // called once someone clicked the CREATE button in the dialog closes with the new name
        setNewShareOpen(false);

        // const onShare = (event) => {
        //     handleClose(event);
        //     if (content.hasOwnProperty("share_rights") && content.share_rights.grant === false) {
        //         return;
        //     }
        //
        //     /**
        //      * little wrapper to create the share rights from the selected users / groups and rights for a given nonce and
        //      * a given share_id and key
        //      *
        //      * @param share_id
        //      * @param share_secret_key
        //      * @param node
        //      * @param users
        //      * @param groups
        //      * @param selected_users
        //      * @param selected_groups
        //      * @param selected_rights
        //      */
        //     var create_share_rights = function (share_id, share_secret_key, node, users, groups, selected_users, selected_groups, selected_rights) {
        //         var i;
        //         var modalInstance;
        //
        //         // found a user that has been selected, lets create the rights for him
        //         var rights = {
        //             read: selected_rights.indexOf("read") > -1,
        //             write: selected_rights.indexOf("write") > -1,
        //             grant: selected_rights.indexOf("grant") > -1,
        //         };
        //
        //         // generate the title
        //         // TODO create form field with this default value and read value from form
        //
        //         var title = "";
        //         if (typeof node.type === "undefined") {
        //             // we have a folder
        //             title = "Folder with title '" + node.name + "'";
        //         } else {
        //             // we have an item
        //             title = _blueprints[node.type].name + " with title '" + node.name + "'";
        //         }
        //
        //         // get the type
        //         var type = "";
        //         if (typeof node.type === "undefined") {
        //             // we have a folder
        //             type = "folder";
        //         } else {
        //             // we have an item
        //             type = node.type;
        //         }
        //
        //         function create_user_share_right(user) {
        //             var onSuccess = function (data) {
        //                 // pass
        //             };
        //             var onError = function (result) {
        //                 var title;
        //                 var description;
        //                 if (result.data === null) {
        //                     title = "UNKNOWN_ERROR";
        //                     description = "UNKNOWN_ERROR_CHECK_BROWSER_CONSOLE";
        //                 } else if (
        //                     result.data.hasOwnProperty("non_field_errors") &&
        //                     (result.data["non_field_errors"].indexOf("USER_DOES_NOT_EXIST_PROBABLY_DELETED") !== -1 ||
        //                         result.data["non_field_errors"].indexOf("Target user does not exist.") !== -1)
        //                 ) {
        //                     title = "UNKNOWN_USER";
        //                     description = _translations.USER_DOES_NOT_EXIST_PROBABLY_DELETED + " " + user.name;
        //                 } else if (result.data.hasOwnProperty("non_field_errors")) {
        //                     title = "ERROR";
        //                     description = result.data["non_field_errors"][0];
        //                 } else {
        //                     title = "UNKNOWN_ERROR";
        //                     description = "UNKNOWN_ERROR_CHECK_BROWSER_CONSOLE";
        //                 }
        //
        //                 modalInstance = $uibModal.open({
        //                     templateUrl: "view/modal/error.html",
        //                     controller: "ModalErrorCtrl",
        //                     resolve: {
        //                         title: function () {
        //                             return title;
        //                         },
        //                         description: function () {
        //                             return description;
        //                         },
        //                     },
        //                 });
        //
        //                 modalInstance.result.then(
        //                     function (breadcrumbs) {
        //                         // pass
        //                     },
        //                     function () {
        //                         // cancel triggered
        //                     }
        //                 );
        //             };
        //
        //             return registrations["create_share_right"](
        //                 title,
        //                 type,
        //                 share_id,
        //                 user.data.user_id,
        //                 undefined,
        //                 user.data.user_public_key,
        //                 undefined,
        //                 share_secret_key,
        //                 rights["read"],
        //                 rights["write"],
        //                 rights["grant"]
        //             ).then(onSuccess, onError);
        //         }
        //
        //         for (i = 0; i < users.length; i++) {
        //             if (selected_users.indexOf(users[i].id) < 0) {
        //                 continue;
        //             }
        //             create_user_share_right(users[i]);
        //         }
        //
        //         function create_group_share_right(group) {
        //             var onSuccess = function (data) {
        //                 // pass
        //             };
        //             var onError = function (result) {
        //                 var title;
        //                 var description;
        //                 if (result.data === null) {
        //                     title = "UNKNOWN_ERROR";
        //                     description = "UNKNOWN_ERROR_CHECK_BROWSER_CONSOLE";
        //                 } else if (result.data.hasOwnProperty("non_field_errors")) {
        //                     title = "ERROR";
        //                     description = result.data["non_field_errors"][0];
        //                 } else {
        //                     title = "UNKNOWN_ERROR";
        //                     description = "UNKNOWN_ERROR_CHECK_BROWSER_CONSOLE";
        //                 }
        //
        //                 modalInstance = $uibModal.open({
        //                     templateUrl: "view/modal/error.html",
        //                     controller: "ModalErrorCtrl",
        //                     resolve: {
        //                         title: function () {
        //                             return title;
        //                         },
        //                         description: function () {
        //                             return description;
        //                         },
        //                     },
        //                 });
        //
        //                 modalInstance.result.then(
        //                     function (breadcrumbs) {
        //                         // pass
        //                     },
        //                     function () {
        //                         // cancel triggered
        //                     }
        //                 );
        //             };
        //
        //             var group_secret_key = registrations["get_group_secret_key"](
        //                 group.group_id,
        //                 group.secret_key,
        //                 group.secret_key_nonce,
        //                 group.secret_key_type,
        //                 group.public_key
        //             );
        //             return registrations["create_share_right"](
        //                 title,
        //                 type,
        //                 share_id,
        //                 undefined,
        //                 group.group_id,
        //                 undefined,
        //                 group_secret_key,
        //                 share_secret_key,
        //                 rights["read"],
        //                 rights["write"],
        //                 rights["grant"]
        //             ).then(onSuccess, onError);
        //         }
        //
        //         for (i = 0; i < groups.length; i++) {
        //             if (selected_groups.indexOf(groups[i].group_id) < 0) {
        //                 continue;
        //             }
        //             create_group_share_right(groups[i]);
        //         }
        //     };
        //
        //     /**
        //      * Users and or / shares have been selected in the modal and the final "Share Now" button was
        //      * clicked
        //      *
        //      * @param content
        //      */
        //     var on_modal_close_success = function (content) {
        //         // content = { node: "...", path: "...", selected_users: "...", users: "..."}
        //
        //         var has_no_users = !content.users || content.users.length < 1 || !content.selected_users || content.selected_users.length < 1;
        //
        //         var has_no_groups = !content.groups || content.groups.length < 1 || !content.selected_groups || content.selected_groups.length < 1;
        //
        //         if (has_no_users && has_no_groups) {
        //             // TODO echo not shared message because no user / group selected
        //             return;
        //         }
        //
        //         if (content.node.hasOwnProperty("share_id")) {
        //             // its already a share, so generate only the share_rights
        //
        //             create_share_rights(
        //                 content.node.share_id,
        //                 content.node.share_secret_key,
        //                 content.node,
        //                 content.users,
        //                 content.groups,
        //                 content.selected_users,
        //                 content.selected_groups,
        //                 content.selected_rights
        //             );
        //         } else {
        //             // its not yet a share, so generate the share, generate the share_rights and update
        //             // the datastore
        //
        //             registrations["get_password_datastore"]().then(function (datastore) {
        //                 var path = content.path.slice();
        //                 var closest_share_info = registrations["get_closest_parent_share"](path, datastore, null, 1);
        //                 var parent_share = closest_share_info["closest_share"];
        //                 var parent_share_id;
        //                 var parent_datastore_id;
        //
        //                 if (parent_share !== false && parent_share !== null) {
        //                     parent_share_id = parent_share.share_id;
        //                 } else {
        //                     parent_datastore_id = datastore.datastore_id;
        //                 }
        //
        //                 // create the share
        //                 registrations["create_share"](content.node, parent_share_id, parent_datastore_id, content.node.id).then(function (share_details) {
        //                     var item_path = content.path.slice();
        //                     var item_path_copy = content.path.slice();
        //                     var item_path_copy2 = content.path.slice();
        //
        //                     // create the share right
        //                     create_share_rights(
        //                         share_details.share_id,
        //                         share_details.secret_key,
        //                         content.node,
        //                         content.users,
        //                         content.groups,
        //                         content.selected_users,
        //                         content.selected_groups,
        //                         content.selected_rights
        //                     );
        //
        //                     // update datastore and / or possible parent shares
        //                     var search = registrations["find_in_datastore"](item_path, datastore);
        //
        //                     if (typeof content.node.type === "undefined") {
        //                         // we have an item
        //                         delete search[0][search[1]].secret_id;
        //                         delete search[0][search[1]].secret_key;
        //                     }
        //                     search[0][search[1]].share_id = share_details.share_id;
        //                     search[0][search[1]].share_secret_key = share_details.secret_key;
        //
        //                     // update node in our displayed datastore
        //                     content.node.share_id = share_details.share_id;
        //                     content.node.share_secret_key = share_details.secret_key;
        //
        //                     var changed_paths = registrations["on_share_added"](share_details.share_id, item_path_copy, datastore, 1);
        //
        //                     var parent_path = item_path_copy2.slice();
        //                     parent_path.pop();
        //
        //                     changed_paths.push(parent_path);
        //
        //                     registrations["save_datastore_content"](datastore, changed_paths);
        //                 });
        //             });
        //         }
        //     };
        //
        //     var modalInstance = $uibModal.open({
        //         templateUrl: "view/modal/share-entry.html",
        //         controller: "ModalShareEntryCtrl",
        //         backdrop: "static",
        //         resolve: {
        //             node: function () {
        //                 return item;
        //             },
        //             path: function () {
        //                 return path;
        //             },
        //         },
        //     });
        //
        //     // User clicked the final share button
        //     modalInstance.result.then(on_modal_close_success, function () {
        //         // cancel triggered
        //     });
        // };
    };
    const onNewShare = (parent, path) => {
        // called whenever someone clicks on a new folder Icon
        setNewShareOpen(true);
        setNewShareData({
            parent: parent,
            path: path,
        });
    };

    const onNewFolderCreate = (name) => {
        // called once someone clicked the CREATE button in the dialog closes with the new name
        setNewFolderOpen(false);
        widget.openNewFolder(newFolderData["parent"], newFolderData["path"], datastore, datastorePassword, name);
    };
    const onNewFolder = (parent, path) => {
        setAnchorEl(null);
        // called whenever someone clicks on a new folder Icon
        setNewFolderOpen(true);
        setNewFolderData({
            parent: parent,
            path: path,
        });
    };

    const onNewEntryCreate = (name) => {
        // called once someone clicked the CREATE button in the dialog closes with the new name
        setNewEntryOpen(false);
        widget.openNewEntry(newEntryData["parent"], newEntryData["path"], datastore, datastorePassword, name);
    };
    const onNewEntry = (parent, path) => {
        setAnchorEl(null);
        // called whenever someone clicks on a new folder Icon
        setNewEntryOpen(true);
        setNewEntryData({
            parent: parent,
            path: path,
        });
    };

    const onEditFolderSave = (node) => {
        setEditFolderOpen(false);
        widget.openEditFolder(node, editFolderData.path, datastore, datastorePassword);
    };
    const onEditFolder = (node, path) => {
        setEditFolderData({
            node: node,
            path: path,
        });
        setEditFolderOpen(true);
    };

    const onEditEntrySave = (node) => {
        setEditEntryOpen(false);
        widget.openEditEntry(node, editEntryData.path, datastore, datastorePassword);
    };

    const onEditEntry = (item, path) => {
        setEditEntryData({
            item: item,
            path: path,
        });
        setEditEntryOpen(true);
    };

    const onLinkItem = (item, path) => {
        if (item.type === "file") {
            return fileTransferService.onItemClick(item);
        } else {
            return secretService.onItemClick(item);
        }
    };
    const openMenu = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setAnchorEl(null);
    };

    return (
        <Base {...props}>
            <BaseTitle>{t("DATASTORE")}</BaseTitle>
            {(newSecurityReport === "SOON_REQUIRED" || newSecurityReport === "REQUIRED") && (
                <Paper square className={classes.topMessage}>
                    <MuiAlert
                        severity={newSecurityReport === "REQUIRED" ? "error" : "info"}
                        style={{
                            marginBottom: "5px",
                            marginTop: "5px",
                        }}
                    >
                        {newSecurityReport === "REQUIRED" ? t("SECURITY_REPORT_REQUIRED") : t("SECURITY_REPORT_SOON_REQUIRED")}
                    </MuiAlert>
                </Paper>
            )}
            <BaseContent>
                <Paper square>
                    <AppBar elevation={0} position="static" color="default">
                        <Toolbar className={classes.toolbarRoot}>
                            <span className={classes.toolbarTitle}>{t("DATASTORE")}</span>
                            <div className={classes.search}>
                                <InputBase
                                    placeholder={t("SEARCH")}
                                    classes={{
                                        root: classes.inputRoot,
                                        input: classes.inputInput,
                                    }}
                                    value={search}
                                    onChange={(event) => {
                                        setSearch(event.target.value);
                                    }}
                                    inputProps={{ "aria-label": t("SEARCH") }}
                                />
                                <IconButton className={classes.iconButton} aria-label="clear" onClick={onClear}>
                                    <ClearIcon />
                                </IconButton>
                                <Divider className={classes.divider} orientation="vertical" />
                                <IconButton color="primary" className={classes.iconButton} aria-label="menu" onClick={openMenu}>
                                    <MenuOpenIcon />
                                </IconButton>
                                <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
                                    <MenuItem onClick={() => onNewFolder(datastore, [])}>
                                        <ListItemIcon className={classes.listItemIcon}>
                                            <CreateNewFolderIcon className={classes.icon} fontSize="small" />
                                        </ListItemIcon>
                                        <Typography variant="body2" noWrap>
                                            {t("NEW_FOLDER")}
                                        </Typography>
                                    </MenuItem>
                                    <MenuItem onClick={() => onNewEntry(datastore, [])}>
                                        <ListItemIcon className={classes.listItemIcon}>
                                            <AddIcon className={classes.icon} fontSize="small" />
                                        </ListItemIcon>
                                        <Typography variant="body2" noWrap>
                                            {t("NEW_ENTRY")}
                                        </Typography>
                                    </MenuItem>
                                </Menu>
                                <Divider className={classes.divider} orientation="vertical" />
                                <IconButton className={classes.iconButton} aria-label="trash bin">
                                    <DeleteSweepIcon />
                                </IconButton>
                            </div>
                        </Toolbar>
                    </AppBar>
                    <div className={classes.root}>
                        {!datastore && (
                            <div className={classes.loader}>
                                <ClipLoader />
                            </div>
                        )}
                        {datastore && (
                            <DatastoreTree
                                datastore={datastore}
                                search={search}
                                onNewFolder={onNewFolder}
                                onNewEntry={onNewEntry}
                                onNewShare={onNewShare}
                                onEditEntry={onEditEntry}
                                onEditFolder={onEditFolder}
                                onSelectItem={onEditEntry}
                                onLinkItem={onLinkItem}
                            />
                        )}
                        {newShareOpen && <DialogNewShare open={newShareOpen} onClose={() => setNewShareOpen(false)} onShare={onNewShareCreate} />}
                        {newFolderOpen && <DialogNewFolder open={newFolderOpen} onClose={() => setNewFolderOpen(false)} onCreate={onNewFolderCreate} />}
                        {editFolderOpen && (
                            <DialogEditFolder
                                open={editFolderOpen}
                                onClose={() => setEditFolderOpen(false)}
                                onSave={onEditFolderSave}
                                node={editFolderData.node}
                            />
                        )}
                        {editEntryOpen && (
                            <DialogEditEntry open={editEntryOpen} onClose={() => setEditEntryOpen(false)} onSave={onEditEntrySave} item={editEntryData.item} />
                        )}
                        {newEntryOpen && <DialogNewEntry open={newEntryOpen} onClose={() => setNewEntryOpen(false)} onCreate={onNewEntryCreate} />}
                    </div>
                </Paper>
            </BaseContent>
        </Base>
    );
};

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default DatastoreView;
