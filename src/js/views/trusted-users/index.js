import React, { useState, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { alpha } from "@mui/material/styles";
import { makeStyles } from '@mui/styles';
import Paper from "@mui/material/Paper";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ListItemIcon from "@mui/material/ListItemIcon";
import Typography from "@mui/material/Typography";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import { ClipLoader } from "react-spinners";
import Base from "../../components/base";
import BaseTitle from "../../components/base-title";
import BaseContent from "../../components/base-content";
import widget from "../../services/widget";
import datastorePassword from "../../services/datastore-password";
import DialogNewFolder from "../../components/dialogs/new-folder";
import DialogEditFolder from "../../components/dialogs/edit-folder";
import DialogNewUser from "../../components/dialogs/new-user";
import DialogEditUser from "../../components/dialogs/edit-user";
import datastoreUser from "../../services/datastore-user";
import DatastoreTree from "../../components/datastore-tree";
import datastoreUserService from "../../services/datastore-user";
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
            width: "12ch",
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
    icon: {
        fontSize: "18px",
    },
    listItemIcon: {
        minWidth: theme.spacing(4),
    },
}));

const TrustedUsersView = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [anchorEl, setAnchorEl] = useState(null);
    const [contextMenuPosition, setContextMenuPosition] = useState({
        mouseX: null,
        mouseY: null,
    });

    const [newFolderOpen, setNewFolderOpen] = useState(false);
    const [newFolderData, setNewFolderData] = useState({});

    const [newUserOpen, setNewUserOpen] = useState(false);
    const [newUserData, setNewUserData] = useState({});

    const [editFolderOpen, setEditFolderOpen] = useState(false);
    const [editFolderData, setEditFolderData] = useState({});

    const [editEntryOpen, setEditEntryOpen] = useState(false);
    const [editEntryData, setEditEntryData] = useState({});
    const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

    const [datastore, setDatastore] = useState(null);

    let isSubscribed = true;
    React.useEffect(() => {
        datastoreUser.getUserDatastore().then(onNewDatastoreLoaded);
        return () => (isSubscribed = false);
    }, []);

    const onNewDatastoreLoaded = (data) => {
        if (!isSubscribed) {
            return;
        }
        setDatastore(data);
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

    const onCreateFolder = (event) => {
        handleClose(event);
        onNewFolder(undefined, []);
    };

    const onNewFolderCreate = (name) => {
        // called once someone clicked the CREATE button in the dialog closes with the new name
        setNewFolderOpen(false);
        widget.newFolderSave(newFolderData["parent"], newFolderData["path"], datastore, datastorePassword, name);
    };
    const onNewFolder = (parent, path) => {
        onContextMenuClose();
        setAnchorEl(null);
        // called whenever someone clicks on a new folder Icon
        setNewFolderData({
            parent: parent,
            path: path,
        });
        setNewFolderOpen(true);
    };

    const onCreateUser = (event) => {
        handleClose(event);
        onNewUser(undefined, []);
    };

    const onNewUserCreate = (userObject) => {
        // called once someone clicked the CREATE button in the dialog closes with the infos about the user
        setNewUserOpen(false);

        let parent;
        if (newUserData["parent"]) {
            parent = newUserData["parent"];
        } else {
            parent = datastore;
        }

        datastoreUserService.addUserToDatastore(datastore, userObject, parent);
    };
    const onNewUser = (parent, path) => {
        onContextMenuClose();
        setAnchorEl(null);
        // called whenever someone clicks on a new folder Icon
        setNewUserData({
            parent: parent,
            path: path,
        });
        setNewUserOpen(true);
    };

    const onEditFolderSave = (node) => {
        setEditFolderOpen(false);
        widget.editFolderSave(node, editFolderData.path, datastore, datastoreUser);
    };
    const onEditFolder = (node, path) => {
        setEditFolderData({
            node: node,
            path: path,
        });
        setEditFolderOpen(true);
    };

    const onEditEntrySave = (item) => {
        setEditEntryOpen(false);
        datastoreUser.saveDatastoreContent(datastore);
    };
    const onEditEntry = (item, path) => {
        setEditEntryData({
            item: item,
            path: path,
        });
        setEditEntryOpen(true);
    };

    const onDeleteEntry = (item, path) => {
        widget.deleteItemPermanent(datastore, path, "user");
        forceUpdate();
    };

    const onDeleteFolder = (item, path) => {
        widget.deleteItemPermanent(datastore, path, "user");
        forceUpdate();
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
            <BaseTitle>{t("TRUSTED_USERS")}</BaseTitle>
            <BaseContent>
                <Paper square>
                    <AppBar elevation={0} position="static" color="default">
                        <Toolbar
                            className={classes.toolbarRoot}>
                            <span className={classes.toolbarTitle}>{t("TRUSTED_USERS")}</span>
                            <div className={classes.search}>
                                <Search
                                    value={search}
                                    onChange={(newValue) => {
                                        setSearch(newValue)
                                    }}
                                />
                                <Divider className={classes.divider} orientation="vertical" />
                                <IconButton
                                    color="primary"
                                    className={classes.iconButton}
                                    aria-label="menu"
                                    onClick={openMenu}
                                    size="large">
                                    <MenuOpenIcon />
                                </IconButton>
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
                                    <MenuItem onClick={onCreateFolder}>
                                        <ListItemIcon className={classes.listItemIcon}>
                                            <CreateNewFolderIcon className={classes.icon} fontSize="small" />
                                        </ListItemIcon>
                                        <Typography variant="body2" noWrap>
                                            {t("NEW_FOLDER")}
                                        </Typography>
                                    </MenuItem>
                                    <MenuItem onClick={onCreateUser}>
                                        <ListItemIcon className={classes.listItemIcon}>
                                            <PersonAddIcon className={classes.icon} fontSize="small" />
                                        </ListItemIcon>
                                        <Typography variant="body2" noWrap>
                                            {t("SEARCH_USER")}
                                        </Typography>
                                    </MenuItem>
                                </Menu>
                            </div>
                        </Toolbar>
                    </AppBar>
                    <div className={classes.root} onContextMenu={onContextMenu}>
                        {!datastore && (
                            <div className={classes.loader}>
                                <ClipLoader />
                            </div>
                        )}
                        {datastore && (
                            <DatastoreTree
                                datastore={datastore}
                                setDatastore={setDatastore}
                                search={search}
                                onNewFolder={onNewFolder}
                                onNewUser={onNewUser}
                                onEditEntry={onEditEntry}
                                onEditFolder={onEditFolder}
                                onDeleteEntry={onDeleteEntry}
                                onDeleteFolder={onDeleteFolder}
                                onSelectItem={onEditEntry}
                                deleteFolderLabel={t('DELETE')}
                                deleteItemLabel={t('DELETE')}
                            />
                        )}
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
                        <MenuItem onClick={onCreateFolder}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <CreateNewFolderIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("NEW_FOLDER")}
                            </Typography>
                        </MenuItem>
                        <MenuItem onClick={onCreateUser}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <PersonAddIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("SEARCH_USER")}
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
                    {newUserOpen && (
                        <DialogNewUser
                            open={newUserOpen}
                            onClose={() => setNewUserOpen(false)}
                            onCreate={onNewUserCreate}
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
                    {editEntryOpen && (
                        <DialogEditUser
                            open={editEntryOpen}
                            onClose={() => setEditEntryOpen(false)}
                            onSave={onEditEntrySave}
                            item={editEntryData.item}
                        />
                    )}
                </Paper>
            </BaseContent>
        </Base>
    );
};

export default TrustedUsersView;
