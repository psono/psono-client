import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import { Grid } from "@mui/material";

import datastoreUserService from "../../services/datastore-user";
import helperService from "../../services/helper";
import Table from "../table";
import CreateGroupDialog from "../../views/groups/create-group-dialog";
import {useSelector} from "react-redux";
import groupsService from "../../services/groups";
import helper from "../../services/helper";

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

const DialogSelectGroup = (props) => {
    const { open, onClose } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const disableUnmanagedGroups = useSelector((state) => state.server.complianceDisableUnmanagedGroups);

    const [groups, setGroups] = useState([]);
    const [newGroupOpen, setNewGroupOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);

    let isSubscribed = true;
    React.useEffect(() => {
        loadGroups();
        // cancel subscription to useEffect
        return () => (isSubscribed = false);
    }, []);

    const loadGroups = () => {
        groupsService.readGroups(true).then(function (newGroups) {
            if (!isSubscribed) {
                return;
            }
            helper.removeFromArray(newGroups, "", function (a, b) {
                return !a.share_admin;
            });
            setGroups(newGroups);
        });
    };

    const onNewGroupClose = (userObject) => {
        // called once someone clicked the CREATE button in the dialog closes with the infos about the group
        setNewGroupOpen(false);
        loadGroups();
    };

    const onCreateGroup = () => {
        setNewGroupOpen(true);
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
        { name: t("GROUP") },
        {
            name: t("SELECTED"),
            options: {
                filter: false,
                sort: true,
                empty: false,
                customHeadLabelRender: () => null,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton onClick={() => toggleUser(tableMeta.rowData[0])} size="large">
                            {selectedUsers.includes(tableMeta.rowData[0]) ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                        </IconButton>
                    );
                },
            },
        },
    ];

    const groupColumnData = groups.map((group) => [group.group_id, group.name])

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
            <DialogTitle id="alert-dialog-title">{t("GROUP_SELECTION")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} className={classes.tree}>
                        <Table
                            data={groupColumnData}
                            columns={columns}
                            options={options}
                            onCreate={disableUnmanagedGroups ? undefined : onCreateGroup}
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
            {newGroupOpen && (
                <CreateGroupDialog
                    open={newGroupOpen}
                    onClose={onNewGroupClose}
                />
            )}
        </Dialog>
    );
};

DialogSelectGroup.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default DialogSelectGroup;
