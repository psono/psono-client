import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import RestoreFromTrashIcon from "@material-ui/icons/RestoreFromTrash";
import DeleteForeverIcon from "@material-ui/icons/DeleteForever";
import IconButton from "@material-ui/core/IconButton";
import Table from "../table";
import widgetService from "../../services/widget";
import helper from "../../services/helper";
import DialogVerify from "./verify";

const DialogTrashBin = (props) => {
    const { open, onClose, datastore, datastoreType } = props;
    const { t } = useTranslation();
    const [entries, setEntries] = useState([]);
    const [entriesFull, setEntriesFull] = useState([]);
    const [verifyDeletePermanentOpen, setVerifyDeletePermanentOpen] = useState(false);
    const [entryIndexBeingDeleted, setEntryIndexBeingDeleted] = useState(0);

    let isSubscribed = true;
    React.useEffect(() => {
        fillRecyclingBinEntries(datastore);
        return () => (isSubscribed = false);
    }, []);

    const fillRecyclingBinEntries = (datastore) => {
        let index = 0;
        const newRecyclingBinEntries = [];
        const newRecyclingBinEntriesFull = [];

        const fillRecyclingBinEntriesHelper = (folder, path) => {
            let pathCopy;

            if (typeof folder === "undefined") {
                return;
            }

            if (folder.hasOwnProperty("deleted") && folder["deleted"]) {
                if (!folder.hasOwnProperty("share_rights") || !folder.share_rights.delete) {
                    return;
                }
                newRecyclingBinEntries.push([index, folder.name]);
                newRecyclingBinEntriesFull.push({
                    path: path,
                    item: folder,
                    type: "folder",
                });
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
                newRecyclingBinEntries.push([index, folder.items[i].name]);
                newRecyclingBinEntriesFull.push({
                    path: pathCopy,
                    item: folder.items[i],
                    type: "item",
                });
            }
        };

        fillRecyclingBinEntriesHelper(datastore, []);
        setEntries(newRecyclingBinEntries);
        setEntriesFull(newRecyclingBinEntriesFull);
    };

    const removeEntry = (index) => {
        const entriesClone = helper.duplicateObject(entries);
        const entriesFullClone = helper.duplicateObject(entriesFull);
        entriesClone.splice(index, 1);
        setEntries(entriesClone);
        entriesFullClone.splice(index, 1);
        setEntriesFull(entriesFullClone);
    };

    const restore = (index) => {
        const entry = entriesFull[index];
        widgetService.reverseMarkItemAsDeleted(datastore, entry["item"], entry["path"], datastoreType);
        removeEntry(index);
    };

    const deletePermanent = (index) => {
        setEntryIndexBeingDeleted(index);
        setVerifyDeletePermanentOpen(true);
    };

    const deletePermanentConfirmed = () => {
        setVerifyDeletePermanentOpen(false);
        const entry = entriesFull[entryIndexBeingDeleted];
        widgetService.deleteItem(datastore, entry["item"], entry["path"], datastoreType);
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
                        >
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
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                deletePermanent(tableMeta.rowData[0]);
                            }}
                        >
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
            <DialogTitle id="alert-dialog-title">{t("RECYCLING_BIN")}</DialogTitle>
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
                    description={entriesFull[entryIndexBeingDeleted].type === "item" ? "DELETE_ENTRY_PERMANENT_WARNING" : "DELETE_FOLDER_PERMANENT_WARNING"}
                    entries={[entriesFull[entryIndexBeingDeleted].item.name]}
                    affectedEntriesText={entriesFull[entryIndexBeingDeleted].type === "item" ? "AFFECTED_ENTRIES" : "AFFECTED_FOLDERS"}
                    open={verifyDeletePermanentOpen}
                    onClose={() => setVerifyDeletePermanentOpen(false)}
                    onConfirm={deletePermanentConfirmed}
                />
            )}
        </Dialog>
    );
};

DialogTrashBin.defaultProps = {
    datastoreType: "password",
};

DialogTrashBin.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    datastore: PropTypes.object.isRequired,
    datastoreType: PropTypes.string,
};

export default DialogTrashBin;
