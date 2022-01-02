import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import VisibilityIcon from "@material-ui/icons/Visibility";
import { Grid } from "@material-ui/core";
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
            setHistoryItems(history.map((historyItem) => [historyItem.id, format(new Date(historyItem.create_date)), historyItem.username]));
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
        { name: t("DATE") },
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
                        >
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
