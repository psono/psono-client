import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import SettingsIcon from "@mui/icons-material/Settings";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ShareIcon from "@mui/icons-material/Share";
import Typography from "@mui/material/Typography";
import EditIcon from "@mui/icons-material/Edit";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import AddIcon from "@mui/icons-material/Add";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import OpenWithIcon from "@mui/icons-material/OpenWith";
import DeleteIcon from "@mui/icons-material/Delete";
import Divider from "@mui/material/Divider";
import { makeStyles } from '@mui/styles';

import { getStore } from "../../services/store";

const useStyles = makeStyles((theme) => ({
    treeFolder: {
        width: 'auto',
        minHeight: '20px',
        position: 'relative',
        '&::before': {
            content: '""',
            position: 'absolute',
            top: '20px',
            left: '-13px',
            width: '12px',
            height: 0,
            borderTop: `1px dotted ${theme.palette.blueBackground.main}`,
            zIndex: 1,
        },
    },
    treeFolderHeader: {
        position: 'relative',
        height: '34px',
        lineHeight: '34px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '5px 3px',
        paddingRight: '120px',
        '&.selected': {
            backgroundColor: '#F0F7FC',
            borderRadius: '4px',
            borderColor: theme.palette.lightBackground.main,
        },
        '&:hover, &:focus': {
            backgroundColor: '#F0F7FC',
            outline: 'none',
        },
        '&.notSelectable': {
            color: '#bbbbbb',
        },
    },
    treeFolderName: {
        display: 'inline-block',
        marginLeft: '5px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        verticalAlign: 'middle',
        zIndex: 2,
    },
    nodeOpenLink: {
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
        zIndex: 2,
    },
    faStack: {
        display: 'inline-block',
        verticalAlign: 'middle',
    },
    icon: {
        fontSize: "18px",
    },
    listItemIcon: {
        minWidth: theme.spacing(4),
    },
    divider: {
        marginTop: '8px',
        marginBottom: '8px',
    },
    faCircleShared: {
        color: theme.palette.primary.main,
        fontSize: "80%",
        marginTop: "50%",
    },
    faGroupShared: {
        color: theme.palette.background.default,
        fontSize: "35%",
        marginTop: "60%",
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
            <div className={classes.treeFolder}>
                <div className={classes.treeFolderTitle}>
                    <div
                        className={classes.treeFolderHeader + (isSelectable ? "" : " notSelectable")}
                        onClick={selectNode}
                        onContextMenu={onContextMenu}
                    >
                        <span className={`fa-stack ${classes.faStack}`}>
                            {isExpanded && <i className="fa-fw fa fa-folder-open" />}
                            {!isExpanded && <i className="fa-fw fa fa-folder" />}
                            {content.share_id && <i className={`fa fa-circle fa-stack-2x text-danger ${classes.faCircleShared}`} />}
                            {content.share_id && <i className={`fa fa-group fa-stack-2x ${classes.faGroupShared}`} />}
                        </span>
                        <span className={classes.treeFolderName}>{content.name}</span>

                    </div>
                    <ButtonGroup variant="text" aria-label="text button group" className={classes.nodeOpenLink}>
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
