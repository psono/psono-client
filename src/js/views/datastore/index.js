import React, { useState, useReducer } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { differenceInSeconds } from "date-fns";
import { ClipLoader } from "react-spinners";
import { useParams } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import { makeStyles } from '@mui/styles';
import Paper from "@mui/material/Paper";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import IconButton from "@mui/material/IconButton";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import ListItemIcon from "@mui/material/ListItemIcon";
import Typography from "@mui/material/Typography";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import AddIcon from "@mui/icons-material/Add";
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import Base from "../../components/base";
import BaseTitle from "../../components/base-title";
import BaseContent from "../../components/base-content";
import widget from "../../services/widget";
import DialogNewFolder from "../../components/dialogs/new-folder";
import DialogNewEntry from "../../components/dialogs/new-entry";
import DatastoreTree from "../../components/datastore-tree";
import DialogEditFolder from "../../components/dialogs/edit-folder";
import DialogEditEntry from "../../components/dialogs/edit-entry";
import fileTransferService from "../../services/file-transfer";
import secretService from "../../services/secret";
import DialogCreateLinkShare from "../../components/dialogs/create-link-share";
import DialogTrashBin from "../../components/dialogs/trash-bin";
import DialogRightsOverview from "../../components/dialogs/rights-overview";
import DialogError from "../../components/dialogs/error";
import datastorePasswordService from "../../services/datastore-password";
import datastoreService from "../../services/datastore";
import offlineCacheService from "../../services/offline-cache";
import DialogUnlockOfflineCache from "../../components/dialogs/unlock-offline-cache";
import DialogSelectFolder from "../../components/dialogs/select-folder";
import AlertSecurityReport from "../../components/alert/security-report";
import DialogProgress from "../../components/dialogs/progress";
import widgetService from "../../services/widget";
import Search from "../../components/search";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        padding: "15px",
    },
    loader: {
        textAlign: "center",
        marginTop: "30px",
        marginBottom: "30px",
        margin: "auto",
    },
    securityReportAlert: {
        marginBottom: theme.spacing(1),
    },
    toolbarRoot: {
        display: "flex",
    },
    toolbarTitle: {
        display: "none",
        [theme.breakpoints.up("sm")]: {
            display: "block",
        },
    },
    search: {
        borderRadius: theme.shape.borderRadius,
        backgroundColor: alpha(theme.palette.common.white, 0.25),
        "&:hover": {
            backgroundColor: alpha(theme.palette.common.white, 0.45),
        },
        marginLeft: "auto",
        position: "absolute",
        right: 0,
        [theme.breakpoints.up("sm")]: {
            marginRight: theme.spacing(1),
        },
    },
    inputRoot: {
        color: "inherit",
    },
    inputInput: {
        padding: theme.spacing(1, 1, 1, 0),
        fontSize: "0.875em",
        // vertical padding + font size from searchIcon
        paddingLeft: "1em",
        transition: theme.transitions.create("width"),
        width: "100%",
        [theme.breakpoints.up("sm")]: {
            width: "10ch",
            "&:focus": {
                width: "20ch",
            },
        },
    },
    iconButton: {
        padding: 10,
        display: "inline-flex",
    },
    divider: {
        height: 28,
        margin: 0,
        marginBottom: -10,
        display: "inline-flex",
    },
    topMessage: {
        marginBottom: 20,
    },
    icon: {
        fontSize: "18px",
    },
    listItemIcon: {
        minWidth: theme.spacing(4),
    },
}));

function useWidth() {
    const theme = useTheme();
    const keys = [...theme.breakpoints.keys].reverse();
    return (
        keys.reduce((output, key) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const matches = useMediaQuery(theme.breakpoints.up(key));
            return !output && matches ? key : output;
        }, null) || 'xs'
    );
}


const DatastoreView = (props) => {
    const width = useWidth();
    let { defaultSearch, secretType, secretId } = useParams();
    const [shareMoveProgress, setShareMoveProgress] = React.useState(0);
    const serverStatus = useSelector((state) => state.server.status);
    const offlineMode = useSelector((state) => state.client.offlineMode);
    const passwordDatastore = useSelector((state) => state.user.userDatastoreOverview?.datastores?.find(datastore => datastore.type === 'password' && datastore.is_default));
    const recurrenceInterval = useSelector((state) => state.server.complianceCentralSecurityReportsRecurrenceInterval);
    const disableCentralSecurityReports = useSelector((state) => state.server.disableCentralSecurityReports);
    const classes = useStyles();
    const { t } = useTranslation();
    const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
    const [search, setSearch] = useState(defaultSearch || "");
    const [error, setError] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [contextMenuPosition, setContextMenuPosition] = useState({
        mouseX: null,
        mouseY: null,
    });

    const [trashBinOpen, setTrashBinOpen] = useState(false);
    const [unlockOfflineCache, setUnlockOfflineCache] = useState(false);

    const [newFolderOpen, setNewFolderOpen] = useState(false);
    const [newFolderData, setNewFolderData] = useState({});

    const [newEntryOpen, setNewEntryOpen] = useState(false);
    const [newEntryData, setNewEntryData] = useState({});

    const [editFolderOpen, setEditFolderOpen] = useState(false);
    const [editFolderData, setEditFolderData] = useState({});

    const [editEntryOpen, setEditEntryOpen] = useState(false);
    const [editEntryData, setEditEntryData] = useState({});

    const [rightsOverviewOpen, setRightsOverviewOpen] = useState(false);
    const [rightsOverviewData, setRightsOverviewData] = useState({});

    const [moveEntryData, setMoveEntryData] = useState(null);
    const [moveFolderData, setMoveFolderData] = useState(null);

    const [createLinkShareOpen, setCreateLinkShareOpen] = useState(false);
    const [createLinkShareData, setCreateLinkShareData] = useState({});

    const [datastore, setDatastore] = useState(null);

    const bigScreen = ["lg", "md", "xl"].includes(width);

    let isSubscribed = true;
    React.useEffect(() => {
        return () => (isSubscribed = false);
    }, []);
    React.useEffect(() => {
        loadDatastore();
    }, [passwordDatastore]);

    const shareMoveProgressDialogOpen = shareMoveProgress !== 0 && shareMoveProgress !== 100;
    let openShareMoveRequests = 0;
    let closedShareMoveRequests = 0;

    const onOpenShareMoveRequest = () => {
        openShareMoveRequests = openShareMoveRequests + 1;
        setShareMoveProgress(Math.round((closedShareMoveRequests / openShareMoveRequests) * 1000) / 10);
    }
    const onCloseShareMoveRequest = () => {
        closedShareMoveRequests = closedShareMoveRequests + 1;
        setShareMoveProgress(Math.round((closedShareMoveRequests / openShareMoveRequests) * 1000) / 10);
    }

    const loadDatastore = () => {
        if (offlineCacheService.isActive() && offlineCacheService.isLocked()) {
            setUnlockOfflineCache(true);
        } else {
            datastorePasswordService.getPasswordDatastore().then(onNewDatastoreLoaded);
        }
    };

    const onUnlockOfflineCacheClosed = () => {
        setUnlockOfflineCache(false);
        datastorePasswordService.getPasswordDatastore().then(onNewDatastoreLoaded);
    };

    const onNewDatastoreLoaded = (data) => {
        if (!isSubscribed) {
            return;
        }
        setDatastore(data);

        if (typeof secretType === "undefined") {
            return;
        }
        const paths = datastorePasswordService.searchInDatastore(secretId, data, function (secretId, item) {
            return item.hasOwnProperty("secret_id") && item.secret_id === secretId;
        });
        if (paths.length === 0) {
            return;
        }
        const search = datastoreService.findInDatastore(paths[0], data);
        const node = search[0][search[1]];

        onEditEntry(node, paths[0]);
    };

    let newSecurityReport = "NOT_REQUIRED";
    if (recurrenceInterval > 0 && !disableCentralSecurityReports) {
        if (
            serverStatus.hasOwnProperty("data") &&
            serverStatus.data.hasOwnProperty("last_security_report_created") &&
            serverStatus.data.last_security_report_created !== null
        ) {
            const lastSecurityReportAgeSeconds = differenceInSeconds(
                new Date(),
                new Date(serverStatus.data.last_security_report_created)
            );

            if (lastSecurityReportAgeSeconds > recurrenceInterval) {
                newSecurityReport = "REQUIRED";
            } else {
                const days_28 = 28 * 24 * 3600;
                const days_14 = 14 * 24 * 3600;
                if (recurrenceInterval >= days_28 && lastSecurityReportAgeSeconds > recurrenceInterval - days_14) {
                    newSecurityReport = "SOON_REQUIRED";
                } else {
                    newSecurityReport = "NOT_REQUIRED";
                }
            }
        } else {
            newSecurityReport = "REQUIRED";
        }
    }

    const onShare = (node, path) => {
        setRightsOverviewData({
            item: node,
            path: path,
        });
        setRightsOverviewOpen(true);
        // called whenever someone clicks on a new folder Icon
        // setNewShareOpen(true);
        // setNewShareData({
        //     node: node,
        //     path: path,
        // });
    };

    const onNewFolderCreate = (name) => {
        // called once someone clicked the CREATE button in the dialog closes with the new name
        widget.newFolderSave(newFolderData["parent"], newFolderData["path"], datastore, datastorePasswordService, name);
        setNewFolderOpen(false);
    };
    const onNewFolder = (parent, path) => {
        onContextMenuClose();
        setAnchorEl(null);
        // called whenever someone clicks on a new folder Icon
        setNewFolderOpen(true);
        setNewFolderData({
            parent: parent,
            path: path,
        });
    };

    const onNewEntryCreate = (item) => {
        // called once someone clicked the CREATE button in the dialog closes with the new name
        widget.newItemSave(item, datastore, newEntryData["parent"], newEntryData["path"], datastorePasswordService);
        setNewEntryOpen(false);
    };
    const onNewEntry = (parent, path) => {
        onContextMenuClose();
        setAnchorEl(null);
        // called whenever someone clicks on a new entry Icon
        setNewEntryOpen(true);

        let parentShareId = parent.parent_share_id;
        let parentDatastoreId = parent.parent_datastore_id;

        if (parent.hasOwnProperty("datastore_id")) {
            parentShareId = undefined;
            parentDatastoreId = parent.datastore_id;
        } else if (parent.hasOwnProperty("share_id")) {
            parentShareId = parent.share_id;
            parentDatastoreId = undefined;
        }
        setNewEntryData({
            parent: parent,
            path: path,
            parentShareId: parentShareId,
            parentDatastoreId: parentDatastoreId,
        });
    };

    const onEditFolderSave = (node) => {
        setEditFolderOpen(false);
        widget.editFolderSave(node, editFolderData.path, datastore, datastorePasswordService);
    };
    const onEditFolder = (node, path) => {
        setEditFolderData({
            node: node,
            path: path,
        });
        setEditFolderOpen(true);
    };

    const onEditEntrySave = (node) => {
        setEditEntryOpen(false);
        widget.editItemSave(datastore, node, editEntryData.path, datastorePasswordService);
    };

    const onEditEntry = (item, path) => {
        setEditEntryData({
            item: item,
            path: path,
        });
        setEditEntryOpen(true);
    };

    const onCloneEntry = (item, path) => {
        widget.cloneItem(datastore, item, path).then(() => {
            loadDatastore();
        });
    };

    const onDeleteEntry = (item, path) => {
        widget.markItemAsDeleted(datastore, path, "password").then(() => {
            forceUpdate();
        });
    };

    const onDeleteFolder = (item, path) => {
        widget.markItemAsDeleted(datastore, path, "password").then(() => {
            forceUpdate();
        });
    };

    const onDeleteItemFromEditModal = () => {
        widget.markItemAsDeleted(datastore, editEntryData.path, "password").then(() => {
            forceUpdate();
        });
    };

    const onLinkItem = (item, path) => {
        if (item.type === "file") {
            return fileTransferService.onItemClick(item);
        } else {
            return secretService.onItemClick(item);
        }
    };

    const onMoveFolder = (item, path) => {
        setMoveFolderData({
            item: item,
            path: path,
        });
    };

    const onSelectNodeForMoveFolder = async (breadcrumbs) => {
        await widgetService.moveItem(
            datastore,
            moveFolderData.path,
            breadcrumbs["id_breadcrumbs"],
            "folders",
            "password",
            onOpenShareMoveRequest,
            onCloseShareMoveRequest
        );
        setMoveFolderData(null);
        loadDatastore();
    };

    const isSelectableForMoveFolder = (node) => {
        // filter out targets that the folder itself or are inside of that folder
        if (node.path.includes(moveFolderData.item.id)) {
            return false;
        }
        // filter out all targets that are a share if the item is not allowed to be shared
        if (!moveFolderData.item.share_rights.grant && node.share_id) {
            return false;
        }
        // filter out all targets that are inside of a share if the item is not allowed to be shared
        if (!moveFolderData.item.share_rights.grant && node.parent_share_id) {
            return false;
        }
        //
        if (!node.hasOwnProperty("share_rights")) {
            return true;
        }
        // we need both read and write permission on the target folder in order to update it with the new content
        if (!!(node.share_rights.read && node.share_rights.write)) {
            return true;
        }
        return false;
    };

    const onMoveEntry = (item, path) => {
        setMoveEntryData({
            item: item,
            path: path,
        });
    };

    const onSelectNodeForMoveEntry = async (breadcrumbs) => {
        await widgetService.moveItem(datastore, moveEntryData.path, breadcrumbs["id_breadcrumbs"], "items", "password");
        setMoveEntryData(null);
        loadDatastore();
    };

    const isSelectableForMoveEntry = (node) => {
        // filter out all targets that are a share if the item is not allowed to be shared
        // yet don't filter out entries that are just moved within a share
        if (!moveEntryData.item.share_rights.grant && node.share_id && (!moveEntryData.item.parent_share_id || moveEntryData.item.parent_share_id !== node.share_id)) {
            return false;
        }
        // filter out all targets that are inside of a share if the item is not allowed to be shared
        // yet don't filter out entries that are just moved within a share
        if (!moveEntryData.item.share_rights.grant && node.parent_share_id && (!moveEntryData.item.parent_share_id || moveEntryData.item.parent_share_id !== node.parent_share_id)) {
            return false;
        }
        //
        if (!node.hasOwnProperty("share_rights")) {
            return true;
        }
        // we need both read and write permission on the target folder in order to update it with the new content
        if (!!(node.share_rights.read && node.share_rights.write)) {
            return true;
        }
        return false;
    };

    const onLinkShare = (item, path) => {
        setCreateLinkShareData({
            item: item,
        });
        setCreateLinkShareOpen(true);
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

    const openTrashBin = (event) => {
        setTrashBinOpen(true);
    };
    const onContextMenu = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setContextMenuPosition({
            mouseX: event.clientX - 2,
            mouseY: event.clientY - 4,
        });
    };

    const onContextMenuClose = () => {
        setContextMenuPosition({
            mouseX: null,
            mouseY: null,
        });
    };
    return (
        <Base {...props}>
            <BaseTitle>{t("DATASTORE")}</BaseTitle>
            <BaseContent>
                <Grid container spacing={1}>
                    <Grid item xs={bigScreen && editEntryOpen ? 6 : 12}>
                        <Paper square>
                            <AppBar elevation={0} position="static" color="default">
                                <Toolbar
                                    className={classes.toolbarRoot}>
                                    <span className={classes.toolbarTitle}>{t("DATASTORE")}</span>
                                    {newSecurityReport !== 'REQUIRED' && (<div className={classes.search}>
                                        <Search
                                            value={search}
                                            onChange={(newValue) => {
                                                setSearch(newValue)
                                            }}
                                        />
                                        <Divider className={classes.divider} orientation="vertical"/>
                                        {!offlineMode && (
                                            <IconButton
                                                color="primary"
                                                className={classes.iconButton}
                                                aria-label="menu"
                                                onClick={openMenu}
                                                size="large">
                                                <MenuOpenIcon/>
                                            </IconButton>
                                        )}
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
                                            <MenuItem onClick={() => onNewFolder(datastore, [])}>
                                                <ListItemIcon className={classes.listItemIcon}>
                                                    <CreateNewFolderIcon className={classes.icon} fontSize="small"/>
                                                </ListItemIcon>
                                                <Typography variant="body2" noWrap>
                                                    {t("NEW_FOLDER")}
                                                </Typography>
                                            </MenuItem>
                                            <MenuItem onClick={() => onNewEntry(datastore, [])}>
                                                <ListItemIcon className={classes.listItemIcon}>
                                                    <AddIcon className={classes.icon} fontSize="small"/>
                                                </ListItemIcon>
                                                <Typography variant="body2" noWrap>
                                                    {t("NEW_ENTRY")}
                                                </Typography>
                                            </MenuItem>
                                        </Menu>
                                        {!offlineMode && (
                                            <>

                                                <Divider className={classes.divider} orientation="vertical"/>
                                                <IconButton
                                                    className={classes.iconButton}
                                                    aria-label="trash bin"
                                                    onClick={openTrashBin}
                                                    size="large">
                                                    <DeleteSweepIcon/>
                                                </IconButton>
                                            </>
                                        )}
                                    </div>)}
                                </Toolbar>
                            </AppBar>
                            <div className={classes.root} onContextMenu={newSecurityReport === 'REQUIRED' ? null : onContextMenu}>
                                <Grid container>
                                    <Grid item xs={12} sm={12} md={12}>
                                        <AlertSecurityReport className={classes.securityReportAlert} />
                                    </Grid>
                                    <Grid item xs={12} sm={12} md={12}>
                                        {!datastore && newSecurityReport !== 'REQUIRED' && (
                                            <div className={classes.loader}>
                                                <ClipLoader />
                                            </div>
                                        )}
                                        {datastore && newSecurityReport !== 'REQUIRED' && (
                                            <DatastoreTree
                                                datastore={datastore}
                                                setDatastore={setDatastore}
                                                search={search}
                                                onNewFolder={onNewFolder}
                                                onNewEntry={onNewEntry}
                                                onShare={onShare}
                                                onEditEntry={onEditEntry}
                                                onCloneEntry={onCloneEntry}
                                                onDeleteEntry={onDeleteEntry}
                                                onEditFolder={onEditFolder}
                                                onDeleteFolder={onDeleteFolder}
                                                onSelectItem={onEditEntry}
                                                onLinkItem={onLinkItem}
                                                onLinkShare={onLinkShare}
                                                onMoveFolder={onMoveFolder}
                                                onMoveEntry={onMoveEntry}
                                                deleteFolderLabel={t('MOVE_TO_TRASH')}
                                                deleteItemLabel={t('MOVE_TO_TRASH')}
                                            />
                                        )}
                                    </Grid>
                                </Grid>
                            </div>
                            <Menu
                                keepMounted
                                open={contextMenuPosition.mouseY !== null}
                                onClose={onContextMenuClose}
                                anchorReference="anchorPosition"
                                anchorPosition={
                                    contextMenuPosition.mouseY !== null && contextMenuPosition.mouseX !== null
                                        ? { top: contextMenuPosition.mouseY, left: contextMenuPosition.mouseX }
                                        : undefined
                                }
                                onContextMenu={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                }}
                            >
                                <MenuItem onClick={() => onNewFolder(datastore, [])}>
                                    <ListItemIcon className={classes.listItemIcon}>
                                        <CreateNewFolderIcon className={classes.icon} fontSize="small" />
                                    </ListItemIcon>
                                    <Typography variant="body2" noWrap>
                                        {t("NEW_FOLDER")}
                                    </Typography>
                                </MenuItem>
                                <MenuItem onClick={() => onNewEntry(datastore, [])}>
                                    <ListItemIcon className={classes.listItemIcon}>
                                        <AddIcon className={classes.icon} fontSize="small" />
                                    </ListItemIcon>
                                    <Typography variant="body2" noWrap>
                                        {t("NEW_ENTRY")}
                                    </Typography>
                                </MenuItem>
                            </Menu>
                            {newFolderOpen && (
                                <DialogNewFolder
                                    open={newFolderOpen}
                                    onClose={() => setNewFolderOpen(false)}
                                    onCreate={onNewFolderCreate}
                                />
                            )}
                            {newEntryOpen && (
                                <DialogNewEntry
                                    open={newEntryOpen}
                                    onClose={() => setNewEntryOpen(false)}
                                    onCreate={onNewEntryCreate}
                                    parentDatastoreId={newEntryData.parentDatastoreId}
                                    parentShareId={newEntryData.parentShareId}
                                />
                            )}
                            {editFolderOpen && (
                                <DialogEditFolder
                                    open={editFolderOpen}
                                    onClose={() => setEditFolderOpen(false)}
                                    onSave={onEditFolderSave}
                                    node={editFolderData.node}
                                />
                            )}
                            {editEntryOpen && !bigScreen && (
                                <DialogEditEntry
                                    open={editEntryOpen}
                                    onClose={() => setEditEntryOpen(false)}
                                    onEdit={onEditEntrySave}
                                    item={editEntryData.item}
                                    onDeleteItem={onDeleteItemFromEditModal}
                                />
                            )}
                            {createLinkShareOpen && (
                                <DialogCreateLinkShare
                                    open={createLinkShareOpen}
                                    onClose={() => setCreateLinkShareOpen(false)}
                                    item={createLinkShareData.item}
                                />
                            )}
                            {trashBinOpen && (
                                <DialogTrashBin
                                    open={trashBinOpen}
                                    onClose={() => setTrashBinOpen(false)}
                                    datastore={datastore}
                                />
                            )}
                            {rightsOverviewOpen && (
                                <DialogRightsOverview
                                    open={rightsOverviewOpen}
                                    onClose={() => setRightsOverviewOpen(false)}
                                    item={rightsOverviewData.item}
                                    path={rightsOverviewData.path}
                                />
                            )}
                            {Boolean(moveEntryData) && (
                                <DialogSelectFolder
                                    open={Boolean(moveEntryData)}
                                    onClose={() => setMoveEntryData(null)}
                                    title={t("MOVE_ENTRY")}
                                    onSelectNode={onSelectNodeForMoveEntry}
                                    isSelectable={isSelectableForMoveEntry}
                                />
                            )}
                            {Boolean(moveFolderData) && (
                                <DialogSelectFolder
                                    open={Boolean(moveFolderData)}
                                    onClose={() => setMoveFolderData(null)}
                                    title={t("MOVE_FOLDER")}
                                    onSelectNode={onSelectNodeForMoveFolder}
                                    isSelectable={isSelectableForMoveFolder}
                                />
                            )}
                            {unlockOfflineCache && (
                                <DialogUnlockOfflineCache
                                    open={unlockOfflineCache}
                                    onClose={onUnlockOfflineCacheClosed}
                                />
                            )}
                            {error !== null && (
                                <DialogError
                                    open={error !== null}
                                    onClose={() => setError(null)}
                                    title={error.title}
                                    description={error.description}
                                />
                            )}
                        </Paper>
                    </Grid>
                    {bigScreen && editEntryOpen && (
                        <Grid item xs={6}>
                            {editEntryOpen && (
                                <DialogEditEntry
                                    open={editEntryOpen}
                                    onClose={() => setEditEntryOpen(false)}
                                    onEdit={onEditEntrySave}
                                    item={editEntryData.item}
                                    onDeleteItem={onDeleteItemFromEditModal}
                                    inline={true}
                                />
                            )}
                        </Grid>
                    )}
                </Grid>

                {shareMoveProgressDialogOpen && (
                    <DialogProgress percentageComplete={shareMoveProgress} open={shareMoveProgressDialogOpen}/>
                )}

            </BaseContent>
        </Base>
    );
};

export default DatastoreView;
