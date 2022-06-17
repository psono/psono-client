import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import { Checkbox, Grid } from "@material-ui/core";
import { Check } from "@material-ui/icons";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import IconButton from "@material-ui/core/IconButton";
import Divider from "@material-ui/core/Divider";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";

import helper from "../../services/helper";
import datastoreUserService from "../../services/datastore-user";
import groupsService from "../../services/groups";
import TabPanel from "../tab-panel";
import Table from "../table";
import DialogNewUser from "./new-user";
import CreateGroupDialog from "../../views/groups/create-group-dialog";

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
    const [value, setValue] = React.useState(0);
    const classes = useStyles();
    const [read, setRead] = useState(true);
    const [write, setWrite] = useState(false);
    const [grant, setGrant] = useState(false);
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [newGroupOpen, setNewGroupOpen] = React.useState(false);
    const [userDatastore, setUserDatastore] = useState({});
    const [newUserOpen, setNewUserOpen] = useState(false);
    const [userColumnData, setUserColumnData] = useState([]);
    const [groupColumnData, setGroupColumnData] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);

    let isSubscribed = true;
    React.useEffect(() => {
        loadUsers();
        loadGroups();
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
            name: "",
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton onClick={() => toggleSelect(tableMeta.rowData[0], "user")}>
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
            name: "",
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton onClick={() => toggleSelect(tableMeta.rowData[0], "group")}>
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
                        <Tabs
                            value={value}
                            indicatorColor="primary"
                            textColor="primary"
                            onChange={(event, newValue) => {
                                setValue(newValue);
                            }}
                            aria-label="users and groups"
                        >
                            <Tab label={t("TRUSTED_USERS")} />
                            <Tab label={t("KNOWN_GROUPS")} />
                        </Tabs>
                        <TabPanel value={value} index={0} className={classes.tabPanel}>
                            <Table
                                data={userColumnData}
                                columns={userColumns}
                                options={options}
                                onCreate={onCreateTrustedUser}
                            />
                        </TabPanel>
                        <TabPanel value={value} index={1} className={classes.tabPanel}>
                            <Table
                                data={groupColumnData}
                                columns={groupColumns}
                                options={options}
                                onCreate={onCreateGroup}
                            />
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
                >
                    {t("CREATE")}
                </Button>
            </DialogActions>
            {newGroupOpen && <CreateGroupDialog {...props} open={newGroupOpen} onClose={onCloseCreateGroupModal} />}
            {newUserOpen && (
                <DialogNewUser open={newUserOpen} onClose={() => setNewUserOpen(false)} onCreate={onNewUserCreate} />
            )}
        </Dialog>
    );
};

DialogNewShare.propTypes = {
    onClose: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    node: PropTypes.object.isRequired,
};

export default DialogNewShare;
