import React, { useState } from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import datastorePassword from "../services/datastore-password";
import widget from "../services/widget";
import { ClipLoader } from "react-spinners";
import DatastoreTree from "../components/datastore-tree";
import DialogNewFolder from "../components/dialogs/new-folder";
import DialogNewShare from "../components/dialogs/new-share";

const useStyles = makeStyles((theme) => ({
    loader: {
        marginTop: "30px",
        marginBottom: "30px",
        margin: "auto",
    },
}));

const PasswordDatastore = (props) => {
    const classes = useStyles();
    const { search } = props;
    let isSubscribed = true;
    const [datastore, setDatastore] = useState(null);
    const [newFolderOpen, setNewFolderOpen] = useState(false);
    const [newFolderData, setNewFolderData] = useState({});
    const [newShareOpen, setNewShareOpen] = useState(false);

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

    const onNewShareCreate = (name) => {
        // called once someone clicked the CREATE button in the dialog closes with the new name
        setNewFolderOpen(false);

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
        setNewFolderOpen(true);
        setNewFolderData({
            parent: parent,
            path: path,
        });
    };

    datastorePassword.modifyTreeForSearch(search, datastore);

    return (
        <>
            {!datastore && (
                <div className={classes.loader}>
                    <ClipLoader />
                </div>
            )}
            {datastore && <DatastoreTree datastore={datastore} search={search} onNewFolder={onNewFolder} onNewShare={onNewShare} />}
            {newFolderOpen && <DialogNewFolder open={newFolderOpen} onClose={() => setNewFolderOpen(false)} onCreate={onNewFolderCreate} />}
            {newShareOpen && <DialogNewShare open={newShareOpen} onClose={() => setNewShareOpen(false)} onShare={onNewShareCreate} />}
        </>
    );
};

PasswordDatastore.propTypes = {
    search: PropTypes.string.isRequired,
};

export default PasswordDatastore;
