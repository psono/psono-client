import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import CheckIcon from "@mui/icons-material/Check";
import IconButton from "@mui/material/IconButton";
import BlockIcon from "@mui/icons-material/Block";
import { Grid } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import MuiAlert from '@mui/material/Alert'

import shareService from "../../services/share";
import TabPanel from "../tab-panel";
import Table from "../table";
import { getStore } from "../../services/store";
import helper from "../../services/helper";
import DialogVerify from "./verify";
import DialogNewGroupShare from "./new-group-share";
import DialogNewUserShare from "./new-user-share";
import datastorePasswordService from "../../services/datastore-password";
import datastoreService from "../../services/datastore";
import groupsService from "../../services/groups";
import DialogError from "./error";
import DialogProgress from "./progress";
import offlineCache from "../../services/offline-cache";
import DialogNewShare from "./new-group-share";

const useStyles = makeStyles((theme) => ({
    tabPanel: {
        "& .MuiBox-root": {
            padding: "16px 0px",
        },
    },
}));

const DialogRightsOverview = (props) => {
    const { open, onClose, item, path } = props;
    const [shareMoveProgress, setShareMoveProgress] = React.useState(0);
    const { t } = useTranslation();
    const classes = useStyles();
    const [value, setValue] = React.useState(0);
    const [verifyToggleOwnGrantOpen, setVerifyToggleOwnGrantOpen] = useState(false);
    const [verifyToggleOwnGrantData, setVerifyToggleOwnGrantData] = useState({});
    const [verifyDeleteOwnShareRightOpen, setVerifyDeleteOwnShareRightOpen] = useState(false);
    const [verifyDeleteOwnShareRightData, setVerifyDeleteOwnShareRightData] = useState({});
    const [shareDetails, setShareDetails] = useState({});
    const [userShareRights, setUserShareRights] = useState([]);
    const [groupShareRights, setGroupShareRights] = useState([]);
    const [newShareUserOpen, setNewShareUserOpen] = useState(false);
    const [newShareGroupOpen, setNewShareGroupOpen] = useState(false);
    const [error, setError] = useState(null);


    const shareMoveProgressDialogOpen = shareMoveProgress !== 0 && shareMoveProgress !== 100;
    let openShareMoveRequests = 0;
    let closedShareMoveRequests = 0;

    const onOpenShareMoveRequest = () => {
        openShareMoveRequests = openShareMoveRequests + 1;
        setShareMoveProgress(Math.round((closedShareMoveRequests / openShareMoveRequests) * 1000) / 10);
    }
    const onCloseShareMoveRequest = () => {
        closedShareMoveRequests = closedShareMoveRequests + 1;
        setShareMoveProgress(Math.round((closedShareMoveRequests / openShareMoveRequests) * 1000) / 10);
    }

    let isSubscribed = true;
    React.useEffect(() => {
        loadShareRights();
        return () => (isSubscribed = false);
    }, []);

    const loadShareRights = () => {
        if (!item.share_id) {
            return;
        }
        // we already have a share and no new object that wants to become a share
        shareService.readShareRights(item.share_id).then(function (newShareDetails) {
            if (!isSubscribed) {
                return;
            }
            if (newShareDetails) {
                setShareDetails(newShareDetails);
                setUserShareRights(
                    newShareDetails.user_share_rights.map((right) => {
                        return [right.id, right.username, right.read, right.write, right.grant, right.accepted];
                    })
                );
                setGroupShareRights(
                    newShareDetails.group_share_rights.map((right) => {
                        return [right.id, right.group_name, right.read, right.write, right.grant, right.accepted];
                    })
                );
            }
        });
    };

    const onCreateUser = () => {
        setNewShareUserOpen(true);
    }

    const onCreateGroup = () => {
        setNewShareGroupOpen(true);
    }

    /**
     * Deletes a share right without further warning.
     *
     * @param {object} right The right to delete
     */
    function deleteRightWithoutFurtherWarning(right) {
        let shareRights;
        let userShareRightId;
        let groupShareRightId;

        if (right.hasOwnProperty("user_id")) {
            shareRights = shareDetails.user_share_rights;
            userShareRightId = right.id;
        } else {
            shareRights = shareDetails.group_share_rights;
            groupShareRightId = right.id;
        }

        for (let i = shareRights.length - 1; i >= 0; i--) {
            if (shareRights[i].id !== right.id) {
                continue;
            }

            shareRights.splice(i, 1);
            shareService.deleteShareRight(userShareRightId, groupShareRightId);
        }

        setUserShareRights(
            shareDetails.user_share_rights.map((right) => {
                return [right.id, right.username, right.read, right.write, right.grant, right.accepted];
            })
        );
        setGroupShareRights(
            shareDetails.group_share_rights.map((right) => {
                return [right.id, right.group_name, right.read, right.write, right.grant, right.accepted];
            })
        );
    }

    function deleteRight(rightId) {
        let right = shareDetails.user_share_rights.find((right) => right.id === rightId);
        if (!right) {
            right = shareDetails.group_share_rights.find((right) => right.id === rightId);
        }
        if (getStore().getState().user.username === right.username) {
            setVerifyDeleteOwnShareRightData({ right: right });
            setVerifyDeleteOwnShareRightOpen(true);
        } else {
            return deleteRightWithoutFurtherWarning(right);
        }
    }

    const deleteOwnShareRightConfirmed = () => {
        return deleteRightWithoutFurtherWarning(verifyDeleteOwnShareRightData.right);
    };

    const createShareRights = async (share_id, share_secret_key, node, users, groups, read, write, grant) => {
        let i;

        let title = node.name;

        // get the type
        let type = "";
        if (typeof node.type === "undefined") {
            // we have a folder
            type = "folder";
        } else {
            // we have an item
            type = node.type;
        }

        function createUserShareRight(user) {
            const onSuccess = function (data) {
                // pass
            };
            const onError = function (result) {
                let title;
                let description;
                if (result.data === null) {
                    title = "UNKNOWN_ERROR";
                    description = "UNKNOWN_ERROR_CHECK_BROWSER_CONSOLE";
                } else if (
                    result.data.hasOwnProperty("non_field_errors") &&
                    (result.data["non_field_errors"].indexOf("USER_DOES_NOT_EXIST_PROBABLY_DELETED") !== -1 ||
                        result.data["non_field_errors"].indexOf("Target user does not exist.") !== -1)
                ) {
                    title = "UNKNOWN_USER";
                    description = t("USER_DOES_NOT_EXIST_PROBABLY_DELETED", {name: user.name});
                } else if (result.data.hasOwnProperty("non_field_errors")) {
                    title = "ERROR";
                    description = result.data["non_field_errors"][0];
                } else {
                    title = "UNKNOWN_ERROR";
                    description = "UNKNOWN_ERROR_CHECK_BROWSER_CONSOLE";
                }
                setError({
                    title,
                    description,
                });
            };
            return shareService
                .createShareRight(
                    title,
                    type,
                    share_id,
                    user.data.user_id,
                    undefined,
                    user.data.user_public_key,
                    undefined,
                    share_secret_key,
                    read,
                    write,
                    grant
                )
                .then(onSuccess, onError);
        }

        for (i = 0; i < users.length; i++) {
            await createUserShareRight(users[i]);
        }

        function createGroupShareRight(group) {
            const onSuccess = function (data) {
                // pass
            };
            const onError = function (result) {
                let title;
                let description;
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
                setError({
                    title,
                    description,
                });
            };
            const groupSecretKey = groupsService.getGroupSecretKey(
                group.group_id,
                group.secret_key,
                group.secret_key_nonce,
                group.secret_key_type,
                group.public_key
            );
            return shareService
                .createShareRight(
                    title,
                    type,
                    share_id,
                    undefined,
                    group.group_id,
                    undefined,
                    groupSecretKey,
                    share_secret_key,
                    read,
                    write,
                    grant
                )
                .then(onSuccess, onError);
        }

        for (i = 0; i < groups.length; i++) {
            await createGroupShareRight(groups[i]);
        }
    };


    const onNewShareCreate = async (users, groups, read, write, grant) => {
        setNewShareUserOpen(false);
        setNewShareGroupOpen(false);

        const hasNoUsers = users.length < 1;
        const hasNoGroups = groups.length < 1;

        if (hasNoUsers && hasNoGroups) {
            // TODO echo not shared message because no user / group selected
            return;
        }

        if (item.hasOwnProperty("share_id")) {
            // its already a share, so generate only the share_rights
            await createShareRights(
                item.share_id,
                item.share_secret_key,
                item,
                users,
                groups,
                read,
                write,
                grant
            );
            loadShareRights();
        } else {
            // its not yet a share, so generate the share, generate the share_rights and update
            // the datastore
            datastorePasswordService.getPasswordDatastore().then(function (datastore) {
                const pathCopy = path.slice();
                const closest_share_info = shareService.getClosestParentShare(pathCopy, datastore, null, 1);
                const parent_share = closest_share_info["closest_share"];
                let parent_share_id;
                let parent_datastore_id;

                if (parent_share !== false && parent_share !== null) {
                    parent_share_id = parent_share.share_id;
                } else {
                    parent_datastore_id = datastore.datastore_id;
                }

                // create the share
                shareService
                    .createShare(item, parent_share_id, parent_datastore_id, item.id, onOpenShareMoveRequest, onCloseShareMoveRequest)
                    .then(async function (share_details) {
                        const item_path = path.slice();
                        const item_path_copy = path.slice();
                        const item_path_copy2 = path.slice();

                        // create the share right
                        createShareRights(
                            share_details.share_id,
                            share_details.secret_key,
                            item,
                            users,
                            groups,
                            read,
                            write,
                            grant
                        );

                        // update datastore and / or possible parent shares
                        const search = datastoreService.findInDatastore(item_path, datastore);

                        if (typeof item.type === "undefined") {
                            // we have an item
                            delete search[0][search[1]].secret_id;
                            delete search[0][search[1]].secret_key;
                        }
                        search[0][search[1]].share_id = share_details.share_id;
                        search[0][search[1]].share_secret_key = share_details.secret_key;

                        // update node in our displayed datastore
                        item.share_id = share_details.share_id;
                        item.share_secret_key = share_details.secret_key;

                        const changed_paths = datastorePasswordService.onShareAdded(
                            share_details.share_id,
                            item_path_copy,
                            datastore,
                            1
                        );

                        const parent_path = item_path_copy2.slice();
                        parent_path.pop();

                        changed_paths.push(parent_path);

                        await datastorePasswordService.saveDatastoreContent(datastore, changed_paths);
                        onClose();
                    });
            });
        }
    };


    const toggleRightWithoutFurtherWarning = (type, right) => {
        const onError = function (data) {
            // pass
            console.log(data);
        };

        const onSuccess = function () {
            right[type] = !right[type];
            setUserShareRights(
                shareDetails.user_share_rights.map((right) => {
                    return [right.id, right.username, right.read, right.write, right.grant, right.accepted];
                })
            );
            setGroupShareRights(
                shareDetails.group_share_rights.map((right) => {
                    return [right.id, right.group_name, right.read, right.write, right.grant, right.accepted];
                })
            );
        };

        const newRight = helper.duplicateObject(right);
        newRight[type] = !newRight[type];

        shareService
            .updateShareRight(
                newRight.share_id,
                newRight.user_id,
                newRight.group_id,
                newRight.read,
                newRight.write,
                newRight.grant
            )
            .then(onSuccess, onError);
    };


    const toggleRight = (type, rightId) => {
        let right = shareDetails.user_share_rights.find((right) => right.id === rightId);
        if (!right) {
            right = shareDetails.group_share_rights.find((right) => right.id === rightId);
        }

        if (type === "grant" && getStore().getState().user.username === right.username) {
            setVerifyToggleOwnGrantData({ right: right, type: type });
            setVerifyToggleOwnGrantOpen(true);
        } else {
            return toggleRightWithoutFurtherWarning(type, right);
        }
    };

    const toggleOwnGrantConfirmed = () => {
        return toggleRightWithoutFurtherWarning(verifyToggleOwnGrantData.type, verifyToggleOwnGrantData.right);
    };

    const userColumns = [
        { name: t("ID"), options: { display: false } },
        { name: t("USERNAME") },
        {
            name: t("READ"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => toggleRight("read", tableMeta.rowData[0])}
                            disabled={!shareDetails.own_share_rights.grant}
                            size="large">
                            {tableMeta.rowData[2] ? <CheckIcon /> : <BlockIcon />}
                        </IconButton>
                    );
                },
            },
        },
        {
            name: t("WRITE"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => toggleRight("write", tableMeta.rowData[0])}
                            disabled={!shareDetails.own_share_rights.grant}
                            size="large">
                            {tableMeta.rowData[3] ? <CheckIcon /> : <BlockIcon />}
                        </IconButton>
                    );
                },
            },
        },
        {
            name: t("ADMIN"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => toggleRight("grant", tableMeta.rowData[0])}
                            disabled={!shareDetails.own_share_rights.grant}
                            size="large">
                            {tableMeta.rowData[4] ? <CheckIcon /> : <BlockIcon />}
                        </IconButton>
                    );
                },
            },
        },
        {
            name: t("ACCEPTED"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                // pass
                            }}
                            disabled={true}
                            size="large">
                            {tableMeta.rowData[5] === true && <CheckIcon />}
                            {tableMeta.rowData[5] === false && <BlockIcon />}
                            {tableMeta.rowData[5] !== true && tableMeta.rowData[6] !== false && <HourglassEmptyIcon />}
                        </IconButton>
                    );
                },
            },
        },
        {
            name: t("DELETE"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customHeadLabelRender: () => null,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => deleteRight(tableMeta.rowData[0])}
                            disabled={!shareDetails.own_share_rights.grant}
                            size="large">
                            <DeleteIcon />
                        </IconButton>
                    );
                },
            },
        },
    ];

    const groupColumns = [
        { name: t("ID"), options: { display: false } },
        { name: t("GROUP_NAME") },
        {
            name: t("READ"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => toggleRight("read", tableMeta.rowData[0])}
                            disabled={!shareDetails.own_share_rights.grant}
                            size="large">
                            {tableMeta.rowData[2] ? <CheckIcon /> : <BlockIcon />}
                        </IconButton>
                    );
                },
            },
        },
        {
            name: t("WRITE"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => toggleRight("write", tableMeta.rowData[0])}
                            disabled={!shareDetails.own_share_rights.grant}
                            size="large">
                            {tableMeta.rowData[3] ? <CheckIcon /> : <BlockIcon />}
                        </IconButton>
                    );
                },
            },
        },
        {
            name: t("ADMIN"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => toggleRight("grant", tableMeta.rowData[0])}
                            disabled={!shareDetails.own_share_rights.grant}
                            size="large">
                            {tableMeta.rowData[4] ? <CheckIcon /> : <BlockIcon />}
                        </IconButton>
                    );
                },
            },
        },
        {
            name: t("ACCEPTED"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                // pass
                            }}
                            disabled={true}
                            size="large">
                            {tableMeta.rowData[5] === true && <CheckIcon />}
                            {tableMeta.rowData[5] === false && <BlockIcon />}
                            {tableMeta.rowData[5] !== true && tableMeta.rowData[6] !== false && <HourglassEmptyIcon />}
                        </IconButton>
                    );
                },
            },
        },
        {
            name: t("DELETE"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customHeadLabelRender: () => null,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => deleteRight(tableMeta.rowData[0])}
                            disabled={!shareDetails.own_share_rights.grant}
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

    const hasNoAdminGroups = groupShareRights.filter((groupRight) => groupRight[4]).length === 0;
    const ownRightsAreAdmin = userShareRights.filter((userRight) => userRight[1] === getStore().getState().user.username && userRight[4]).length === 1;
    const hasOnlyOneAdmin = userShareRights.filter((userRight) => userRight[4] && userRight[5]).length < 2;
    const hideNewShare =
        getStore().getState().server.complianceDisableShares ||
        offlineCache.isActive() ||
        (item.hasOwnProperty("share_rights") && item.share_rights.grant === false);

    return (
        <Dialog
            fullWidth
            maxWidth={"md"}
            open={open}
            onClose={() => {
                onClose();
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {t("SHARE_RIGHTS_OF")} {item.name}
            </DialogTitle>
            <DialogContent>
                <Grid container>
                    {hasNoAdminGroups && ownRightsAreAdmin && hasOnlyOneAdmin && (<Grid item xs={12} sm={12} md={12}>
                        <MuiAlert
                            severity="warning"
                            style={{
                                marginBottom: "5px",
                                marginTop: "5px",
                            }}
                        >
                            {t('CONFIGURE_MULTIPLE_ACCOUNTS_WITH_GRANT_PRIVILEGE')}
                        </MuiAlert>
                    </Grid>)}
                    <Grid item xs={12} sm={12} md={12}>
                        <Tabs
                            value={value}
                            indicatorColor="primary"
                            textColor="primary"
                            onChange={(event, newValue) => {
                                setValue(newValue);
                            }}
                            aria-label="user and group rights"
                        >
                            <Tab label={t("USERS")} />
                            <Tab label={t("GROUPS")} />
                        </Tabs>
                        <TabPanel value={value} index={0} className={classes.tabPanel}>
                            <Table data={userShareRights} columns={userColumns} options={options} onCreate={hideNewShare ? undefined : onCreateUser} />
                        </TabPanel>
                        <TabPanel value={value} index={1} className={classes.tabPanel}>
                            <Table data={groupShareRights} columns={groupColumns} options={options} onCreate={hideNewShare ? undefined : onCreateGroup} />
                        </TabPanel>
                    </Grid>
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
            </DialogActions>
            {verifyToggleOwnGrantOpen && (
                <DialogVerify
                    title={"TOGGLE_GRANT_RIGHT"}
                    description={"TOGGLE_OWN_GRANT_RIGHT_WARNING"}
                    entries={[verifyToggleOwnGrantData.right.username]}
                    affectedEntriesText={"AFFECTED_SHARE_RIGHTS"}
                    open={verifyToggleOwnGrantOpen}
                    onClose={() => setVerifyToggleOwnGrantOpen(false)}
                    onConfirm={toggleOwnGrantConfirmed}
                />
            )}
            {verifyDeleteOwnShareRightOpen && (
                <DialogVerify
                    title={"DELETE_SHARE_RIGHT"}
                    description={"DELETE_OWN_SHARE_RIGHT_WARNING"}
                    entries={[verifyDeleteOwnShareRightData.right.username]}
                    affectedEntriesText={"AFFECTED_SHARE_RIGHTS"}
                    open={verifyDeleteOwnShareRightOpen}
                    onClose={() => setVerifyDeleteOwnShareRightOpen(false)}
                    onConfirm={deleteOwnShareRightConfirmed}
                />
            )}
            {newShareUserOpen && (
                <DialogNewUserShare
                    open={newShareUserOpen}
                    onClose={() => setNewShareUserOpen(false)}
                    onCreate={(users, read, write, grant) => {
                        onNewShareCreate(users, [], read, write, grant )
                    }}
                    node={item}
                />
            )}
            {newShareGroupOpen && (
                <DialogNewGroupShare
                    open={newShareGroupOpen}
                    onClose={() => setNewShareGroupOpen(false)}
                    onCreate={(groups, read, write, grant) => {
                        onNewShareCreate([], groups, read, write, grant )
                    }}
                    node={item}
                />
            )}
            {error !== null && (
                <DialogError
                    open={error !== null}
                    onClose={() => setError(null)}
                    title={error.title}
                    description={error.description}
                />
            )}

            {shareMoveProgressDialogOpen && (
                <DialogProgress percentageComplete={shareMoveProgress} open={shareMoveProgressDialogOpen}/>
            )}
        </Dialog>
    );
};

DialogRightsOverview.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    item: PropTypes.object.isRequired,
};

export default DialogRightsOverview;
