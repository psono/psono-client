import React from "react";
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
import OpenWithIcon from "@material-ui/icons/OpenWith";
import DeleteIcon from "@material-ui/icons/Delete";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import Divider from "@material-ui/core/Divider";
import { makeStyles } from "@material-ui/core/styles";

import ContentCopy from "./icons/ContentCopy";

import secretService from "../services/secret";
import fileTransferService from "../services/file-transfer";
import store from "../services/store";
import widgetService from "../services/widget";

const useStyles = makeStyles((theme) => ({
    divider: {
        marginTop: "8px",
        marginBottom: "8px",
    },
    icon: {
        fontSize: "18px",
    },
}));

const DatastoreTreeItem = (props) => {
    const { t } = useTranslation();
    const { content, search, offline } = props;
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = React.useState(null);

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

    const onLinkShare = (event) => {
        handleClose(event);
        if (content.hasOwnProperty("share_rights") && content.share_rights.grant === false) {
            return;
        }

        /**
         * User clicked the "Create" button
         *
         * @param content
         */
        var on_modal_close_success = function (content) {
            console.log(content);
        };

        var modalInstance = $uibModal.open({
            templateUrl: "view/modal/create-link-share.html",
            controller: "ModalCreateLinkShareCtrl",
            backdrop: "static",
            resolve: {
                node: function () {
                    return item;
                },
            },
        });

        // User clicked the final share button
        modalInstance.result.then(on_modal_close_success, function () {
            // cancel triggered
        });
    };

    const onRightsOverview = (event) => {
        handleClose(event);
        if (content.hasOwnProperty("share_rights") && content.share_rights.grant === false) {
            return;
        }

        registrations["read_share_rights"](content.share_id).then(function (share_details) {
            var modalInstance = $uibModal.open({
                templateUrl: "view/modal/display-share-rights.html",
                controller: "ModalDisplayShareRightsCtrl",
                backdrop: "static",
                size: "lg",
                resolve: {
                    node: function () {
                        return content;
                    },
                    path: function () {
                        return path;
                    },
                    share_details: function () {
                        return share_details;
                    },
                },
            });
        });
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
        // TODO editNode
    };

    const onNewShare = (event) => {
        handleClose(event);
        props.onNewShare(content, content.path);
    };

    const onMove = (event) => {
        handleClose(event);
        // TODO moveNode
    };
    const clickItem = function () {
        if (content.type === "file") {
            return fileTransferService.onItemClick(content, content.path);
        } else {
            return secretService.onItemClick(content);
        }
    };

    const hideShare = offline || (content.hasOwnProperty("share_rights") && content.share_rights.grant === false);
    const hideLinkShare =
        offline ||
        !content.hasOwnProperty("type") ||
        (content.hasOwnProperty("share_rights") && content.share_rights.grant === false) ||
        store.getState().server.complianceDisableLinkShares;
    const hideRightsOverview =
        offline ||
        (content.hasOwnProperty("share_rights") && content.share_rights.grant === false) ||
        !content.hasOwnProperty("share_id") ||
        typeof content.share_id === "undefined";
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
    const hideEdit = offline || content.share_rights.write === false;
    const hideClone =
        offline || content.share_rights.write === false || content.share_rights.read === false || content.type === "file" || content.type === "user";
    const hideMove = offline || content.share_rights.delete === false;
    const hideDelete = offline || content.share_rights.delete === false;

    return (
        <div className={"tree-item"}>
            <div className={"tree-item-object"}>
                <span className="fa-stack">
                    <i className={widgetService.itemIcon(content)} />
                    {content.share_id && <i className="fa fa-circle fa-stack-2x text-danger is-shared" />}
                    {content.share_id && <i className="fa fa-group fa-stack-2x is-shared" />}
                </span>
                <span className="tree-item-name">{content.name}</span>
                <ButtonGroup variant="text" aria-label="outlined button group" className={"node-open-link"}>
                    {["bookmark", "website_password"].indexOf(content.type) !== -1 && (
                        <Button aria-label="open" onClick={clickItem}>
                            <OpenInNewIcon fontSize="small" />
                        </Button>
                    )}
                    {["file"].indexOf(content.type) !== -1 && (
                        <Button aria-label="open" onClick={clickItem}>
                            <GetAppIcon fontSize="small" />
                        </Button>
                    )}
                    <Button aria-label="settings" onClick={openMenu}>
                        <SettingsIcon fontSize="small" />
                    </Button>
                </ButtonGroup>
                <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
                    {!hideShare && (
                        <MenuItem onClick={onNewShare}>
                            <ListItemIcon>
                                <ShareIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("SHARE")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideLinkShare && (
                        <MenuItem onClick={onLinkShare}>
                            <ListItemIcon>
                                <LinkIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("LINK_SHARE")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideRightsOverview && (
                        <MenuItem onClick={onRightsOverview}>
                            <ListItemIcon>
                                <ListIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("RIGHTS_OVERVIEW")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideCopyTotpToken && (
                        <MenuItem onClick={onCopyTotpToken}>
                            <ListItemIcon>
                                <ContentCopy className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("COPY_TOTP_TOKEN")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideCopyUsername && (
                        <MenuItem onClick={onCopyUsername}>
                            <ListItemIcon>
                                <ContentCopy className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("COPY_USERNAME")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideCopyPassword && (
                        <MenuItem onClick={onCopyPassword}>
                            <ListItemIcon>
                                <ContentCopy className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("COPY_PASSWORD")}
                            </Typography>
                        </MenuItem>
                    )}
                    <Divider className={classes.divider} />
                    {!hideEdit && (
                        <MenuItem onClick={onEdit}>
                            <ListItemIcon>
                                <EditIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {content.type === "user" ? t("SHOW") : t("SHOW_OR_EDIT")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideClone && (
                        <MenuItem onClick={onEdit}>
                            <ListItemIcon>
                                <FileCopyIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("CLONE")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideMove && (
                        <MenuItem onClick={onMove}>
                            <ListItemIcon>
                                <OpenWithIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("MOVE")}
                            </Typography>
                        </MenuItem>
                    )}
                    {!hideDelete && <Divider className={classes.divider} />}
                    {!hideDelete && (
                        <MenuItem onClick={onMove}>
                            <ListItemIcon>
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
    );
};

DatastoreTreeItem.propTypes = {
    search: PropTypes.string.isRequired,
    content: PropTypes.object,
    offline: PropTypes.bool.isRequired,
    onNewShare: PropTypes.func,
};
export default DatastoreTreeItem;
