import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Divider from "@material-ui/core/Divider";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import { Grid } from "@material-ui/core";
import TextField from "@material-ui/core/TextField";
import IconButton from "@material-ui/core/IconButton";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import DeleteIcon from "@material-ui/icons/Delete";
import BlockIcon from "@material-ui/icons/Block";
import HourglassEmptyIcon from "@material-ui/icons/HourglassEmpty";
import format from "../../services/date";

import groupsService from "../../services/groups";
import datastoreUserService from "../../services/datastore-user";
import store from "../../services/store";
import helper from "../../services/helper";
import TabPanel from "../tab-panel";
import Table from "../table";
import GridContainerErrors from "../grid-container-errors";
import shareService from "../../services/share";
import DialogNewUser from "./new-user";
import DialogVerify from "./verify";

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
    tabPanel: {
        "& .MuiBox-root": {
            padding: "16px 0px",
        },
    },
}));

const DialogEditGroup = (props) => {
    const { open, onClose, groupId, readOnly, onEdit } = props;
    const [toggleOwnGroupAdminId, setToggleOwnGroupAdminId] = useState(null);
    const [toggleGrantRightData, setToggleGrantRightData] = useState(null);
    const { t } = useTranslation();
    const classes = useStyles();
    const [value, setValue] = React.useState(0);
    const [groupName, setGroupName] = useState("");
    const [group, setGroup] = useState({});
    const [groupMemberIndex, setGroupMemberIndex] = useState({});
    const [users, setUsers] = useState([]);
    const [shares, setShares] = useState([]);
    const [errors, setErrors] = useState([]);
    const [originalGroupName, setOriginalGroupName] = useState("");
    const [shareAdmin, setShareAdmin] = useState(false);
    const [newUserOpen, setNewUserOpen] = useState(false);

    const onSave = (event) => {
        setErrors([]);
        const test_result = helper.isValidGroupName(groupName);

        if (test_result !== true) {
            setErrors([test_result]);
            return;
        }

        const onSuccess = function () {
            props.onEdit();
        };

        const onError = function (error) {
            //pass
            console.log(error);
        };

        if (groupName !== originalGroupName) {
            groupsService.updateGroup(groupId, groupName).then(onSuccess, onError);
        } else {
            props.onEdit();
        }
    };

    let isSubscribed = true;
    React.useEffect(() => {
        loadGroup();
        // cancel subscription to useEffect
        return () => (isSubscribed = false);
    }, []);

    const loadGroup = function () {
        const onError = function (result) {
            // pass
            console.log(result);
        };

        const onSuccess = function (groupDetails) {
            if (!isSubscribed) return;
            const userId = store.getState().user.userId;
            setGroup(groupDetails);
            setGroupName(groupDetails.name);
            setOriginalGroupName(groupDetails.name);
            setShareAdmin(groupDetails.share_admin);
            const shares = groupDetails.group_share_rights;
            const users = [];
            const groupMemberIndex = {};

            for (let i = 0; i < groupDetails.members.length; i++) {
                groupMemberIndex[groupDetails.members[i].id] = groupDetails.members[i];
                groupDetails.members[i]["is_current_user"] = groupDetails.members[i].id === userId;
                users.push(groupDetails.members[i]);
            }
            for (let i = 0; i < shares.length; i++) {
                shares[i].title = groupsService.decryptSecretKey(groupId, shares[i].title, shares[i].title_nonce);
            }

            if (!readOnly) {
                datastoreUserService.getUserDatastore().then(function (user_datastore) {
                    const trusted_users = [];
                    helper.createList(user_datastore, trusted_users);

                    for (let i = 0; i < trusted_users.length; i++) {
                        if (groupMemberIndex.hasOwnProperty(trusted_users[i].data.user_id)) {
                            continue;
                        }
                        users.push({
                            id: trusted_users[i].data.user_id,
                            name: trusted_users[i].data.user_username,
                            public_key: trusted_users[i].data.user_public_key,
                            is_current_user: trusted_users[i].data.user_id === userId,
                        });
                    }
                    setGroupMemberIndex(groupMemberIndex);
                    setUsers(users);
                    setShares(shares);
                });
            } else {
                setGroupMemberIndex(groupMemberIndex);
                setUsers(users);
                setShares(shares);
            }
        };

        groupsService.readGroup(groupId).then(onSuccess, onError);
    };

    const onNewUserCreate = (userObject) => {
        // called once someone clicked the CREATE button in the dialog closes with the infos about the user
        setNewUserOpen(false);

        datastoreUserService.getUserDatastore().then(function (datastore) {
            datastoreUserService.addUserToDatastore(datastore, userObject).then(
                () => {
                    loadGroup();
                },
                (error) => {
                    console.log(error);
                }
            );
        });
    };

    /**
     * Grants a user membership status of a group
     *
     * @param {string} user The user to grant the membership status
     */
    const createMembership = (user) => {
        const onError = function (result) {
            // pass
            console.log(result);
        };

        const onSuccess = function (result) {
            user["membership_id"] = result.membership_id;
            user["group_admin"] = false;
            user["share_admin"] = true;
            user["is_current_user"] = false;
            const _groupMemberIndex = helper.duplicateObject(groupMemberIndex);
            _groupMemberIndex[user["id"]] = user;
            setGroupMemberIndex(_groupMemberIndex);
        };

        groupsService.createMembership(user, group).then(onSuccess, onError);
    };

    /**
     * Revokes a user membership status of a group
     *
     * @param {object} user The user to revoke the membership status
     */
    const deleteMembership = (user) => {
        const onError = function (result) {
            // pass
            console.log(result);
        };

        const onSuccess = function (result) {
            // pass
            delete user["membership_id"];
            delete user["group_admin"];
            delete user["share_admin"];
            const _groupMemberIndex = helper.duplicateObject(groupMemberIndex);
            delete _groupMemberIndex[user["id"]];
            setGroupMemberIndex(_groupMemberIndex);
        };

        groupsService.deleteMembership(user["membership_id"]).then(onSuccess, onError);
    };

    const isMember = (userId) => {
        return groupMemberIndex.hasOwnProperty(userId);
    };

    const onSearchUser = () => {
        setNewUserOpen(true);
    };

    const toggleUser = (userId) => {
        const user = users.find((user) => user.id === userId);
        if (!isMember(userId)) {
            return createMembership(user);
        } else {
            return deleteMembership(user);
        }
    };

    const updateMembership = (user) => {
        const onError = function (result) {
            // pass
            console.log(result);
        };

        const onSuccess = function (result) {
            user["group_admin"] = !user["group_admin"];
            const _users = helper.duplicateObject(users);
            setUsers(_users);
        };

        return groupsService
            .updateMembership(user["membership_id"], !user["group_admin"], user["share_admin"])
            .then(onSuccess, onError);
    };

    const toggleOwnGroupAdminConfirmed = () => {
        setToggleOwnGroupAdminId(null);
        const user = users.find((user) => user.id === toggleOwnGroupAdminId);
        updateMembership(user).then(() => {
            onClose();
        });
    };

    const toggleGroupAdmin = (userId) => {
        const user = users.find((user) => user.id === userId);
        if (store.getState().user.username === user.name) {
            setToggleOwnGroupAdminId(userId);
        } else {
            return updateMembership(user);
        }
    };

    const toggleShareAdmin = (userId) => {
        const user = users.find((user) => user.id === userId);
        const onError = function (result) {
            // pass
            console.log(result);
        };

        const onSuccess = function (result) {
            user["share_admin"] = !user["share_admin"];
            const _users = helper.duplicateObject(users);
            setUsers(_users);
        };

        groupsService
            .updateMembership(user["membership_id"], user["group_admin"], !user["share_admin"])
            .then(onSuccess, onError);
    };

    function toggleRightWithoutFurtherWarning(type, right) {
        const onError = function (data) {
            // pass
        };

        const onSuccess = function () {
            right[type] = !right[type];
            const _shares = helper.duplicateObject(shares);
            setShares(_shares);
        };

        const newRight = helper.duplicateObject(right);
        newRight[type] = !newRight[type];

        shareService
            .updateShareRight(
                newRight.share_id,
                newRight.user_id,
                groupId,
                newRight.read,
                newRight.write,
                newRight.grant
            )
            .then(onSuccess, onError);
    }

    const toggleGrantRightConfirmed = () => {
        const _toggleGrantRightData = toggleGrantRightData;
        const right = shares.find((share) => share.id === _toggleGrantRightData["shareRightId"]);
        setToggleGrantRightData(null);
        toggleRightWithoutFurtherWarning(_toggleGrantRightData["type"], right);
    };

    const toggleRight = (type, shareRightId) => {
        const right = shares.find((share) => share.id === shareRightId);
        if (type === "grant" && right["grant"]) {
            setToggleGrantRightData({
                type: type,
                shareRightId: shareRightId,
            });
        } else {
            return toggleRightWithoutFurtherWarning(type, right);
        }
    };

    const deleteShareRight = (shareRightId) => {
        const shareRight = shares.find((share) => share.id === shareRightId);
        const onError = function (result) {
            // pass
            console.log(result);
        };

        const onSuccess = function (result) {
            helper.removeFromArray(shares, shareRight, function (a, b) {
                return a.id === b.id;
            });
            const _shares = helper.duplicateObject(shares);
            setShares(_shares);
        };

        shareService.deleteShareRight(undefined, shareRight.id).then(onSuccess, onError);
    };

    const userColumns = [
        { name: t("ID"), options: { display: false } },
        {
            name: t("NAME"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <React.Fragment>
                            {tableMeta.rowData[1].length > 58
                                ? tableMeta.rowData[1].substring(0, 58) + "...)"
                                : tableMeta.rowData[1]}
                        </React.Fragment>
                    );
                },
            },
        },
        {
            name: t("MEMBER"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => toggleUser(tableMeta.rowData[0])}
                            disabled={readOnly || tableMeta.rowData[7]}
                        >
                            {tableMeta.rowData[2] ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                        </IconButton>
                    );
                },
            },
        },
        {
            name: t("GROUP_ADMIN"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    if (!tableMeta.rowData[2]) {
                        return;
                    }
                    return (
                        <IconButton
                            onClick={() => toggleGroupAdmin(tableMeta.rowData[0])}
                            disabled={readOnly || tableMeta.rowData[7]}
                        >
                            {tableMeta.rowData[3] ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                        </IconButton>
                    );
                },
            },
        },
        {
            name: t("SHARE_ADMIN"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    if (!tableMeta.rowData[2]) {
                        return;
                    }
                    return (
                        <IconButton
                            onClick={() => toggleShareAdmin(tableMeta.rowData[0])}
                            disabled={readOnly || tableMeta.rowData[7]}
                        >
                            {tableMeta.rowData[4] ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
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
                    if (!tableMeta.rowData[2]) {
                        return;
                    }
                    return (
                        <IconButton disabled={true}>
                            {tableMeta.rowData[5] === true && <CheckBoxIcon />}
                            {tableMeta.rowData[5] === false && <BlockIcon />}
                            {tableMeta.rowData[5] !== true && tableMeta.rowData[5] !== false && <HourglassEmptyIcon />}
                        </IconButton>
                    );
                },
            },
        },
        {
            name: t("CREATE_DATE"),
            options: {
                filter: false,
                sort: false,
                empty: false,
                display: false,
            },
        },
    ];

    const shareRightColumns = [
        { name: t("ID"), options: { display: false } },
        {
            name: t("SHARE"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <React.Fragment>
                            {tableMeta.rowData[1].length > 58
                                ? tableMeta.rowData[1].substring(0, 58) + "...)"
                                : tableMeta.rowData[1]}
                        </React.Fragment>
                    );
                },
            },
        },
        {
            name: t("READ"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton onClick={() => toggleRight("read", tableMeta.rowData[0])} disabled={readOnly}>
                            {tableMeta.rowData[2] ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
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
                        <IconButton onClick={() => toggleRight("write", tableMeta.rowData[0])} disabled={readOnly}>
                            {tableMeta.rowData[3] ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
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
                        <IconButton onClick={() => toggleRight("grant", tableMeta.rowData[0])} disabled={readOnly}>
                            {tableMeta.rowData[4] ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                        </IconButton>
                    );
                },
            },
        },
        {
            name: t("CREATE_DATE"),
            options: {
                display: false,
            },
        },
        {
            name: t("DELETE"),
            options: {
                filter: false,
                sort: false,
                empty: false,
                customHeadLabelRender: () => null,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => deleteShareRight(tableMeta.rowData[0])}
                            disabled={readOnly || !shareAdmin}
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

    const userColumnData = users.map((user) => {
        return [
            user.id,
            user.name,
            isMember(user.id),
            user.group_admin,
            user.share_admin,
            user.accepted,
            user.membership_create_date ? format(new Date(user.membership_create_date)) : "",
            user.is_current_user,
        ];
    });
    const shareRightColumnData = shares.map((share) => {
        return [share.id, share.title, share.read, share.write, share.grant, format(new Date(share.create_date))];
    });

    return (
        <Dialog
            fullWidth
            maxWidth={"lg"}
            open={open}
            onClose={() => {
                onClose();
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{t("EDIT_GROUP")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="groupName"
                            label={t("GROUP_NAME")}
                            name="groupName"
                            autoComplete="off"
                            value={groupName}
                            required
                            onChange={(event) => {
                                setGroupName(event.target.value);
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Divider style={{ marginTop: "20px", marginBottom: "10px" }} />
                        <Tabs
                            value={value}
                            indicatorColor="primary"
                            textColor="primary"
                            onChange={(event, newValue) => {
                                setValue(newValue);
                            }}
                            aria-label="users and groups"
                        >
                            <Tab label={t("USERS")} />
                            <Tab label={t("SHARE_RIGHTS")} />
                        </Tabs>
                        <TabPanel value={value} index={0} className={classes.tabPanel}>
                            <Table
                                data={userColumnData}
                                columns={userColumns}
                                options={options}
                                onCreate={readOnly ? null : onSearchUser}
                            />
                        </TabPanel>
                        <TabPanel value={value} index={1} className={classes.tabPanel}>
                            <Table data={shareRightColumnData} columns={shareRightColumns} options={options} />
                        </TabPanel>
                    </Grid>
                    <GridContainerErrors errors={errors} setErrors={setErrors} />
                </Grid>
                {newUserOpen && (
                    <DialogNewUser
                        open={newUserOpen}
                        onClose={() => setNewUserOpen(false)}
                        onCreate={onNewUserCreate}
                    />
                )}
                {Boolean(toggleOwnGroupAdminId) && (
                    <DialogVerify
                        title={"TOGGLE_GROUP_ADMIN"}
                        description={"TOGGLE_OWN_GROUP_ADMIN_WARNING"}
                        open={Boolean(toggleOwnGroupAdminId)}
                        onClose={() => setToggleOwnGroupAdminId(null)}
                        onConfirm={toggleOwnGroupAdminConfirmed}
                    />
                )}
                {Boolean(toggleGrantRightData) && (
                    <DialogVerify
                        title={"TOGGLE_GRANT_RIGHT"}
                        description={"TOGGLE_OWN_GRANT_RIGHT_WARNING"}
                        open={Boolean(toggleGrantRightData)}
                        onClose={() => setToggleGrantRightData(null)}
                        onConfirm={toggleGrantRightConfirmed}
                    />
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        onClose();
                    }}
                >
                    {t("CLOSE")}
                </Button>
                <Button onClick={onSave} variant="contained" color="primary" disabled={!groupName}>
                    {t("SAVE")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

DialogEditGroup.propTypes = {
    onClose: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    groupId: PropTypes.string.isRequired,
    readOnly: PropTypes.bool.isRequired,
};

export default DialogEditGroup;
