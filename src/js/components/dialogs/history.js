import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Grid } from "@mui/material";
import Table from "../table";
import historyService from "../../services/history";
import format from "../../services/date";
import DialogEditEntry from "./edit-entry";
import helper from "../../services/helper";

const DialogHistory = (props) => {
    const { open, onClose, item } = props;
    const { t } = useTranslation();
    const [historyItems, setHistoryItems] = useState([]);
    const [editEntryOpen, setEditEntryOpen] = useState(false);
    const [historyData, setHistoryData] = useState({});
    const [readOnlyItem, setReadOnlyItem] = useState({});

    let isSubscribed = true;
    React.useEffect(() => {
        const clonedItem = helper.duplicateObject(item);
        clonedItem.share_rights = {
            read: true,
            write: false,
            grant: false,
            delete: false,
        };
        setReadOnlyItem(clonedItem);
        loadHistoryItems();
        return () => (isSubscribed = false);
    }, []);

    const loadHistoryItems = () => {
        historyService.readSecretHistory(item.secret_id).then(function (history) {
            if (!isSubscribed) {
                return;
            }
            setHistoryItems(
                history.map((historyItem) => [
                    historyItem.id,
                    format(new Date(historyItem.create_date)),
                    historyItem.username,
                    new Date(historyItem.create_date),
                ])
            );
        });
    };

    const showHistoryItem = (historyItemId) => {
        historyService.readHistory(historyItemId, item.secret_key).then(function (data) {
            setHistoryData(data);
            setEditEntryOpen(true);
        });
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        {
            name: t("DATE"),
            options: {
                sortCompare: (order) => {
                    return (obj1, obj2) => {
                        return (obj1.rowData[3] - obj2.rowData[3]) * (order === 'asc' ? 1 : -1);
                    };
                }
            },
        },
        { name: t("USER") },
        {
            name: t("SHOW"),
            options: {
                filter: false,
                sort: false,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                showHistoryItem(tableMeta.rowData[0]);
                            }}
                            size="large">
                            <VisibilityIcon />
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
            <DialogTitle id="alert-dialog-title">{t("HISTORY")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <Table data={historyItems} columns={columns} options={options} />
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
            {editEntryOpen && (
                <DialogEditEntry
                    open={editEntryOpen}
                    onClose={() => setEditEntryOpen(false)}
                    item={readOnlyItem}
                    data={historyData}
                    hideLinkToEntry={true}
                    hideShowHistory={true}
                    hideMoreMenu={true}
                    setDirty={() => {}}
                />
            )}
        </Dialog>
    );
};

DialogHistory.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    item: PropTypes.object.isRequired,
};

export default DialogHistory;
