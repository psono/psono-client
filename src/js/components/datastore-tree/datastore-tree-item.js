import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import GetAppIcon from "@material-ui/icons/GetApp";
import SettingsIcon from "@material-ui/icons/Settings";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListIcon from "@material-ui/icons/List";
import ShareIcon from "@material-ui/icons/Share";
import Typography from "@material-ui/core/Typography";
import LinkIcon from "@material-ui/icons/Link";
import EditIcon from "@material-ui/icons/Edit";
import VisibilityIcon from "@material-ui/icons/Visibility";
import OpenWithIcon from "@material-ui/icons/OpenWith";
import DeleteIcon from "@material-ui/icons/Delete";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import Divider from "@material-ui/core/Divider";
import { makeStyles } from "@material-ui/core/styles";

import ContentCopy from "../icons/ContentCopy";

import secretService from "../../services/secret";
import store from "../../services/store";
import widgetService from "../../services/widget";

const useStyles = makeStyles((theme) => ({
    divider: {
        marginTop: "8px",
        marginBottom: "8px",
    },
    icon: {
        fontSize: "18px",
    },
    iconCheckbox: {
        fontSize: "14px",
        marginRight: "4px",
    },
    listItemIcon: {
        minWidth: theme.spacing(4),
    },
}));

const DatastoreTreeItem = (props) => {
    const { t } = useTranslation();
    const { content, offline } = props;
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = useState(null);
    const isSelectable = props.isSelectable ? props.isSelectable(content) : true;
    const [contextMenuPosition, setContextMenuPosition] = useState({
        mouseX: null,
        mouseY: null,
    });

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

    const onLinkShare = (event) => {
        handleClose(event);
        if (content.hasOwnProperty("share_rights") && content.share_rights.read === false) {
            return;
        }
        return props.onLinkShare(content, content.path, props.nodePath);
    };

    const onCopyTotpToken = (event) => {
        handleClose(event);
        secretService.copyTotpToken(content);
    };

    const onCopyUsername = (event) => {
        handleClose(event);
        secretService.copyUsername(content);
    };

    const onCopyPassword = (event) => {
        handleClose(event);
        secretService.copyPassword(content);
    };

    const onEdit = (event) => {
        handleClose(event);
        props.onEditEntry(content, content.path, props.nodePath);
    };

    const onClone = (event) => {
        handleClose(event);
        props.onCloneEntry(content, content.path, props.nodePath);

    };

    const onShare = (event) => {
        handleClose(event);
        props.onShare(content, content.path, props.nodePath);
    };

    const onMoveEntry = (event) => {
        handleClose(event);
        props.onMoveEntry(content, content.path, props.nodePath);
    };

    const onDelete = (event) => {
        handleClose(event);
        props.onDeleteEntry(content, content.path, props.nodePath);
    };
    const selectItem = function (event) {
        event.stopPropagation();
        if (props.onSelectItem && isSelectable) {
            props.onSelectItem(content, content.path, props.nodePath);
        }
    };
    const linkItem = function (event) {
        event.stopPropagation();
        if (props.onLinkItem) {
            props.onLinkItem(content, content.path, props.nodePath);
        }
    };

    const hideNewShare =
        (store.getState().server.complianceDisableShares && !content.hasOwnProperty("share_id")) ||
        offline ||
        (content.hasOwnProperty("share_rights") && content.share_rights.grant === false) ||
        content.type === "user" ||
        !props.onShare;
    const hideRightsOverview =
        offline ||
        (content.hasOwnProperty("share_rights") && content.share_rights.grant === false) ||
        !content.hasOwnProperty("share_id") ||
        typeof content.share_id === "undefined";
    const hideShare = hideNewShare && hideRightsOverview;
    const hideLinkShare =
        offline ||
        !content.hasOwnProperty("type") ||
        (content.hasOwnProperty("share_rights") && content.share_rights.read === false) ||
        store.getState().server.complianceDisableLinkShares ||
        content.type === "user" ||
        !props.onLinkShare;
    const hideCopyTotpToken =
        (content.hasOwnProperty("share_rights") && content.share_rights.read !== true) ||
        !content.hasOwnProperty("type") ||
        !["totp"].includes(content["type"]);
    const hideCopyUsername =
        (content.hasOwnProperty("share_rights") && content.share_rights.read !== true) ||
        !content.hasOwnProperty("type") ||
        !["website_password", "application_password"].includes(content["type"]);
    const hideCopyPassword =
        (content.hasOwnProperty("share_rights") && content.share_rights.read !== true) ||
        !content.hasOwnProperty("type") ||
        !["website_password", "application_password"].includes(content["type"]);
    const hideEdit =
        offline ||
        (content.hasOwnProperty("share_rights") && content.share_rights.write === false) ||
        !props.onEditEntry;
    const hideShow =
        !hideEdit ||
        (content.hasOwnProperty("share_rights") && content.share_rights.read === false) ||
        !props.onEditEntry;
    const hideClone =
        offline ||
        (content.hasOwnProperty("share_rights") && content.share_rights.write === false) ||
        (content.hasOwnProperty("share_rights") && content.share_rights.read === false) ||
        content.type === "file" ||
        content.type === "user" ||
        !props.onCloneEntry;
    const hideMove =
        offline ||
        (content.hasOwnProperty("share_rights") && content.share_rights.delete === false) ||
        !props.onMoveEntry;
    const hideDelete =
        offline ||
        (content.hasOwnProperty("share_rights") && content.share_rights.delete === false) ||
        !props.onDeleteEntry;
    const disableMenu =
        hideLinkShare &&
        hideShare &&
        hideCopyTotpToken &&
        hideCopyUsername &&
        hideCopyPassword &&
        hideEdit &&
        hideShow &&
        hideClone &&
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
        <div className={"tree-item"}>
            <div
                className={"tree-item-object" + (isSelectable ? "" : " notSelectable")}
                onClick={selectItem}
                onContextMenu={onContextMenu}
            >
                <span className="fa-stack">
                    <i className={widgetService.itemIcon(content)} />
                    {content.share_id && <i className="fa fa-circle fa-stack-2x text-danger is-shared" />}
                    {content.share_id && <i className="fa fa-group fa-stack-2x is-shared" />}
                </span>
                {props.allowMultiselect && props.isSelected(content) && (
                    <i className={"fa fa-check-square-o" + " " + classes.iconCheckbox}  />
                )}
                {props.allowMultiselect && !props.isSelected(content) && (
                    <i className={"fa fa-square-o" + " " + classes.iconCheckbox}  />
                )}
                <span className="tree-item-name">{content.name}</span>
                <ButtonGroup variant="text" aria-label="outlined button group" className={"node-open-link"}>
                    {Boolean(props.onLinkItem) && ["bookmark", "website_password", "elster_certificate"].indexOf(content.type) !== -1 && (
                        <Button aria-label="open" onClick={linkItem}>
                            <OpenInNewIcon fontSize="small" />
                        </Button>
                    )}
                    {Boolean(props.onLinkItem) && ["file"].indexOf(content.type) !== -1 && (
                        <Button aria-label="open" onClick={linkItem}>
                            <GetAppIcon fontSize="small" />
                        </Button>
                    )}
                    <Button aria-label="settings" onClick={openMenu} disabled={disableMenu}>
                        <SettingsIcon fontSize="small" />
                    </Button>
                </ButtonGroup>
                <Menu
                    id="simple-menu"
                    onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                    }}
                    anchorEl={anchorEl}
                    keepMounted={false}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    {!hideShare && (
                        <MenuItem onClick={onShare}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <ShareIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("SHARE")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideLinkShare && (
                        <MenuItem onClick={onLinkShare}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <LinkIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("LINK_SHARE")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideCopyTotpToken && (
                        <MenuItem onClick={onCopyTotpToken}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <ContentCopy className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("COPY_TOTP_TOKEN")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideCopyUsername && (
                        <MenuItem onClick={onCopyUsername}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <ContentCopy className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("COPY_USERNAME")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideCopyPassword && (
                        <MenuItem onClick={onCopyPassword}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <ContentCopy className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("COPY_PASSWORD")}
                            </Typography>
                        </MenuItem>
                    )}
                    {(!hideShare ||
                        !hideLinkShare ||
                        !hideCopyTotpToken ||
                        !hideCopyUsername ||
                        !hideCopyPassword) && <Divider className={classes.divider} />}
                    {!hideEdit && (
                        <MenuItem onClick={onEdit}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <EditIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("SHOW_OR_EDIT")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideShow && (
                        <MenuItem onClick={onEdit}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <VisibilityIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("SHOW")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideClone && (
                        <MenuItem onClick={onClone}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <FileCopyIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("CLONE")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideMove && (
                        <MenuItem onClick={onMoveEntry}>
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
                                {props.deleteItemLabel}
                            </Typography>
                        </MenuItem>
                    )}
                </Menu>
            </div>
            <Menu
                keepMounted={false}
                onContextMenu={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                }}
                open={contextMenuPosition.mouseY !== null}
                onClose={onContextMenuClose}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenuPosition.mouseY !== null && contextMenuPosition.mouseX !== null
                        ? { top: contextMenuPosition.mouseY, left: contextMenuPosition.mouseX }
                        : undefined
                }
            >
                {!hideShare && (
                    <MenuItem onClick={onShare}>
                        <ListItemIcon className={classes.listItemIcon}>
                            <ShareIcon className={classes.icon} fontSize="small" />
                        </ListItemIcon>
                        <Typography variant="body2" noWrap>
                            {t("SHARE")}
                        </Typography>
                    </MenuItem>
                )}
                {!hideLinkShare && (
                    <MenuItem onClick={onLinkShare}>
                        <ListItemIcon className={classes.listItemIcon}>
                            <LinkIcon className={classes.icon} fontSize="small" />
                        </ListItemIcon>
                        <Typography variant="body2" noWrap>
                            {t("LINK_SHARE")}
                        </Typography>
                    </MenuItem>
                )}
                {!hideCopyTotpToken && (
                    <MenuItem onClick={onCopyTotpToken}>
                        <ListItemIcon className={classes.listItemIcon}>
                            <ContentCopy className={classes.icon} fontSize="small" />
                        </ListItemIcon>
                        <Typography variant="body2" noWrap>
                            {t("COPY_TOTP_TOKEN")}
                        </Typography>
                    </MenuItem>
                )}
                {!hideCopyUsername && (
                    <MenuItem onClick={onCopyUsername}>
                        <ListItemIcon className={classes.listItemIcon}>
                            <ContentCopy className={classes.icon} fontSize="small" />
                        </ListItemIcon>
                        <Typography variant="body2" noWrap>
                            {t("COPY_USERNAME")}
                        </Typography>
                    </MenuItem>
                )}
                {!hideCopyPassword && (
                    <MenuItem onClick={onCopyPassword}>
                        <ListItemIcon className={classes.listItemIcon}>
                            <ContentCopy className={classes.icon} fontSize="small" />
                        </ListItemIcon>
                        <Typography variant="body2" noWrap>
                            {t("COPY_PASSWORD")}
                        </Typography>
                    </MenuItem>
                )}
                {(!hideShare ||
                    !hideLinkShare ||
                    !hideCopyTotpToken ||
                    !hideCopyUsername ||
                    !hideCopyPassword) && <Divider className={classes.divider} />}
                {!hideEdit && (
                    <MenuItem onClick={onEdit}>
                        <ListItemIcon className={classes.listItemIcon}>
                            <EditIcon className={classes.icon} fontSize="small" />
                        </ListItemIcon>
                        <Typography variant="body2" noWrap>
                            {t("SHOW_OR_EDIT")}
                        </Typography>
                    </MenuItem>
                )}
                {!hideShow && (
                    <MenuItem onClick={onEdit}>
                        <ListItemIcon className={classes.listItemIcon}>
                            <VisibilityIcon className={classes.icon} fontSize="small" />
                        </ListItemIcon>
                        <Typography variant="body2" noWrap>
                            {t("SHOW")}
                        </Typography>
                    </MenuItem>
                )}
                {!hideClone && (
                    <MenuItem onClick={onClone}>
                        <ListItemIcon className={classes.listItemIcon}>
                            <FileCopyIcon className={classes.icon} fontSize="small" />
                        </ListItemIcon>
                        <Typography variant="body2" noWrap>
                            {t("CLONE")}
                        </Typography>
                    </MenuItem>
                )}
                {!hideMove && (
                    <MenuItem onClick={onMoveEntry}>
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
                            {props.deleteItemLabel}
                        </Typography>
                    </MenuItem>
                )}
            </Menu>
        </div>
    );
};

DatastoreTreeItem.propTypes = {
    isSelectable: PropTypes.func,
    nodePath: PropTypes.array.isRequired,
    content: PropTypes.object,
    offline: PropTypes.bool.isRequired,
    onShare: PropTypes.func,
    onLinkShare: PropTypes.func,
    onEditEntry: PropTypes.func,
    onCloneEntry: PropTypes.func,
    onDeleteEntry: PropTypes.func,
    onMoveEntry: PropTypes.func,
    onLinkItem: PropTypes.func,
    onSelectItem: PropTypes.func,
    isSelected: PropTypes.func,
    allowMultiselect: PropTypes.bool.isRequired,
    deleteItemLabel: PropTypes.string.isRequired,
};
export default DatastoreTreeItem;
