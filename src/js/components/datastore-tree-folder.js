import React from "react";
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
}));

const DatastoreTreeFolder = (props) => {
    const { t } = useTranslation();
    const { content, search, offline, isExpandedDefault } = props;
    const classes = useStyles();
    const [isExpanded, setIsExpanded] = React.useState(isExpandedDefault);
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
                        return item;
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

    const onEdit = (event) => {
        handleClose(event);
        // TODO editNode
    };

    const onNewFolder = (event) => {
        handleClose(event);
        props.onNewFolder(content, content.path);
    };

    const onNewShare = (event) => {
        handleClose(event);
        props.onNewShare(content, content.path);
    };

    const onNewEntry = (event) => {
        handleClose(event);
        // TODO newEntryNode
    };

    const onMove = (event) => {
        handleClose(event);
        // TODO moveNode
    };

    const selectNode = (event) => {
        event.stopPropagation();
        setIsExpanded(!isExpanded);
    };
    React.useEffect(() => {
        setIsExpanded(isExpandedDefault);
    }, [isExpandedDefault]);

    const hideShare = offline || (content.hasOwnProperty("share_rights") && content.share_rights.grant === false);
    const hideRightsOverview =
        offline ||
        (content.hasOwnProperty("share_rights") && content.share_rights.grant === false) ||
        !content.hasOwnProperty("share_id") ||
        typeof content.share_id === "undefined";
    const hideEdit = offline || content.share_rights.write === false;
    const hideNewFolder = offline || content.share_rights.write === false;
    const hideNewEntry = offline || content.share_rights.write === false;
    const hideMove = offline || content.share_rights.delete === false;
    const hideDelete = offline || content.share_rights.delete === false;

    return (
        <div className={"tree-folder"}>
            <div className={"tree-folder-title"}>
                <div className={"tree-folder-header"} onClick={selectNode}>
                    <span className="fa-stack">
                        {isExpanded && <i className="fa fa-folder-open" />}
                        {!isExpanded && <i className="fa fa-folder" />}
                        {content.share_id && <i className="fa fa-circle fa-stack-2x text-danger is-shared" />}
                        {content.share_id && <i className="fa fa-group fa-stack-2x is-shared" />}
                    </span>
                    <span className="tree-folder-name ng-binding">{content.name}</span>
                    <ButtonGroup variant="text" aria-label="text button group" className={"node-open-link"}>
                        <Button aria-label="settings" onClick={openMenu}>
                            <SettingsIcon fontSize="small" />
                        </Button>
                    </ButtonGroup>
                    <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
                        {!hideShare && onNewShare && (
                            <MenuItem onClick={onNewShare}>
                                <ListItemIcon>
                                    <ShareIcon className={classes.icon} fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" noWrap>
                                    {t("SHARE")}
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
                        {(!hideShare || !hideRightsOverview) && <Divider className={classes.divider} />}
                        {!hideEdit && (
                            <MenuItem onClick={onEdit}>
                                <ListItemIcon>
                                    <EditIcon className={classes.icon} fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" noWrap>
                                    {t("EDIT")}
                                </Typography>
                            </MenuItem>
                        )}
                        {!hideNewFolder && (
                            <MenuItem onClick={onNewFolder}>
                                <ListItemIcon>
                                    <CreateNewFolderIcon className={classes.icon} fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" noWrap>
                                    {t("NEW_FOLDER")}
                                </Typography>
                            </MenuItem>
                        )}
                        {!hideNewEntry && (
                            <MenuItem onClick={onNewEntry}>
                                <ListItemIcon>
                                    <AddIcon className={classes.icon} fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" noWrap>
                                    {t("NEW_ENTRY")}
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
            {isExpanded && (
                <div className={"tree-folder-content"}>
                    {content.folders &&
                        content.folders
                            .filter((folder) => !folder["hidden"] && !folder["deleted"])
                            .map(function (content, i) {
                                return (
                                    <DatastoreTreeFolder
                                        onNewFolder={props.onNewFolder}
                                        search={search}
                                        key={i}
                                        content={content}
                                        offline={offline}
                                        isExpandedDefault={Boolean(content["is_expanded"])}
                                    />
                                );
                            })}
                    {content.items &&
                        content.items
                            .filter((item) => !item["hidden"] && !item["deleted"])
                            .map(function (content, i) {
                                return <DatastoreTreeItem onNewShare={props.onNewShare} search={search} key={i} content={content} offline={offline} />;
                            })}
                </div>
            )}
        </div>
    );
};

DatastoreTreeFolder.propTypes = {
    search: PropTypes.string.isRequired,
    isExpandedDefault: PropTypes.bool.isRequired,
    content: PropTypes.object,
    offline: PropTypes.bool.isRequired,
    onNewFolder: PropTypes.func.isRequired,
    onNewShare: PropTypes.func,
};

export default DatastoreTreeFolder;
