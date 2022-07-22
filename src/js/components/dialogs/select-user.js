import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from '@material-ui/icons/CheckBox';

import { Grid } from "@material-ui/core";

import datastoreUserService from "../../services/datastore-user";
import helperService from "../../services/helper";
import Table from "../table";
import DialogNewUser from "./new-user";
import format from "../../services/date";

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
    tree: {
        marginTop: "8px",
        marginBottom: "8px",
    },
}));

const DialogSelectUser = (props) => {
    const { open, onClose } = props;
    const { t } = useTranslation();
    const classes = useStyles();

    const [users, setUsers] = useState([]);
    const [newUserOpen, setNewUserOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);

    let isSubscribed = true;
    React.useEffect(() => {
        loadUsers();
        // cancel subscription to useEffect
        return () => (isSubscribed = false);
    }, []);

    const loadUsers = () => {
        datastoreUserService.getUserDatastore().then(function (userDatastore) {
            if (!isSubscribed) {
                return;
            }
            const newUsers = [];
            helperService.createList(userDatastore, newUsers);
            setUsers(newUsers);

        })
    }

    const onNewUserCreate = (userObject) => {
        // called once someone clicked the CREATE button in the dialog closes with the infos about the user
        setNewUserOpen(false);

        datastoreUserService.getUserDatastore().then(function (datastore) {
            datastoreUserService.addUserToDatastore(datastore, userObject).then(
                () => {
                    loadUsers();
                },
                (error) => {
                    console.log(error);
                }
            );
        });
    };

    const onSearchUser = () => {
        setNewUserOpen(true);
    };

    const toggleUser = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter((selectedUserId) => selectedUserId !== userId))
        } else {
            setSelectedUsers([...selectedUsers, userId])
        }
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("USER") },
        {
            name: t("SELECTED"),
            options: {
                filter: false,
                sort: true,
                empty: false,
                customHeadLabelRender: () => null,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => toggleUser(tableMeta.rowData[0])}
                        >
                            {selectedUsers.includes(tableMeta.rowData[0]) ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                        </IconButton>
                    );
                },
            },
        },
    ];

    const userColumnData = users.map((user) => {
        return [
            user.data.user_id,
            user.name,
        ];
    });

    const options = {
        filterType: "checkbox",
    };

    return (
        <Dialog
            fullWidth
            maxWidth={"sm"}
            open={open}
            onClose={() => {
                onClose([]);
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{t("USER_SELECTION")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} className={classes.tree}>
                        <Table
                            data={userColumnData}
                            columns={columns}
                            options={options}
                            onCreate={onSearchUser}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        onClose([]);
                    }}
                >
                    {t("CLOSE")}
                </Button>
                <Button
                    onClick={() => {
                        onClose(selectedUsers);
                    }}
                    variant="contained"
                    color="primary"
                    disabled={selectedUsers.length === 0}
                >
                    {t("SAVE")}
                </Button>
            </DialogActions>
            {newUserOpen && (
                <DialogNewUser
                    open={newUserOpen}
                    onClose={() => setNewUserOpen(false)}
                    onCreate={onNewUserCreate}
                />
            )}
        </Dialog>
    );
};

DialogSelectUser.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default DialogSelectUser;
