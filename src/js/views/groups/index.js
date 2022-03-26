import React from "react";
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
import Base from "../../containers/base";
import BaseTitle from "../../containers/base-title";
import BaseContent from "../../containers/base-content";
import Table from "../../components/table";
import groupsService from "../../services/groups";
import format from "../../services/date";
import CreateGroupDialog from "./create-group-dialog";
import DialogVerify from "../../components/dialogs/verify";
import DialogEditGroup from "../../components/dialogs/edit-group";

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
    let isSubscribed = true;
    const [editGroup, setEditGroup] = React.useState(null);
    const [leaveGroupData, setLeaveGroupData] = React.useState([]);
    const [groups, setGroups] = React.useState([]);
    const [createOpen, setCreateOpen] = React.useState(false);
    const [groupIdBeingDeleted, setGroupIdBeingDeleted] = React.useState("");
    const [groupNameBeingDeleted, setGroupNameBeingDeleted] = React.useState("");
    const [verifyDeleteGroupOpen, setVerifyDeleteGroupOpen] = React.useState(false);
    const [outstandingShareIndex, setOutstandingShareIndex] = React.useState({});

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
            setGroups(
                newGroups.map((group, index) => {
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
        console.log(rowData);
        // TODO implement accept new group
    };

    const acceptNewShares = (rowData) => {
        console.log(rowData);
        // TODO implement accept new shares
    };

    const declineGroup = (rowData) => {
        // TODO implement decline group
        // shareService.declineShareRight(rowData[6]).then(() => {
        //     loadGroups();
        // });
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
        { name: t("CREATED"), options: { display: false } },
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
                        <Table data={groups} columns={columns} options={options} onCreate={onCreate} />
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
            </BaseContent>
        </Base>
    );
};

export default GroupsView;
