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
    const [isExpanded, setIsExpanded] = useState(isExpandedDefault);
    const [contextMenuPosition, setContextMenuPosition] = useState({
        mouseX: null,
        mouseY: null,
    });
    const [anchorEl, setAnchorEl] = useState(null);
    const isSelectable = props.isSelectable ? props.isSelectable(content) : true;

    React.useEffect(() => {
        setIsExpanded(isExpandedDefault);
    }, [isExpandedDefault]);

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

    const onRightsOverview = (event) => {
        handleClose(event);
        props.onRightsOverview(content, content.path, props.nodePath);
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

    const onNewShare = (event) => {
        handleClose(event);
        props.onNewShare(content, content.path);
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
        setIsExpanded(!isExpanded);
        if (props.onSelectNode && isSelectable) {
            props.onSelectNode(content, content.path, nodePath);
        }
    };
    const hideShare = offline || (content.hasOwnProperty("share_rights") && content.share_rights.grant === false) || !props.onNewShare;
    const hideRightsOverview =
        offline ||
        //(content.hasOwnProperty("share_rights") && content.share_rights.grant === false) ||
        !content.hasOwnProperty("share_id") ||
        typeof content.share_id === "undefined" ||
        !props.onRightsOverview;
    const hideEdit = offline || (content.hasOwnProperty("share_rights") && content.share_rights.write === false) || !props.onEditFolder;
    const hideNewFolder = offline || (content.hasOwnProperty("share_rights") && content.share_rights.write === false) || !props.onNewFolder;
    const hideNewEntry = offline || (content.hasOwnProperty("share_rights") && content.share_rights.write === false) || !props.onNewEntry;
    const hideNewUser = offline || (content.hasOwnProperty("share_rights") && content.share_rights.write === false) || !props.onNewUser;
    const hideMove = offline || (content.hasOwnProperty("share_rights") && content.share_rights.delete === false) || !props.onMoveFolder;
    const hideDelete = offline || (content.hasOwnProperty("share_rights") && content.share_rights.delete === false) || !props.onDeleteFolder;
    const disableMenu = hideShare && hideRightsOverview && hideEdit && hideNewFolder && hideNewEntry && hideNewUser && hideMove && hideDelete;

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
        <div className={"tree-folder"}>
            <div className={"tree-folder-title"}>
                <div className={"tree-folder-header" + (isSelectable ? "" : " notSelectable")} onClick={selectNode} onContextMenu={onContextMenu}>
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
                    <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
                        {!hideShare && onNewShare && (
                            <MenuItem onClick={onNewShare}>
                                <ListItemIcon className={classes.listItemIcon}>
                                    <ShareIcon className={classes.icon} fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" noWrap>
                                    {t("SHARE")}
                                </Typography>
                            </MenuItem>
                        )}
                        {!hideRightsOverview && (
                            <MenuItem onClick={onRightsOverview}>
                                <ListItemIcon className={classes.listItemIcon}>
                                    <ListIcon className={classes.icon} fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" noWrap>
                                    {t("RIGHTS_OVERVIEW")}
                                </Typography>
                            </MenuItem>
                        )}
                        {(!hideShare || !hideRightsOverview) && <Divider className={classes.divider} />}
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
                                    {t("NEW_USER")}
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
                                    {t("DELETE")}
                                </Typography>
                            </MenuItem>
                        )}
                    </Menu>
                </div>
            </div>
            {isExpanded && (
                <div className={"tree-folder-content"}>
                    {content.folders &&
                        content.folders
                            .filter((folder) => !folder["hidden"] && !folder["deleted"])
                            .map(function (content, i) {
                                const nodePathClone = Array.from(nodePath);
                                nodePathClone.push(content);
                                return (
                                    <DatastoreTreeFolder
                                        isSelectable={props.isSelectable}
                                        onSelectItem={props.onSelectItem}
                                        onSelectNode={props.onSelectNode}
                                        onEditFolder={props.onEditFolder}
                                        onEditEntry={props.onEditEntry}
                                        onCloneEntry={props.onCloneEntry}
                                        onDeleteEntry={props.onDeleteEntry}
                                        onMoveEntry={props.onMoveEntry}
                                        onDeleteFolder={props.onDeleteFolder}
                                        onMoveFolder={props.onMoveFolder}
                                        onLinkItem={props.onLinkItem}
                                        onNewFolder={props.onNewFolder}
                                        onNewUser={props.onNewUser}
                                        onNewEntry={props.onNewEntry}
                                        onNewShare={props.onNewShare}
                                        onLinkShare={props.onLinkShare}
                                        onRightsOverview={props.onRightsOverview}
                                        key={i}
                                        nodePath={nodePathClone}
                                        content={content}
                                        offline={offline}
                                        isExpandedDefault={Boolean(content["is_expanded"])}
                                    />
                                );
                            })}
                    {!props.hideItems &&
                        content.items &&
                        content.items
                            .filter((item) => !item["hidden"] && !item["deleted"])
                            .map(function (content, i) {
                                const nodePathClone = Array.from(nodePath);
                                nodePathClone.push(content);
                                return (
                                    <DatastoreTreeItem
                                        isSelectable={props.isSelectable}
                                        onSelectItem={props.onSelectItem}
                                        onEditEntry={props.onEditEntry}
                                        onCloneEntry={props.onCloneEntry}
                                        onDeleteEntry={props.onDeleteEntry}
                                        onMoveEntry={props.onMoveEntry}
                                        onLinkItem={props.onLinkItem}
                                        onNewShare={props.onNewShare}
                                        onLinkShare={props.onLinkShare}
                                        onRightsOverview={props.onRightsOverview}
                                        key={i}
                                        nodePath={nodePathClone}
                                        content={content}
                                        offline={offline}
                                    />
                                );
                            })}
                </div>
            )}
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
            >
                {!hideShare && onNewShare && (
                    <MenuItem onClick={onNewShare}>
                        <ListItemIcon className={classes.listItemIcon}>
                            <ShareIcon className={classes.icon} fontSize="small" />
                        </ListItemIcon>
                        <Typography variant="body2" noWrap>
                            {t("SHARE")}
                        </Typography>
                    </MenuItem>
                )}
                {!hideRightsOverview && (
                    <MenuItem onClick={onRightsOverview}>
                        <ListItemIcon className={classes.listItemIcon}>
                            <ListIcon className={classes.icon} fontSize="small" />
                        </ListItemIcon>
                        <Typography variant="body2" noWrap>
                            {t("RIGHTS_OVERVIEW")}
                        </Typography>
                    </MenuItem>
                )}
                {(!hideShare || !hideRightsOverview) && <Divider className={classes.divider} />}
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
                            {t("NEW_USER")}
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
                            {t("DELETE")}
                        </Typography>
                    </MenuItem>
                )}
            </Menu>
        </div>
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
    onNewShare: PropTypes.func,
    onLinkShare: PropTypes.func,
    onRightsOverview: PropTypes.func,
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
};

export default DatastoreTreeFolder;
