import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import SettingsIcon from "@material-ui/icons/Settings";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListIcon from "@material-ui/icons/List";
import ShareIcon from "@material-ui/icons/Share";
import Typography from "@material-ui/core/Typography";
import EditIcon from "@material-ui/icons/Edit";
import CreateNewFolderIcon from "@material-ui/icons/CreateNewFolder";
import AddIcon from "@material-ui/icons/Add";
import PersonAddIcon from "@material-ui/icons/PersonAdd";
import OpenWithIcon from "@material-ui/icons/OpenWith";
import DeleteIcon from "@material-ui/icons/Delete";
import Divider from "@material-ui/core/Divider";
import { makeStyles } from "@material-ui/core/styles";

import DatastoreTreeItem from "./datastore-tree-item";
import { getStore } from "../../services/store";

const useStyles = makeStyles((theme) => ({
    divider: {
        marginTop: "8px",
        marginBottom: "8px",
    },
    icon: {
        fontSize: "18px",
    },
    listItemIcon: {
        minWidth: theme.spacing(4),
    },
}));

const DatastoreTreeFolder = (props) => {
    const { t } = useTranslation();
    const { content, offline, isExpandedDefault, nodePath } = props;
    const classes = useStyles();
    const isExpanded = isExpandedDefault;
    const [contextMenuPosition, setContextMenuPosition] = useState({
        mouseX: null,
        mouseY: null,
    });
    const [anchorEl, setAnchorEl] = useState(null);
    const isSelectable = props.isSelectable ? props.isSelectable(content) : true;

    const openMenu = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setAnchorEl(null);
        onContextMenuClose();
    };

    const onEdit = (event) => {
        handleClose(event);
        props.onEditFolder(content, content.path);
    };

    const onNewFolder = (event) => {
        handleClose(event);
        if (props.onNewFolder) {
            props.onNewFolder(content, content.path);
        }
    };

    const onShare = (event) => {
        handleClose(event);
        props.onShare(content, content.path, props.nodePath);
    };

    const onNewEntry = (event) => {
        handleClose(event);
        props.onNewEntry(content, content.path);
    };

    const onNewUser = (event) => {
        handleClose(event);
        props.onNewUser(content, content.path);
    };

    const onMoveFolder = (event) => {
        handleClose(event);
        props.onMoveFolder(content, content.path);
    };

    const onDelete = (event) => {
        handleClose(event);
        props.onDeleteFolder(content, content.path);
    };

    const selectNode = (event) => {
        event.stopPropagation();
        props.onUpdateExpandFolderProperty(content.id);
        if (props.onSelectNode && isSelectable) {
            props.onSelectNode(content, content.path, nodePath);
        }
    };
    const hideNewShare =
        (getStore().getState().server.complianceDisableShares && !content.hasOwnProperty("share_id")) ||
        offline ||
        (content.hasOwnProperty("share_rights") && content.share_rights.grant === false) ||
        !props.onShare;
    const hideRightsOverview =
        offline ||
        //(content.hasOwnProperty("share_rights") && content.share_rights.grant === false) ||
        !content.hasOwnProperty("share_id") ||
        typeof content.share_id === "undefined"
    const hideShare = hideNewShare && hideRightsOverview;
    const hideEdit =
        offline ||
        (content.hasOwnProperty("share_rights") && content.share_rights.write === false) ||
        (content.hasOwnProperty("share_rights") && content.share_rights.read === false) ||
        !props.onEditFolder;
    const hideNewFolder =
        offline ||
        (content.hasOwnProperty("share_rights") && content.share_rights.write === false) ||
        (content.hasOwnProperty("share_rights") && content.share_rights.read === false) ||
        !props.onNewFolder;
    const hideNewEntry =
        offline ||
        (content.hasOwnProperty("share_rights") && content.share_rights.write === false) ||
        (content.hasOwnProperty("share_rights") && content.share_rights.read === false) ||
        !props.onNewEntry;
    const hideNewUser =
        offline || (content.hasOwnProperty("share_rights") && content.share_rights.write === false) || !props.onNewUser;
    const hideMove =
        offline ||
        (content.hasOwnProperty("share_rights") && content.share_rights.delete === false) ||
        !props.onMoveFolder;
    const hideDelete =
        offline ||
        (content.hasOwnProperty("share_rights") && content.share_rights.delete === false) ||
        !props.onDeleteFolder;
    const disableMenu =
        hideShare &&
        hideEdit &&
        hideNewFolder &&
        hideNewEntry &&
        hideNewUser &&
        hideMove &&
        hideDelete;

    const onContextMenu = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (disableMenu) {
            return;
        }
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
        <>
            <div className={"tree-folder"}>
                <div className={"tree-folder-title"}>
                    <div
                        className={"tree-folder-header" + (isSelectable ? "" : " notSelectable")}
                        onClick={selectNode}
                        onContextMenu={onContextMenu}
                    >
                        <span className="fa-stack">
                            {isExpanded && <i className="fa fa-folder-open" />}
                            {!isExpanded && <i className="fa fa-folder" />}
                            {content.share_id && <i className="fa fa-circle fa-stack-2x text-danger is-shared" />}
                            {content.share_id && <i className="fa fa-group fa-stack-2x is-shared" />}
                        </span>
                        <span className="tree-folder-name ng-binding">{content.name}</span>
                        <ButtonGroup variant="text" aria-label="text button group" className={"node-open-link"}>
                            <Button aria-label="settings" onClick={openMenu} disabled={disableMenu}>
                                <SettingsIcon fontSize="small" />
                            </Button>
                        </ButtonGroup>
                        <Menu
                            id="simple-menu"
                            anchorEl={anchorEl}
                            keepMounted={false}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                            onContextMenu={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                            }}
                        >
                            {!hideShare && onShare && (
                                <MenuItem onClick={onShare}>
                                    <ListItemIcon className={classes.listItemIcon}>
                                        <ShareIcon className={classes.icon} fontSize="small" />
                                    </ListItemIcon>
                                    <Typography variant="body2" noWrap>
                                        {t("SHARE")}
                                    </Typography>
                                </MenuItem>
                            )}
                            {!hideShare && <Divider className={classes.divider} />}
                            {!hideEdit && (
                                <MenuItem onClick={onEdit}>
                                    <ListItemIcon className={classes.listItemIcon}>
                                        <EditIcon className={classes.icon} fontSize="small" />
                                    </ListItemIcon>
                                    <Typography variant="body2" noWrap>
                                        {t("EDIT")}
                                    </Typography>
                                </MenuItem>
                            )}
                            {!hideNewFolder && (
                                <MenuItem onClick={onNewFolder}>
                                    <ListItemIcon className={classes.listItemIcon}>
                                        <CreateNewFolderIcon className={classes.icon} fontSize="small" />
                                    </ListItemIcon>
                                    <Typography variant="body2" noWrap>
                                        {t("NEW_FOLDER")}
                                    </Typography>
                                </MenuItem>
                            )}
                            {!hideNewEntry && (
                                <MenuItem onClick={onNewEntry}>
                                    <ListItemIcon className={classes.listItemIcon}>
                                        <AddIcon className={classes.icon} fontSize="small" />
                                    </ListItemIcon>
                                    <Typography variant="body2" noWrap>
                                        {t("NEW_ENTRY")}
                                    </Typography>
                                </MenuItem>
                            )}
                            {!hideNewUser && (
                                <MenuItem onClick={onNewUser}>
                                    <ListItemIcon className={classes.listItemIcon}>
                                        <PersonAddIcon className={classes.icon} fontSize="small" />
                                    </ListItemIcon>
                                    <Typography variant="body2" noWrap>
                                        {t("SEARCH_USER")}
                                    </Typography>
                                </MenuItem>
                            )}
                            {!hideMove && (
                                <MenuItem onClick={onMoveFolder}>
                                    <ListItemIcon className={classes.listItemIcon}>
                                        <OpenWithIcon className={classes.icon} fontSize="small" />
                                    </ListItemIcon>
                                    <Typography variant="body2" noWrap>
                                        {t("MOVE")}
                                    </Typography>
                                </MenuItem>
                            )}
                            {!hideDelete && <Divider className={classes.divider} />}
                            {!hideDelete && (
                                <MenuItem onClick={onDelete}>
                                    <ListItemIcon className={classes.listItemIcon}>
                                        <DeleteIcon className={classes.icon} fontSize="small" />
                                    </ListItemIcon>
                                    <Typography variant="body2" noWrap>
                                        {props.deleteFolderLabel}
                                    </Typography>
                                </MenuItem>
                            )}
                        </Menu>
                    </div>
                </div>
                <Menu
                    keepMounted={false}
                    open={contextMenuPosition.mouseY !== null}
                    onClose={onContextMenuClose}
                    onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                    }}
                    anchorReference="anchorPosition"
                    anchorPosition={
                        contextMenuPosition.mouseY !== null && contextMenuPosition.mouseX !== null
                            ? { top: contextMenuPosition.mouseY, left: contextMenuPosition.mouseX }
                            : undefined
                    }
                >
                    {!hideShare && onShare && (
                        <MenuItem onClick={onShare}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <ShareIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("SHARE")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideShare && <Divider className={classes.divider} />}
                    {!hideEdit && (
                        <MenuItem onClick={onEdit}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <EditIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("EDIT")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideNewFolder && (
                        <MenuItem onClick={onNewFolder}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <CreateNewFolderIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("NEW_FOLDER")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideNewEntry && (
                        <MenuItem onClick={onNewEntry}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <AddIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("NEW_ENTRY")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideNewUser && (
                        <MenuItem onClick={onNewUser}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <PersonAddIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("SEARCH_USER")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideMove && (
                        <MenuItem onClick={onMoveFolder}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <OpenWithIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("MOVE")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideDelete && <Divider className={classes.divider} />}
                    {!hideDelete && (
                        <MenuItem onClick={onDelete}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <DeleteIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {props.deleteFolderLabel}
                            </Typography>
                        </MenuItem>
                    )}
                </Menu>
            </div>
        </>
    );
};

DatastoreTreeFolder.propTypes = {
    isSelectable: PropTypes.func,
    hideItems: PropTypes.bool,
    isExpandedDefault: PropTypes.bool.isRequired,
    content: PropTypes.object,
    nodePath: PropTypes.array.isRequired,
    offline: PropTypes.bool.isRequired,
    onNewFolder: PropTypes.func,
    onShare: PropTypes.func,
    onLinkShare: PropTypes.func,
    onNewUser: PropTypes.func,
    onNewEntry: PropTypes.func,
    onEditEntry: PropTypes.func,
    onCloneEntry: PropTypes.func,
    onDeleteEntry: PropTypes.func,
    onMoveEntry: PropTypes.func,
    onDeleteFolder: PropTypes.func,
    onMoveFolder: PropTypes.func,
    onLinkItem: PropTypes.func,
    onEditFolder: PropTypes.func,
    onSelectNode: PropTypes.func,
    onSelectItem: PropTypes.func,
    isSelected: PropTypes.func,
    allowMultiselect: PropTypes.bool.isRequired,
    onUpdateExpandFolderProperty: PropTypes.func.isRequired,
    deleteFolderLabel: PropTypes.string,
    deleteItemLabel: PropTypes.string,
};

export default DatastoreTreeFolder;
