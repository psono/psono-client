import React, {useState} from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import Paper from "@mui/material/Paper";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Typography from "@mui/material/Typography";
import HowToRegIcon from '@mui/icons-material/HowToReg';
import TaskIcon from '@mui/icons-material/Task';

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
    toolbarRoot: {
        backgroundColor: theme.palette.baseTitleBackground.main,
    },
    root: {
        padding: "15px",
    },
    button: {
        marginTop: "5px",
        marginBottom: "5px",
    },
    iconButton: {
        padding: 10,
        display: "inline-flex",
    },
    icon: {
        fontSize: "18px",
    },
    listItemIcon: {
        minWidth: theme.spacing(4),
    },
    search: {
        marginLeft: "auto",
        position: "absolute",
        right: 0,
        [theme.breakpoints.up("sm")]: {
            marginRight: theme.spacing(1),
        },
    },
}));

const GroupsView = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const disableUnmanagedGroups = useSelector((state) => state.server.complianceDisableUnmanagedGroups);
    let isSubscribed = true;
    const [anchorEl, setAnchorEl] = useState(null);
    const [editGroup, setEditGroup] = React.useState(null);
    const [leaveGroupData, setLeaveGroupData] = React.useState([]);
    const [groups, setGroups] = React.useState([]);
    const [createOpen, setCreateOpen] = React.useState(false);
    const [groupIdBeingDeleted, setGroupIdBeingDeleted] = React.useState("");
    const [groupNameBeingDeleted, setGroupNameBeingDeleted] = React.useState("");
    const [verifyDeleteGroupOpen, setVerifyDeleteGroupOpen] = React.useState(false);
    const [outstandingShareIndex, setOutstandingShareIndex] = React.useState({});
    const [acceptGroupIds, setAcceptGroupIds] = React.useState([]);
    const [acceptGroupSharesGroupIds, setAcceptGroupSharesGroupIds] = React.useState([]);
    const [groupIndex, setGroupIndex] = React.useState({});


    const allGroupsIdsWithOutstandingShares = []
    const allNewGroupIds = []

    for (const group of groups) {
        if (group[3] === true && outstandingShareIndex[group[0]]) {
            allGroupsIdsWithOutstandingShares.push(group[0]);
        }
        if (group[3] !== false && group[3] !== true) {
            allNewGroupIds.push(group[0]);
        }
    }

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
                        group.forced_membership || false,
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
        setAcceptGroupIds([rowData[0]]);
    };

    const acceptNewShares = (rowData) => {
        setAcceptGroupSharesGroupIds([rowData[0]]);
    };

    const onAcceptAllGroups = () => {
        setAcceptGroupIds(allNewGroupIds)
    }

    const onAcceptAllNewShares = () => {
        setAcceptGroupSharesGroupIds(allGroupsIdsWithOutstandingShares)
    }

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
                customHeadLabelRender: () => null,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                onEdit(tableMeta.rowData);
                            }}
                            disabled={
                                (tableMeta.rowData[3] !== false && tableMeta.rowData[3] !== true)
                            }
                            size="large">
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
                    const groupId = tableMeta.rowData[0];
                    return (
                        tableMeta.rowData[3] !== false &&
                        tableMeta.rowData[3] !== true && (
                            <Button
                                className={classes.button}
                                onClick={() => {
                                    declineGroup(tableMeta.rowData);
                                }}
                                disabled={groupIndex[groupId] && groupIndex[groupId].forced_membership === true}
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
                    const groupId = tableMeta.rowData[0];
                    return (
                        <IconButton
                            onClick={() => {
                                leaveGroup(tableMeta.rowData);
                            }}
                            disabled={(tableMeta.rowData[3] !== false && tableMeta.rowData[3] !== true) || (groupIndex[groupId] && groupIndex[groupId].forced_membership === true)}
                            size="large">
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
                customHeadLabelRender: () => null,
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
                        <Toolbar
                            className={classes.toolbarRoot}
                        >
                            {t("GROUPS")}
                            <div className={classes.search}>
                                {(allNewGroupIds.length > 0 || allGroupsIdsWithOutstandingShares.length > 0) && (<IconButton
                                    color="primary"
                                    className={classes.iconButton}
                                    aria-label="menu"
                                    onClick={openMenu}
                                    size="large">
                                    <MenuOpenIcon/>
                                </IconButton>)}
                                <Menu
                                    id="simple-menu"
                                    anchorEl={anchorEl}
                                    keepMounted
                                    open={Boolean(anchorEl)}
                                    onClose={handleClose}
                                    onContextMenu={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                    }}
                                >
                                    {allNewGroupIds.length > 0 && (<MenuItem onClick={() => {
                                        setAnchorEl(null);
                                        onAcceptAllGroups()
                                    }}>
                                        <ListItemIcon className={classes.listItemIcon}>
                                            <HowToRegIcon className={classes.icon} fontSize="small"/>
                                        </ListItemIcon>
                                        <Typography variant="body2" noWrap>
                                            {t("ACCEPT_ALL_GROUPS")}
                                        </Typography>
                                    </MenuItem>)}
                                    {allGroupsIdsWithOutstandingShares.length > 0 && (<MenuItem onClick={() => {
                                        setAnchorEl(null);
                                        onAcceptAllNewShares()
                                    }}>
                                        <ListItemIcon className={classes.listItemIcon}>
                                            <TaskIcon className={classes.icon} fontSize="small"/>
                                        </ListItemIcon>
                                        <Typography variant="body2" noWrap>
                                            {t("ACCEPT_ALL_NEW_SHARES")}
                                        </Typography>
                                    </MenuItem>)}
                                </Menu>
                            </div>
                        </Toolbar>
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
                {acceptGroupIds.length > 0 && (
                    <DialogAcceptGroup
                        groupIndex={groupIndex}
                        groupIds={acceptGroupIds}
                        open={acceptGroupIds.length > 0}
                        hideUser={!groupIndex[acceptGroupIds[0]].user_id || acceptGroupIds.length > 1}
                        onClose={() => {
                            setAcceptGroupIds([]);
                            loadGroups();
                        }}
                    />
                )}
                {acceptGroupSharesGroupIds.length > 0 && (
                    <DialogAcceptGroupShares
                        groupIndex={groupIndex}
                        groupIds={acceptGroupSharesGroupIds}
                        outstandingShareIndex={outstandingShareIndex}
                        open={acceptGroupSharesGroupIds.length > 0}
                        hideUser={!groupIndex[acceptGroupSharesGroupIds[0]].user_id || acceptGroupSharesGroupIds.length > 1}
                        onClose={() => {
                            setAcceptGroupSharesGroupIds([]);
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
