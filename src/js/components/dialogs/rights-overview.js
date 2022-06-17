import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";

import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import CheckIcon from "@material-ui/icons/Check";
import IconButton from "@material-ui/core/IconButton";
import BlockIcon from "@material-ui/icons/Block";
import DeleteIcon from "@material-ui/icons/Delete";
import HourglassEmptyIcon from "@material-ui/icons/HourglassEmpty";

import shareService from "../../services/share";
import TabPanel from "../tab-panel";
import Table from "../table";
import store from "../../services/store";
import helper from "../../services/helper";
import DialogVerify from "./verify";

const useStyles = makeStyles((theme) => ({
    tabPanel: {
        "& .MuiBox-root": {
            padding: "16px 0px",
        },
    },
}));

const DialogRightsOverview = (props) => {
    const { open, onClose, item } = props;
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

    let isSubscribed = true;
    React.useEffect(() => {
        loadShareRights();
        return () => (isSubscribed = false);
    }, []);

    const loadShareRights = () => {
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
        if (store.getState().user.username === right.username) {
            setVerifyDeleteOwnShareRightData({ right: right });
            setVerifyDeleteOwnShareRightOpen(true);
        } else {
            return deleteRightWithoutFurtherWarning(right);
        }
    }

    const deleteOwnShareRightConfirmed = () => {
        return deleteRightWithoutFurtherWarning(verifyDeleteOwnShareRightData.right);
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

        if (type === "grant" && store.getState().user.username === right.username) {
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
                        >
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
                        >
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
                        >
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
                        >
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
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => deleteRight(tableMeta.rowData[0])}
                            disabled={!shareDetails.own_share_rights.grant}
                        >
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
                        >
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
                        >
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
                        >
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
                        >
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
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => deleteRight(tableMeta.rowData[0])}
                            disabled={!shareDetails.own_share_rights.grant}
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
                    <Table data={userShareRights} columns={userColumns} options={options} />
                </TabPanel>
                <TabPanel value={value} index={1} className={classes.tabPanel}>
                    <Table data={groupShareRights} columns={groupColumns} options={options} />
                </TabPanel>
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
        </Dialog>
    );
};

DialogRightsOverview.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    item: PropTypes.object.isRequired,
};

export default DialogRightsOverview;
