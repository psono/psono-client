import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import GetAppIcon from "@material-ui/icons/GetApp";
import SettingsIcon from "@material-ui/icons/Settings";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListIcon from "@material-ui/icons/List";
import ShareIcon from "@material-ui/icons/Share";
import Typography from "@material-ui/core/Typography";
import LinkIcon from "@material-ui/icons/Link";
import EditIcon from "@material-ui/icons/Edit";
import CreateNewFolderIcon from "@material-ui/icons/CreateNewFolder";
import AddIcon from "@material-ui/icons/Add";
import OpenWithIcon from "@material-ui/icons/OpenWith";
import DeleteIcon from "@material-ui/icons/Delete";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import Divider from "@material-ui/core/Divider";
import ContentCopy from "../components/icons/ContentCopy";
import offlineCache from "../services/offline-cache";
import widgetService from "../services/widget";
import secretService from "../services/secret";
import fileTransferService from "../services/file-transfer";
import store from "../services/store";

const Folder = (props) => {
    const { t } = useTranslation();
    const { content, search, offline, isExpandedDefault } = props;
    const [isExpanded, setIsExpanded] = React.useState(isExpandedDefault);
    const [anchorEl, setAnchorEl] = React.useState(null);

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

    const onShare = (event) => {
        handleClose(event);
        if (content.hasOwnProperty("share_rights") && content.share_rights.grant === false) {
            return;
        }

        /**
         * little wrapper to create the share rights from the selected users / groups and rights for a given nonce and
         * a given share_id and key
         *
         * @param share_id
         * @param share_secret_key
         * @param node
         * @param users
         * @param groups
         * @param selected_users
         * @param selected_groups
         * @param selected_rights
         */
        var create_share_rights = function (share_id, share_secret_key, node, users, groups, selected_users, selected_groups, selected_rights) {
            var i;
            var modalInstance;

            // found a user that has been selected, lets create the rights for him
            var rights = {
                read: selected_rights.indexOf("read") > -1,
                write: selected_rights.indexOf("write") > -1,
                grant: selected_rights.indexOf("grant") > -1,
            };

            // generate the title
            // TODO create form field with this default value and read value from form

            var title = "";
            if (typeof node.type === "undefined") {
                // we have a folder
                title = "Folder with title '" + node.name + "'";
            } else {
                // we have an item
                title = _blueprints[node.type].name + " with title '" + node.name + "'";
            }

            // get the type
            var type = "";
            if (typeof node.type === "undefined") {
                // we have a folder
                type = "folder";
            } else {
                // we have an item
                type = node.type;
            }

            function create_user_share_right(user) {
                var onSuccess = function (data) {
                    // pass
                };
                var onError = function (result) {
                    var title;
                    var description;
                    if (result.data === null) {
                        title = "UNKNOWN_ERROR";
                        description = "UNKNOWN_ERROR_CHECK_BROWSER_CONSOLE";
                    } else if (
                        result.data.hasOwnProperty("non_field_errors") &&
                        (result.data["non_field_errors"].indexOf("USER_DOES_NOT_EXIST_PROBABLY_DELETED") !== -1 ||
                            result.data["non_field_errors"].indexOf("Target user does not exist.") !== -1)
                    ) {
                        title = "UNKNOWN_USER";
                        description = _translations.USER_DOES_NOT_EXIST_PROBABLY_DELETED + " " + user.name;
                    } else if (result.data.hasOwnProperty("non_field_errors")) {
                        title = "ERROR";
                        description = result.data["non_field_errors"][0];
                    } else {
                        title = "UNKNOWN_ERROR";
                        description = "UNKNOWN_ERROR_CHECK_BROWSER_CONSOLE";
                    }

                    modalInstance = $uibModal.open({
                        templateUrl: "view/modal/error.html",
                        controller: "ModalErrorCtrl",
                        resolve: {
                            title: function () {
                                return title;
                            },
                            description: function () {
                                return description;
                            },
                        },
                    });

                    modalInstance.result.then(
                        function (breadcrumbs) {
                            // pass
                        },
                        function () {
                            // cancel triggered
                        }
                    );
                };

                return registrations["create_share_right"](
                    title,
                    type,
                    share_id,
                    user.data.user_id,
                    undefined,
                    user.data.user_public_key,
                    undefined,
                    share_secret_key,
                    rights["read"],
                    rights["write"],
                    rights["grant"]
                ).then(onSuccess, onError);
            }

            for (i = 0; i < users.length; i++) {
                if (selected_users.indexOf(users[i].id) < 0) {
                    continue;
                }
                create_user_share_right(users[i]);
            }

            function create_group_share_right(group) {
                var onSuccess = function (data) {
                    // pass
                };
                var onError = function (result) {
                    var title;
                    var description;
                    if (result.data === null) {
                        title = "UNKNOWN_ERROR";
                        description = "UNKNOWN_ERROR_CHECK_BROWSER_CONSOLE";
                    } else if (result.data.hasOwnProperty("non_field_errors")) {
                        title = "ERROR";
                        description = result.data["non_field_errors"][0];
                    } else {
                        title = "UNKNOWN_ERROR";
                        description = "UNKNOWN_ERROR_CHECK_BROWSER_CONSOLE";
                    }

                    modalInstance = $uibModal.open({
                        templateUrl: "view/modal/error.html",
                        controller: "ModalErrorCtrl",
                        resolve: {
                            title: function () {
                                return title;
                            },
                            description: function () {
                                return description;
                            },
                        },
                    });

                    modalInstance.result.then(
                        function (breadcrumbs) {
                            // pass
                        },
                        function () {
                            // cancel triggered
                        }
                    );
                };

                var group_secret_key = registrations["get_group_secret_key"](
                    group.group_id,
                    group.secret_key,
                    group.secret_key_nonce,
                    group.secret_key_type,
                    group.public_key
                );
                return registrations["create_share_right"](
                    title,
                    type,
                    share_id,
                    undefined,
                    group.group_id,
                    undefined,
                    group_secret_key,
                    share_secret_key,
                    rights["read"],
                    rights["write"],
                    rights["grant"]
                ).then(onSuccess, onError);
            }

            for (i = 0; i < groups.length; i++) {
                if (selected_groups.indexOf(groups[i].group_id) < 0) {
                    continue;
                }
                create_group_share_right(groups[i]);
            }
        };

        /**
         * Users and or / shares have been selected in the modal and the final "Share Now" button was
         * clicked
         *
         * @param content
         */
        var on_modal_close_success = function (content) {
            // content = { node: "...", path: "...", selected_users: "...", users: "..."}

            var has_no_users = !content.users || content.users.length < 1 || !content.selected_users || content.selected_users.length < 1;

            var has_no_groups = !content.groups || content.groups.length < 1 || !content.selected_groups || content.selected_groups.length < 1;

            if (has_no_users && has_no_groups) {
                // TODO echo not shared message because no user / group selected
                return;
            }

            if (content.node.hasOwnProperty("share_id")) {
                // its already a share, so generate only the share_rights

                create_share_rights(
                    content.node.share_id,
                    content.node.share_secret_key,
                    content.node,
                    content.users,
                    content.groups,
                    content.selected_users,
                    content.selected_groups,
                    content.selected_rights
                );
            } else {
                // its not yet a share, so generate the share, generate the share_rights and update
                // the datastore

                registrations["get_password_datastore"]().then(function (datastore) {
                    var path = content.path.slice();
                    var closest_share_info = registrations["get_closest_parent_share"](path, datastore, null, 1);
                    var parent_share = closest_share_info["closest_share"];
                    var parent_share_id;
                    var parent_datastore_id;

                    if (parent_share !== false && parent_share !== null) {
                        parent_share_id = parent_share.share_id;
                    } else {
                        parent_datastore_id = datastore.datastore_id;
                    }

                    // create the share
                    registrations["create_share"](content.node, parent_share_id, parent_datastore_id, content.node.id).then(function (share_details) {
                        var item_path = content.path.slice();
                        var item_path_copy = content.path.slice();
                        var item_path_copy2 = content.path.slice();

                        // create the share right
                        create_share_rights(
                            share_details.share_id,
                            share_details.secret_key,
                            content.node,
                            content.users,
                            content.groups,
                            content.selected_users,
                            content.selected_groups,
                            content.selected_rights
                        );

                        // update datastore and / or possible parent shares
                        var search = registrations["find_in_datastore"](item_path, datastore);

                        if (typeof content.node.type === "undefined") {
                            // we have an item
                            delete search[0][search[1]].secret_id;
                            delete search[0][search[1]].secret_key;
                        }
                        search[0][search[1]].share_id = share_details.share_id;
                        search[0][search[1]].share_secret_key = share_details.secret_key;

                        // update node in our displayed datastore
                        content.node.share_id = share_details.share_id;
                        content.node.share_secret_key = share_details.secret_key;

                        var changed_paths = registrations["on_share_added"](share_details.share_id, item_path_copy, datastore, 1);

                        var parent_path = item_path_copy2.slice();
                        parent_path.pop();

                        changed_paths.push(parent_path);

                        registrations["save_datastore_content"](datastore, changed_paths);
                    });
                });
            }
        };

        var modalInstance = $uibModal.open({
            templateUrl: "view/modal/share-entry.html",
            controller: "ModalShareEntryCtrl",
            backdrop: "static",
            resolve: {
                node: function () {
                    return item;
                },
                path: function () {
                    return path;
                },
            },
        });

        // User clicked the final share button
        modalInstance.result.then(on_modal_close_success, function () {
            // cancel triggered
        });
    };

    const onRightsOverview = (event) => {
        if (content.hasOwnProperty("share_rights") && content.share_rights.grant === false) {
            return;
        }

        registrations["read_share_rights"](content.share_id).then(function (share_details) {
            var modalInstance = $uibModal.open({
                templateUrl: "view/modal/display-share-rights.html",
                controller: "ModalDisplayShareRightsCtrl",
                backdrop: "static",
                size: "lg",
                resolve: {
                    node: function () {
                        return item;
                    },
                    path: function () {
                        return path;
                    },
                    share_details: function () {
                        return share_details;
                    },
                },
            });
        });
    };

    const onEdit = (event) => {
        // TODO editNode
    };

    const onNewFolder = (event) => {
        // TODO newFolder
    };

    const onNewEntry = (event) => {
        // TODO newEntryNode
    };

    const onMove = (event) => {
        // TODO moveNode
    };

    const selectNode = (event) => {
        event.stopPropagation();
        setIsExpanded(!isExpanded);
    };
    React.useEffect(() => {
        setIsExpanded(isExpandedDefault);
    }, [isExpandedDefault]);

    const hideShare = offline || (content.hasOwnProperty("share_rights") && content.share_rights.grant === false);
    const hideRightsOverview =
        offline ||
        (content.hasOwnProperty("share_rights") && content.share_rights.grant === false) ||
        !content.hasOwnProperty("share_id") ||
        typeof content.share_id === "undefined";
    const hideEdit = offline || content.share_rights.write === false;
    const hideNewFolder = offline || content.share_rights.write === false;
    const hideNewEntry = offline || content.share_rights.write === false;
    const hideMove = offline || content.share_rights.delete === false;
    const hideDelete = offline || content.share_rights.delete === false;

    return (
        <div className={"tree-folder"}>
            <div className={"tree-folder-title"}>
                <div className={"tree-folder-header"} onClick={selectNode}>
                    <span className="fa-stack">
                        {isExpanded && <i className="fa fa-folder-open" />}
                        {!isExpanded && <i className="fa fa-folder" />}
                        {content.share_id && <i className="fa fa-circle fa-stack-2x text-danger is-shared" />}
                        {content.share_id && <i className="fa fa-group fa-stack-2x is-shared" />}
                    </span>
                    <span className="tree-folder-name ng-binding">{content.name}</span>
                    <ButtonGroup variant="text" aria-label="text button group" className={"node-open-link"}>
                        <Button aria-label="settings" onClick={openMenu}>
                            <SettingsIcon fontSize="small" />
                        </Button>
                    </ButtonGroup>
                    <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
                        {!hideShare && (
                            <MenuItem onClick={onShare}>
                                <ListItemIcon>
                                    <ShareIcon fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="inherit" noWrap>
                                    {t("SHARE")}
                                </Typography>
                            </MenuItem>
                        )}
                        {!hideRightsOverview && (
                            <MenuItem onClick={onRightsOverview}>
                                <ListItemIcon>
                                    <ListIcon fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="inherit" noWrap>
                                    {t("RIGHTS_OVERVIEW")}
                                </Typography>
                            </MenuItem>
                        )}
                        {(!hideShare || !hideRightsOverview) && <Divider />}
                        {!hideEdit && (
                            <MenuItem onClick={onEdit}>
                                <ListItemIcon>
                                    <EditIcon fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="inherit" noWrap>
                                    {t("EDIT")}
                                </Typography>
                            </MenuItem>
                        )}
                        {!hideNewFolder && (
                            <MenuItem onClick={onNewFolder}>
                                <ListItemIcon>
                                    <CreateNewFolderIcon fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="inherit" noWrap>
                                    {t("NEW_FOLDER")}
                                </Typography>
                            </MenuItem>
                        )}
                        {!hideNewEntry && (
                            <MenuItem onClick={onNewEntry}>
                                <ListItemIcon>
                                    <AddIcon fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="inherit" noWrap>
                                    {t("NEW_ENTRY")}
                                </Typography>
                            </MenuItem>
                        )}
                        {!hideMove && (
                            <MenuItem onClick={onMove}>
                                <ListItemIcon>
                                    <OpenWithIcon fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="inherit" noWrap>
                                    {t("MOVE")}
                                </Typography>
                            </MenuItem>
                        )}
                        {!hideDelete && <Divider />}
                        {!hideDelete && (
                            <MenuItem onClick={onMove}>
                                <ListItemIcon>
                                    <DeleteIcon fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="inherit" noWrap>
                                    {t("DELETE")}
                                </Typography>
                            </MenuItem>
                        )}
                    </Menu>
                </div>
            </div>
            {isExpanded && (
                <div className={"tree-folder-content"}>
                    {content.folders &&
                        content.folders
                            .filter((folder) => !folder["hidden"] && !folder["deleted"])
                            .map(function (content, i) {
                                return (
                                    <Folder search={search} key={i} content={content} offline={offline} isExpandedDefault={Boolean(content["is_expanded"])} />
                                );
                            })}
                    {content.items &&
                        content.items
                            .filter((item) => !item["hidden"] && !item["deleted"])
                            .map(function (content, i) {
                                return <Item search={search} key={i} content={content} offline={offline} />;
                            })}
                </div>
            )}
        </div>
    );
};

Folder.propTypes = {
    search: PropTypes.string.isRequired,
    isExpandedDefault: PropTypes.bool.isRequired,
    content: PropTypes.object,
    offline: PropTypes.bool.isRequired,
};

const Item = (props) => {
    const { t } = useTranslation();
    const { content, search, offline } = props;
    const [anchorEl, setAnchorEl] = React.useState(null);

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

    const onShare = (event) => {
        handleClose(event);
        if (content.hasOwnProperty("share_rights") && content.share_rights.grant === false) {
            return;
        }

        /**
         * little wrapper to create the share rights from the selected users / groups and rights for a given nonce and
         * a given share_id and key
         *
         * @param share_id
         * @param share_secret_key
         * @param node
         * @param users
         * @param groups
         * @param selected_users
         * @param selected_groups
         * @param selected_rights
         */
        var create_share_rights = function (share_id, share_secret_key, node, users, groups, selected_users, selected_groups, selected_rights) {
            var i;
            var modalInstance;

            // found a user that has been selected, lets create the rights for him
            var rights = {
                read: selected_rights.indexOf("read") > -1,
                write: selected_rights.indexOf("write") > -1,
                grant: selected_rights.indexOf("grant") > -1,
            };

            // generate the title
            // TODO create form field with this default value and read value from form

            var title = "";
            if (typeof node.type === "undefined") {
                // we have a folder
                title = "Folder with title '" + node.name + "'";
            } else {
                // we have an item
                title = _blueprints[node.type].name + " with title '" + node.name + "'";
            }

            // get the type
            var type = "";
            if (typeof node.type === "undefined") {
                // we have a folder
                type = "folder";
            } else {
                // we have an item
                type = node.type;
            }

            function create_user_share_right(user) {
                var onSuccess = function (data) {
                    // pass
                };
                var onError = function (result) {
                    var title;
                    var description;
                    if (result.data === null) {
                        title = "UNKNOWN_ERROR";
                        description = "UNKNOWN_ERROR_CHECK_BROWSER_CONSOLE";
                    } else if (
                        result.data.hasOwnProperty("non_field_errors") &&
                        (result.data["non_field_errors"].indexOf("USER_DOES_NOT_EXIST_PROBABLY_DELETED") !== -1 ||
                            result.data["non_field_errors"].indexOf("Target user does not exist.") !== -1)
                    ) {
                        title = "UNKNOWN_USER";
                        description = _translations.USER_DOES_NOT_EXIST_PROBABLY_DELETED + " " + user.name;
                    } else if (result.data.hasOwnProperty("non_field_errors")) {
                        title = "ERROR";
                        description = result.data["non_field_errors"][0];
                    } else {
                        title = "UNKNOWN_ERROR";
                        description = "UNKNOWN_ERROR_CHECK_BROWSER_CONSOLE";
                    }

                    modalInstance = $uibModal.open({
                        templateUrl: "view/modal/error.html",
                        controller: "ModalErrorCtrl",
                        resolve: {
                            title: function () {
                                return title;
                            },
                            description: function () {
                                return description;
                            },
                        },
                    });

                    modalInstance.result.then(
                        function (breadcrumbs) {
                            // pass
                        },
                        function () {
                            // cancel triggered
                        }
                    );
                };

                return registrations["create_share_right"](
                    title,
                    type,
                    share_id,
                    user.data.user_id,
                    undefined,
                    user.data.user_public_key,
                    undefined,
                    share_secret_key,
                    rights["read"],
                    rights["write"],
                    rights["grant"]
                ).then(onSuccess, onError);
            }

            for (i = 0; i < users.length; i++) {
                if (selected_users.indexOf(users[i].id) < 0) {
                    continue;
                }
                create_user_share_right(users[i]);
            }

            function create_group_share_right(group) {
                var onSuccess = function (data) {
                    // pass
                };
                var onError = function (result) {
                    var title;
                    var description;
                    if (result.data === null) {
                        title = "UNKNOWN_ERROR";
                        description = "UNKNOWN_ERROR_CHECK_BROWSER_CONSOLE";
                    } else if (result.data.hasOwnProperty("non_field_errors")) {
                        title = "ERROR";
                        description = result.data["non_field_errors"][0];
                    } else {
                        title = "UNKNOWN_ERROR";
                        description = "UNKNOWN_ERROR_CHECK_BROWSER_CONSOLE";
                    }

                    modalInstance = $uibModal.open({
                        templateUrl: "view/modal/error.html",
                        controller: "ModalErrorCtrl",
                        resolve: {
                            title: function () {
                                return title;
                            },
                            description: function () {
                                return description;
                            },
                        },
                    });

                    modalInstance.result.then(
                        function (breadcrumbs) {
                            // pass
                        },
                        function () {
                            // cancel triggered
                        }
                    );
                };

                var group_secret_key = registrations["get_group_secret_key"](
                    group.group_id,
                    group.secret_key,
                    group.secret_key_nonce,
                    group.secret_key_type,
                    group.public_key
                );
                return registrations["create_share_right"](
                    title,
                    type,
                    share_id,
                    undefined,
                    group.group_id,
                    undefined,
                    group_secret_key,
                    share_secret_key,
                    rights["read"],
                    rights["write"],
                    rights["grant"]
                ).then(onSuccess, onError);
            }

            for (i = 0; i < groups.length; i++) {
                if (selected_groups.indexOf(groups[i].group_id) < 0) {
                    continue;
                }
                create_group_share_right(groups[i]);
            }
        };

        /**
         * Users and or / shares have been selected in the modal and the final "Share Now" button was
         * clicked
         *
         * @param content
         */
        var on_modal_close_success = function (content) {
            // content = { node: "...", path: "...", selected_users: "...", users: "..."}

            var has_no_users = !content.users || content.users.length < 1 || !content.selected_users || content.selected_users.length < 1;

            var has_no_groups = !content.groups || content.groups.length < 1 || !content.selected_groups || content.selected_groups.length < 1;

            if (has_no_users && has_no_groups) {
                // TODO echo not shared message because no user / group selected
                return;
            }

            if (content.node.hasOwnProperty("share_id")) {
                // its already a share, so generate only the share_rights

                create_share_rights(
                    content.node.share_id,
                    content.node.share_secret_key,
                    content.node,
                    content.users,
                    content.groups,
                    content.selected_users,
                    content.selected_groups,
                    content.selected_rights
                );
            } else {
                // its not yet a share, so generate the share, generate the share_rights and update
                // the datastore

                registrations["get_password_datastore"]().then(function (datastore) {
                    var path = content.path.slice();
                    var closest_share_info = registrations["get_closest_parent_share"](path, datastore, null, 1);
                    var parent_share = closest_share_info["closest_share"];
                    var parent_share_id;
                    var parent_datastore_id;

                    if (parent_share !== false && parent_share !== null) {
                        parent_share_id = parent_share.share_id;
                    } else {
                        parent_datastore_id = datastore.datastore_id;
                    }

                    // create the share
                    registrations["create_share"](content.node, parent_share_id, parent_datastore_id, content.node.id).then(function (share_details) {
                        var item_path = content.path.slice();
                        var item_path_copy = content.path.slice();
                        var item_path_copy2 = content.path.slice();

                        // create the share right
                        create_share_rights(
                            share_details.share_id,
                            share_details.secret_key,
                            content.node,
                            content.users,
                            content.groups,
                            content.selected_users,
                            content.selected_groups,
                            content.selected_rights
                        );

                        // update datastore and / or possible parent shares
                        var search = registrations["find_in_datastore"](item_path, datastore);

                        if (typeof content.node.type === "undefined") {
                            // we have an item
                            delete search[0][search[1]].secret_id;
                            delete search[0][search[1]].secret_key;
                        }
                        search[0][search[1]].share_id = share_details.share_id;
                        search[0][search[1]].share_secret_key = share_details.secret_key;

                        // update node in our displayed datastore
                        content.node.share_id = share_details.share_id;
                        content.node.share_secret_key = share_details.secret_key;

                        var changed_paths = registrations["on_share_added"](share_details.share_id, item_path_copy, datastore, 1);

                        var parent_path = item_path_copy2.slice();
                        parent_path.pop();

                        changed_paths.push(parent_path);

                        registrations["save_datastore_content"](datastore, changed_paths);
                    });
                });
            }
        };

        var modalInstance = $uibModal.open({
            templateUrl: "view/modal/share-entry.html",
            controller: "ModalShareEntryCtrl",
            backdrop: "static",
            resolve: {
                node: function () {
                    return item;
                },
                path: function () {
                    return path;
                },
            },
        });

        // User clicked the final share button
        modalInstance.result.then(on_modal_close_success, function () {
            // cancel triggered
        });
    };
    const onLinkShare = (event) => {
        if (content.hasOwnProperty("share_rights") && content.share_rights.grant === false) {
            return;
        }

        /**
         * User clicked the "Create" button
         *
         * @param content
         */
        var on_modal_close_success = function (content) {
            console.log(content);
        };

        var modalInstance = $uibModal.open({
            templateUrl: "view/modal/create-link-share.html",
            controller: "ModalCreateLinkShareCtrl",
            backdrop: "static",
            resolve: {
                node: function () {
                    return item;
                },
            },
        });

        // User clicked the final share button
        modalInstance.result.then(on_modal_close_success, function () {
            // cancel triggered
        });
    };

    const onRightsOverview = (event) => {
        if (content.hasOwnProperty("share_rights") && content.share_rights.grant === false) {
            return;
        }

        registrations["read_share_rights"](content.share_id).then(function (share_details) {
            var modalInstance = $uibModal.open({
                templateUrl: "view/modal/display-share-rights.html",
                controller: "ModalDisplayShareRightsCtrl",
                backdrop: "static",
                size: "lg",
                resolve: {
                    node: function () {
                        return content;
                    },
                    path: function () {
                        return path;
                    },
                    share_details: function () {
                        return share_details;
                    },
                },
            });
        });
    };

    const onCopyTotpToken = (event) => {
        registrations["copy_totp_token"](content);
    };

    const onCopyUsername = (event) => {
        registrations["copy_username"](content);
    };

    const onCopyPassword = (event) => {
        registrations["copy_password"](content);
    };

    const onEdit = (event) => {
        // TODO editNode
    };

    const onNewFolder = (event) => {
        // TODO newFolder
    };

    const onNewEntry = (event) => {
        // TODO newEntryNode
    };

    const onMove = (event) => {
        // TODO moveNode
    };
    const clickItem = function () {
        if (content.type === "file") {
            return fileTransferService.onItemClick(content, content.path);
        } else {
            return secretService.onItemClick(content);
        }
    };

    const hideShare = offline || (content.hasOwnProperty("share_rights") && content.share_rights.grant === false);
    const hideLinkShare =
        offline ||
        !content.hasOwnProperty("type") ||
        (content.hasOwnProperty("share_rights") && content.share_rights.grant === false) ||
        store.getState().server.complianceDisableLinkShares;
    const hideRightsOverview =
        offline ||
        (content.hasOwnProperty("share_rights") && content.share_rights.grant === false) ||
        !content.hasOwnProperty("share_id") ||
        typeof content.share_id === "undefined";
    const hideCopyTotpToken =
        (content.hasOwnProperty("share_rights") && content.share_rights.read !== true) || !content.hasOwnProperty("type") || ["totp"].includes(content["type"]);
    const hideCopyUsername =
        (content.hasOwnProperty("share_rights") && content.share_rights.read !== true) ||
        !content.hasOwnProperty("type") ||
        !["website_password", "application_password"].includes(content["type"]);
    const hideCopyPassword =
        (content.hasOwnProperty("share_rights") && content.share_rights.read !== true) ||
        !content.hasOwnProperty("type") ||
        !["website_password", "application_password"].includes(content["type"]);
    const hideEdit = offline || content.share_rights.write === false;
    const hideClone =
        offline || content.share_rights.write === false || content.share_rights.read === false || content.type === "file" || content.type === "user";
    const hideNewFolder = offline || content.share_rights.write === false;
    const hideNewEntry = offline || content.share_rights.write === false;
    const hideMove = offline || content.share_rights.delete === false;
    const hideDelete = offline || content.share_rights.delete === false;

    return (
        <div className={"tree-item"}>
            <div className={"tree-item-object"}>
                <span className="fa-stack">
                    <i className={widgetService.itemIcon(content)} />
                    {content.share_id && <i className="fa fa-circle fa-stack-2x text-danger is-shared" />}
                    {content.share_id && <i className="fa fa-group fa-stack-2x is-shared" />}
                </span>
                <span className="tree-item-name">{content.name}</span>
                <ButtonGroup variant="text" aria-label="outlined button group" className={"node-open-link"}>
                    {["bookmark", "website_password"].indexOf(content.type) !== -1 && (
                        <Button aria-label="open" onClick={clickItem}>
                            <OpenInNewIcon fontSize="small" />
                        </Button>
                    )}
                    {["file"].indexOf(content.type) !== -1 && (
                        <Button aria-label="open" onClick={clickItem}>
                            <GetAppIcon fontSize="small" />
                        </Button>
                    )}
                    <Button aria-label="settings" onClick={openMenu}>
                        <SettingsIcon fontSize="small" />
                    </Button>
                </ButtonGroup>
                <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
                    {!hideShare && (
                        <MenuItem onClick={onShare}>
                            <ListItemIcon>
                                <ShareIcon fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="inherit" noWrap>
                                {t("SHARE")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideLinkShare && (
                        <MenuItem onClick={onLinkShare}>
                            <ListItemIcon>
                                <LinkIcon fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="inherit" noWrap>
                                {t("LINK_SHARE")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideRightsOverview && (
                        <MenuItem onClick={onRightsOverview}>
                            <ListItemIcon>
                                <ListIcon fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="inherit" noWrap>
                                {t("RIGHTS_OVERVIEW")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideCopyTotpToken && (
                        <MenuItem onClick={onCopyTotpToken}>
                            <ListItemIcon>
                                <ContentCopy fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="inherit" noWrap>
                                {t("COPY_TOTP_TOKEN")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideCopyUsername && (
                        <MenuItem onClick={onCopyUsername}>
                            <ListItemIcon>
                                <ContentCopy fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="inherit" noWrap>
                                {t("COPY_USERNAME")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideCopyPassword && (
                        <MenuItem onClick={onCopyPassword}>
                            <ListItemIcon>
                                <ContentCopy fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="inherit" noWrap>
                                {t("COPY_PASSWORD")}
                            </Typography>
                        </MenuItem>
                    )}
                    <Divider />
                    {!hideEdit && (
                        <MenuItem onClick={onEdit}>
                            <ListItemIcon>
                                <EditIcon fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="inherit" noWrap>
                                {content.type === "user" ? t("SHOW") : t("SHOW_OR_EDIT")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideClone && (
                        <MenuItem onClick={onEdit}>
                            <ListItemIcon>
                                <FileCopyIcon fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="inherit" noWrap>
                                {t("CLONE")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideNewFolder && (
                        <MenuItem onClick={onNewFolder}>
                            <ListItemIcon>
                                <CreateNewFolderIcon fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="inherit" noWrap>
                                {t("NEW_FOLDER")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideNewEntry && (
                        <MenuItem onClick={onNewEntry}>
                            <ListItemIcon>
                                <AddIcon fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="inherit" noWrap>
                                {t("NEW_ENTRY")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideMove && (
                        <MenuItem onClick={onMove}>
                            <ListItemIcon>
                                <OpenWithIcon fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="inherit" noWrap>
                                {t("MOVE")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideDelete && <Divider />}
                    {!hideDelete && (
                        <MenuItem onClick={onMove}>
                            <ListItemIcon>
                                <DeleteIcon fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="inherit" noWrap>
                                {t("DELETE")}
                            </Typography>
                        </MenuItem>
                    )}
                </Menu>
            </div>
        </div>
    );
};

Item.propTypes = {
    search: PropTypes.string.isRequired,
    content: PropTypes.object,
    offline: PropTypes.bool.isRequired,
};

const DatastoreTree = (props) => {
    const { datastore, search } = props;
    const offline = offlineCache.isActive();

    return (
        <div className={"tree"}>
            {datastore.folders &&
                datastore.folders
                    .filter((folder) => !folder["hidden"] && !folder["deleted"])
                    .map(function (content, i) {
                        return <Folder search={search} key={i} content={content} offline={offline} isExpandedDefault={Boolean(content["is_expanded"])} />;
                    })}
            {datastore.items &&
                datastore.items
                    .filter((item) => !item["hidden"] && !item["deleted"])
                    .map(function (content, i) {
                        return <Item search={search} key={i} content={content} offline={offline} />;
                    })}
        </div>
    );
};

DatastoreTree.propTypes = {
    search: PropTypes.string.isRequired,
    datastore: PropTypes.object,
};

export default DatastoreTree;
