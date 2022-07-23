import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import Base from "../../components/base";
import BaseTitle from "../../components/base-title";
import BaseContent from "../../components/base-content";
import Table from "../../components/table";
import groupsService from "../../services/groups";
import format from "../../services/date";
import CreateGroupDialog from "./create-group-dialog";
import DialogVerify from "../../components/dialogs/verify";
import DialogEditGroup from "../../components/dialogs/edit-group";
import DialogAcceptGroup from "../../components/dialogs/accept-group";
import DialogAcceptGroupShares from "../../components/dialogs/accept-group-shares";

const useStyles = makeStyles((theme) => ({
    root: {
        padding: "15px",
    },
    toolbarRoot: {
        display: "flex",
    },
    button: {
        marginTop: "5px",
        marginBottom: "5px",
    },
}));

const GroupsView = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const disableUnmanagedGroups = useSelector((state) => state.server.complianceDisableUnmanagedGroups);
    let isSubscribed = true;
    const [editGroup, setEditGroup] = React.useState(null);
    const [leaveGroupData, setLeaveGroupData] = React.useState([]);
    const [groups, setGroups] = React.useState([]);
    const [createOpen, setCreateOpen] = React.useState(false);
    const [groupIdBeingDeleted, setGroupIdBeingDeleted] = React.useState("");
    const [groupNameBeingDeleted, setGroupNameBeingDeleted] = React.useState("");
    const [verifyDeleteGroupOpen, setVerifyDeleteGroupOpen] = React.useState(false);
    const [outstandingShareIndex, setOutstandingShareIndex] = React.useState({});
    const [acceptGroupId, setAcceptGroupId] = React.useState("");
    const [acceptGroupSharesGroupId, setAcceptGroupSharesGroupId] = React.useState("");
    const [groupIndex, setGroupIndex] = React.useState({});

    React.useEffect(() => {
        loadGroups();
        loadOutstandingGroupShares();
        // cancel subscription to useEffect
        return () => (isSubscribed = false);
    }, []);

    const loadGroups = function () {
        const onSuccess = function (newGroups) {
            if (!isSubscribed) {
                return;
            }
            const _groupIndex = {};
            setGroups(
                newGroups.map((group, index) => {
                    _groupIndex[group.group_id] = group;
                    return [
                        group.group_id,
                        group.name,
                        format(new Date(group.membership_create_date)),
                        group.accepted,
                        group.group_admin,
                        group.membership_id,
                        group.private_key,
                        group.private_key_nonce,
                        group.private_key_type,
                        group.public_key,
                        group.secret_key,
                        group.secret_key_nonce,
                        group.secret_key_type,
                        group.share_admin,
                    ];
                })
            );
            setGroupIndex(_groupIndex);
        };
        const onError = function (data) {
            //pass
            console.log(data);
        };
        return groupsService.readGroups(true).then(onSuccess, onError);
    };

    const loadOutstandingGroupShares = function () {
        groupsService.getOutstandingGroupShares().then(function (newOutstandingShareIndex) {
            if (!isSubscribed) {
                return;
            }
            setOutstandingShareIndex(newOutstandingShareIndex);
        });
    };

    const acceptGroup = (rowData) => {
        setAcceptGroupId(rowData[0]);
    };

    const acceptNewShares = (rowData) => {
        setAcceptGroupSharesGroupId(rowData[0]);
    };

    const declineGroup = (rowData) => {
        const onSuccess = function (data) {
            loadGroups();
        };

        const onError = function () {
            //pass
        };

        groupsService.declineMembership(rowData[5]).then(onSuccess, onError);
    };

    const onEdit = (rowData) => {
        setEditGroup({
            groupId: rowData[0],
            readOnly: !rowData[4],
        });
    };

    const onCreate = () => {
        setCreateOpen(true);
    };

    const leaveGroup = (rowData) => {
        setLeaveGroupData(rowData);
    };

    const confirmLeaveGroup = () => {
        setLeaveGroupData([]);
        const onSuccess = function (data) {
            loadGroups();
        };

        const onError = function () {
            //pass
        };

        groupsService.deleteMembership(leaveGroupData[5]).then(onSuccess, onError);
    };

    const deleteGroup = (tableMeta) => {
        setGroupIdBeingDeleted(tableMeta.rowData[0]);
        setGroupNameBeingDeleted(tableMeta.rowData[1]);
        setVerifyDeleteGroupOpen(true);
    };

    const closeCreateModal = () => {
        const onSuccess = function () {
            setCreateOpen(false);
        };

        const onError = function (error) {
            console.log(error);
        };

        return loadGroups().then(onSuccess, onError);
    };

    const onGroupEdited = () => {
        setEditGroup(null);
        loadGroups();
    };

    const deleteGroupConfirmed = () => {
        const onSuccess = function (data) {
            const onSuccess = function () {
                setVerifyDeleteGroupOpen(false);
            };

            const onError = function (error) {
                console.log(error);
            };

            return loadGroups().then(onSuccess, onError);
        };

        const onError = function (error) {
            console.log(error);
        };

        groupsService.deleteGroup(groupIdBeingDeleted).then(onSuccess, onError);
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("NAME") },
        { name: t("CREATED_ON"), options: { display: false } },
        {
            name: t("EDIT"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                onEdit(tableMeta.rowData);
                            }}
                            disabled={
                                !tableMeta.rowData[4] ||
                                (tableMeta.rowData[3] !== false && tableMeta.rowData[3] !== true)
                            }
                        >
                            <EditIcon />
                        </IconButton>
                    );
                },
            },
        },
        {
            name: t("ACCEPT"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <>
                            {tableMeta.rowData[3] !== false && tableMeta.rowData[3] !== true && (
                                <Button
                                    className={classes.button}
                                    onClick={() => {
                                        acceptGroup(tableMeta.rowData);
                                    }}
                                >
                                    {t("ACCEPT")}
                                </Button>
                            )}
                            {tableMeta.rowData[3] === true && outstandingShareIndex[tableMeta.rowData[0]] && (
                                <Button
                                    className={classes.button}
                                    onClick={() => {
                                        acceptNewShares(tableMeta.rowData);
                                    }}
                                >
                                    {t("ACCEPT_NEW_SHARES")}
                                </Button>
                            )}
                        </>
                    );
                },
                sortCompare: (order) => {
                    return (obj1, obj2) => {
                        let val1 = ''
                        if (obj1.rowData[3] !== false && obj1.rowData[3] !== true) {
                            val1 = t("ACCEPT")
                        }
                        if (obj1.rowData[3] === true && outstandingShareIndex[obj1.rowData[0]]) {
                            val1 = t("ACCEPT_NEW_SHARES")
                        }
                        let val2 = ''
                        if (obj2.rowData[3] !== false && obj2.rowData[3] !== true) {
                            val2 = t("ACCEPT")
                        }
                        if (obj2.rowData[3] === true && outstandingShareIndex[obj2.rowData[0]]) {
                            val2 = t("ACCEPT_NEW_SHARES")
                        }

                        return val1.localeCompare(val2) * (order === 'asc' ? 1 : -1);
                    };
                }
            },
        },
        {
            name: t("DECLINE"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        tableMeta.rowData[3] !== false &&
                        tableMeta.rowData[3] !== true && (
                            <Button
                                className={classes.button}
                                onClick={() => {
                                    declineGroup(tableMeta.rowData);
                                }}
                            >
                                {t("DECLINE")}
                            </Button>
                        )
                    );
                },
                sortCompare: (order) => {
                    return (obj1, obj2) => {
                        let val1 = ''
                        if (obj1.rowData[3] !== false &&
                            obj1.rowData[3] !== true) {
                            val1 = t("DECLINE")
                        }
                        let val2 = ''
                        if (obj2.rowData[3] !== false &&
                            obj2.rowData[3] !== true) {
                            val2 = t("DECLINE")
                        }

                        return val1.localeCompare(val2) * (order === 'asc' ? 1 : -1);
                    };
                }
            },
        },
        {
            name: t("LEAVE"),
            options: {
                filter: true,
                sort: false,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                leaveGroup(tableMeta.rowData);
                            }}
                            disabled={tableMeta.rowData[3] !== false && tableMeta.rowData[3] !== true}
                        >
                            <ExitToAppIcon />
                        </IconButton>
                    );
                },
            },
        },
        {
            name: t("DELETE"),
            options: {
                filter: true,
                sort: false,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                deleteGroup(tableMeta);
                            }}
                            disabled={
                                !tableMeta.rowData[4] ||
                                (tableMeta.rowData[3] !== false && tableMeta.rowData[3] !== true)
                            }
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

    const onEditGroupClosed = () => {
        setEditGroup(null);
        loadGroups();
    };

    return (
        <Base {...props}>
            <BaseTitle>{t("LIST_OF_GROUPS")}</BaseTitle>
            <BaseContent>
                <Paper square>
                    <AppBar elevation={0} position="static" color="default">
                        <Toolbar className={classes.toolbarRoot}>{t("GROUPS")}</Toolbar>
                    </AppBar>
                    <div className={classes.root}>
                        <Table data={groups} columns={columns} options={options} onCreate={disableUnmanagedGroups ? undefined : onCreate} />
                    </div>
                </Paper>
                {createOpen && <CreateGroupDialog {...props} open={createOpen} onClose={closeCreateModal} />}
                {Boolean(editGroup) && (
                    <DialogEditGroup
                        groupId={editGroup.groupId}
                        readOnly={editGroup.readOnly}
                        open={Boolean(editGroup)}
                        onClose={onEditGroupClosed}
                        onEdit={onGroupEdited}
                    />
                )}
                {verifyDeleteGroupOpen && (
                    <DialogVerify
                        title={"DELETE_GROUP"}
                        description={"DELETE_GROUP_WARNING"}
                        entries={[groupNameBeingDeleted]}
                        affectedEntriesText={"AFFECTED_GROUPS"}
                        open={verifyDeleteGroupOpen}
                        onClose={() => setVerifyDeleteGroupOpen(false)}
                        onConfirm={deleteGroupConfirmed}
                    />
                )}
                {leaveGroupData.length > 0 && (
                    <DialogVerify
                        title={"LEAVE_GROUP"}
                        description={"LEAVE_GROUP_WARNING"}
                        entries={[leaveGroupData[1]]}
                        affectedEntriesText={"AFFECTED_GROUPS"}
                        open={leaveGroupData.length > 0}
                        onClose={() => setLeaveGroupData([])}
                        onConfirm={confirmLeaveGroup}
                    />
                )}
                {Boolean(acceptGroupId) && (
                    <DialogAcceptGroup
                        group={groupIndex[acceptGroupId]}
                        open={Boolean(acceptGroupId)}
                        hideUser={!groupIndex[acceptGroupId].user_id}
                        onClose={() => {
                            setAcceptGroupId("");
                            loadGroups();
                        }}
                    />
                )}
                {Boolean(acceptGroupSharesGroupId) && (
                    <DialogAcceptGroupShares
                        group={groupIndex[acceptGroupSharesGroupId]}
                        outstandingShareIndex={outstandingShareIndex[acceptGroupSharesGroupId]}
                        open={Boolean(acceptGroupSharesGroupId)}
                        hideUser={!groupIndex[acceptGroupSharesGroupId].user_id}
                        onClose={() => {
                            setAcceptGroupSharesGroupId("");
                            loadGroups();
                            loadOutstandingGroupShares();
                        }}
                    />
                )}
            </BaseContent>
        </Base>
    );
};

export default GroupsView;
