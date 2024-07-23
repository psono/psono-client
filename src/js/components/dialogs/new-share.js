import React, { useState } from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { Checkbox, Grid } from "@mui/material";
import { Check } from "@mui/icons-material";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

import helper from "../../services/helper";
import datastoreUserService from "../../services/datastore-user";
import groupsService from "../../services/groups";
import TabPanel from "../tab-panel";
import Table from "../table";
import DialogNewUser from "./new-user";
import CreateGroupDialog from "../../views/groups/create-group-dialog";
import DialogError from "./error";

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

const DialogNewShare = (props) => {
    const { open, onClose, onCreate, node } = props;
    const { t } = useTranslation();
    const disableUnmanagedGroups = useSelector((state) => state.server.complianceDisableUnmanagedGroups);
    const classes = useStyles();
    const [value, setValue] = useState(0);
    const [read, setRead] = useState(true);
    const [write, setWrite] = useState(false);
    const [grant, setGrant] = useState(false);
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [newGroupOpen, setNewGroupOpen] = useState(false);
    const [userDatastore, setUserDatastore] = useState({});
    const [newUserOpen, setNewUserOpen] = useState(false);
    const [userColumnData, setUserColumnData] = useState([]);
    const [groupColumnData, setGroupColumnData] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);

    let isSubscribed = true;
    React.useEffect(() => {
        if (props.users) {
            loadUsers();
        }
        if (props.groups) {
            loadGroups();
        }
        return () => (isSubscribed = false);
    }, []);

    const loadUsers = () => {
        datastoreUserService.getUserDatastore().then(function (newUserDatastore) {
            if (!isSubscribed) {
                return;
            }
            const newUsers = [];
            setUserDatastore(newUserDatastore);
            helper.createList(newUserDatastore, newUsers);
            setUsers(newUsers);
            setUserColumnData(newUsers.map((user) => [user.id, user.name]));
        });
    };

    const loadGroups = () => {
        groupsService.readGroups(true).then(function (newGroups) {
            if (!isSubscribed) {
                return;
            }
            helper.removeFromArray(newGroups, "", function (a, b) {
                return !a.share_admin;
            });
            setGroups(newGroups);
            setGroupColumnData(newGroups.map((group) => [group.group_id, group.name]));
        });
    };

    const toggleSelect = (entityId, type) => {
        let searchArray;
        if (type === "user") {
            searchArray = helper.duplicateObject(selectedUsers);
        } else {
            searchArray = helper.duplicateObject(selectedGroups);
        }

        var array_index = searchArray.indexOf(entityId);
        if (array_index > -1) {
            //its selected, lets deselect it
            searchArray.splice(array_index, 1);
        } else {
            searchArray.push(entityId);
        }
        if (type === "user") {
            setSelectedUsers(searchArray);
        } else {
            setSelectedGroups(searchArray);
        }
    };

    const onNewUserCreate = (userObject) => {
        setNewUserOpen(false);
        datastoreUserService.addUserToDatastore(userDatastore, userObject).then(
            () => {
                loadUsers();
            },
            (error) => {
                console.log(error);
            }
        );
    };

    const onCreateTrustedUser = () => {
        setNewUserOpen(true);
    };

    const onCloseCreateGroupModal = () => {
        setNewGroupOpen(false);
        loadGroups();
    };
    const onCreateGroup = () => {
        setNewGroupOpen(true);
    };

    const userColumns = [
        { name: t("ID"), options: { display: false } },
        {
            name: t("USER"),
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
            name: t("INVITE"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customHeadLabelRender: () => null,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton onClick={() => toggleSelect(tableMeta.rowData[0], "user")} size="large">
                            {selectedUsers.indexOf(tableMeta.rowData[0]) > -1 ? (
                                <CheckBoxIcon />
                            ) : (
                                <CheckBoxOutlineBlankIcon />
                            )}
                        </IconButton>
                    );
                },
            },
        },
    ];

    const groupColumns = [
        { name: t("ID"), options: { display: false } },
        {
            name: t("GROUP"),
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
            name: t("INVITE"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customHeadLabelRender: () => null,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton onClick={() => toggleSelect(tableMeta.rowData[0], "group")} size="large">
                            {selectedGroups.indexOf(tableMeta.rowData[0]) > -1 ? (
                                <CheckBoxIcon />
                            ) : (
                                <CheckBoxOutlineBlankIcon />
                            )}
                        </IconButton>
                    );
                },
            },
        },
    ];

    const options = {
        filterType: "checkbox",
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
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                }}
                name="createShare"
                autoComplete="off"
            >

                <DialogTitle id="alert-dialog-title">
                    {t("SHARE")} {node.name}
                </DialogTitle>
                <DialogContent>
                    <Grid container>
                        <Grid item xs={4} sm={4} md={4}>
                            <Checkbox
                                tabIndex={1}
                                checked={read}
                                onChange={(event) => {
                                    setRead(event.target.checked);
                                }}
                                checkedIcon={<Check className={classes.checkedIcon} />}
                                icon={<Check className={classes.uncheckedIcon} />}
                                classes={{
                                    checked: classes.checked,
                                }}
                            />{" "}
                            {t("READ")}
                        </Grid>
                        <Grid item xs={4} sm={4} md={4}>
                            <Checkbox
                                tabIndex={1}
                                checked={write}
                                onChange={(event) => {
                                    setWrite(event.target.checked);
                                }}
                                checkedIcon={<Check className={classes.checkedIcon} />}
                                icon={<Check className={classes.uncheckedIcon} />}
                                classes={{
                                    checked: classes.checked,
                                }}
                            />{" "}
                            {t("WRITE")}
                        </Grid>
                        <Grid item xs={4} sm={4} md={4}>
                            <Checkbox
                                tabIndex={1}
                                checked={grant}
                                onChange={(event) => {
                                    setGrant(event.target.checked);
                                }}
                                checkedIcon={<Check className={classes.checkedIcon} />}
                                icon={<Check className={classes.uncheckedIcon} />}
                                classes={{
                                    checked: classes.checked,
                                }}
                            />{" "}
                            {t("ADMIN")}
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <Divider style={{ marginTop: "20px", marginBottom: "10px" }} />
                            {props.users && (
                                <Table
                                    data={userColumnData}
                                    columns={userColumns}
                                    options={options}
                                    onCreate={onCreateTrustedUser}
                                />
                            )}
                            {props.groups && (
                                <Table
                                    data={groupColumnData}
                                    columns={groupColumns}
                                    options={options}
                                    onCreate={disableUnmanagedGroups ? undefined : onCreateGroup}
                                />
                            )}
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
                    <Button
                        onClick={() => {
                            onCreate(
                                users.filter((user) => selectedUsers.indexOf(user.id) > -1),
                                groups.filter((group) => selectedGroups.indexOf(group.group_id) > -1),
                                read,
                                write,
                                grant
                            );
                        }}
                        variant="contained"
                        color="primary"
                        type="submit"
                    >
                        {t("CREATE")}
                    </Button>
                </DialogActions>
                {newGroupOpen && <CreateGroupDialog {...props} open={newGroupOpen} onClose={onCloseCreateGroupModal} />}
                {newUserOpen && (
                    <DialogNewUser open={newUserOpen} onClose={() => setNewUserOpen(false)} onCreate={onNewUserCreate} />
                )}
            </form>
        </Dialog>
    );
};

DialogNewShare.propTypes = {
    onClose: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    node: PropTypes.object.isRequired,
    users: PropTypes.bool.isRequired,
    groups: PropTypes.bool.isRequired,
};

export default DialogNewShare;
