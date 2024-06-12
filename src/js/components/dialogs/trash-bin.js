import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import RestoreFromTrashIcon from "@mui/icons-material/RestoreFromTrash";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import IconButton from "@mui/material/IconButton";
import Table from "../table";
import widgetService from "../../services/widget";
import helper from "../../services/helper";
import DialogVerify from "./verify";

const DialogTrashBin = (props) => {
    const { open, onClose, datastore } = props;
    const { t } = useTranslation();
    const [entries, setEntries] = useState([]);
    const [entriesFull, setEntriesFull] = useState({});
    const [verifyDeletePermanentOpen, setVerifyDeletePermanentOpen] = useState(false);
    const [entryIndexBeingDeleted, setEntryIndexBeingDeleted] = useState(0);

    let isSubscribed = true;
    React.useEffect(() => {
        fillRecyclingBinEntries(datastore);
        return () => (isSubscribed = false);
    }, []);

    const fillRecyclingBinEntries = (datastore) => {
        const newRecyclingBinEntries = [];
        const newRecyclingBinEntriesFull = {};

        const fillRecyclingBinEntriesHelper = (folder, path) => {
            let pathCopy;

            if (typeof folder === "undefined") {
                return;
            }

            if (folder.hasOwnProperty("deleted") && folder["deleted"]) {
                if (folder.hasOwnProperty("share_rights") && !folder.share_rights.delete) {
                    return;
                }
                newRecyclingBinEntries.push([folder.id, folder.name]);
                newRecyclingBinEntriesFull[folder.id] = {
                    path: path,
                    item: folder,
                    type: "folder",
                };
                return;
            }

            let i;
            for (i = 0; folder.hasOwnProperty("folders") && i < folder.folders.length; i++) {
                pathCopy = path.slice();
                pathCopy.push(folder.folders[i].id);
                fillRecyclingBinEntriesHelper(folder.folders[i], pathCopy);
            }

            for (i = 0; folder.hasOwnProperty("items") && i < folder.items.length; i++) {
                if (!folder.items[i].hasOwnProperty("deleted") || !folder.items[i]["deleted"]) {
                    continue;
                }

                pathCopy = path.slice();
                pathCopy.push(folder.items[i].id);

                if (!folder.items[i].hasOwnProperty("share_rights") || !folder.items[i].share_rights.delete) {
                    continue;
                }
                newRecyclingBinEntries.push([folder.items[i].id, folder.items[i].name]);
                newRecyclingBinEntriesFull[folder.items[i].id] = {
                    path: pathCopy,
                    item: folder.items[i],
                    type: "item",
                };
            }
        };

        fillRecyclingBinEntriesHelper(datastore, []);
        setEntries(newRecyclingBinEntries);
        setEntriesFull(newRecyclingBinEntriesFull);
    };

    const removeEntry = (index) => {
        const entriesClone = helper.duplicateObject(entries);
        const entriesFullClone = helper.duplicateObject(entriesFull);
        const arrayIndex = entriesClone.findIndex(entry => {
            return entry[0] === index
        })
        entriesClone.splice(arrayIndex, 1);
        setEntries(entriesClone);
        delete entriesFullClone[index];
        setEntriesFull(entriesFullClone);
    };

    const restore = (index) => {
        const entry = entriesFull[index];
        widgetService.reverseMarkItemAsDeleted(datastore, entry["item"], entry["path"], "password");
        removeEntry(index);
    };

    const deletePermanent = (index) => {
        setEntryIndexBeingDeleted(index);
        setVerifyDeletePermanentOpen(true);
    };

    const deletePermanentConfirmed = () => {
        setVerifyDeletePermanentOpen(false);
        const entry = entriesFull[entryIndexBeingDeleted];
        widgetService.deleteItemPermanent(datastore, entry["path"], "password");
        removeEntry(entryIndexBeingDeleted);
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("TITLE") },
        {
            name: t("RESTORE"),
            options: {
                filter: false,
                sort: false,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                restore(tableMeta.rowData[0]);
                            }}
                            size="large">
                            <RestoreFromTrashIcon />
                        </IconButton>
                    );
                },
            },
        },
        {
            name: t("DELETE"),
            options: {
                filter: false,
                sort: false,
                empty: false,
                customHeadLabelRender: () => null,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                deletePermanent(tableMeta.rowData[0]);
                            }}
                            size="large">
                            <DeleteForeverIcon />
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
                {t("TRASH_BIN")}
            </DialogTitle>
            <DialogContent>
                <Table data={entries} columns={columns} options={options} />
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
            {verifyDeletePermanentOpen && (
                <DialogVerify
                    title={entriesFull[entryIndexBeingDeleted].type === "item" ? "DELETE_ENTRY" : "DELETE_FOLDER"}
                    description={
                        entriesFull[entryIndexBeingDeleted].type === "item"
                            ? "DELETE_ENTRY_PERMANENT_WARNING"
                            : "DELETE_FOLDER_PERMANENT_WARNING"
                    }
                    entries={[entriesFull[entryIndexBeingDeleted].item.name]}
                    affectedEntriesText={
                        entriesFull[entryIndexBeingDeleted].type === "item" ? "AFFECTED_ENTRIES" : "AFFECTED_FOLDERS"
                    }
                    open={verifyDeletePermanentOpen}
                    onClose={() => setVerifyDeletePermanentOpen(false)}
                    onConfirm={deletePermanentConfirmed}
                />
            )}
        </Dialog>
    );
};

DialogTrashBin.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    datastore: PropTypes.object.isRequired,
};

export default DialogTrashBin;
