import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Hidden from "@material-ui/core/Hidden";
import { makeStyles } from "@material-ui/core/styles";

import offlineCache from "../services/offline-cache";
import DatastoreTreeItem from "./datastore-tree-item";
import DatastoreTreeFolder from "./datastore-tree-folder";
import datastorePassword from "../services/datastore-password";

const useStyles = makeStyles((theme) => ({
    fullWidth: {
        width: "100%",
    },
    center: {
        textAlign: "center",
        marginBottom: "20px",
    },
    bigIcon: {
        fontSize: "150px",
        marginTop: "30px",
        marginBottom: "30px",
    },
}));

const DatastoreTree = (props) => {
    const classes = useStyles();
    const { datastore, search } = props;
    const { t } = useTranslation();
    const offline = offlineCache.isActive();

    datastorePassword.modifyTreeForSearch(search, datastore);

    if (!datastore.folders && !datastore.items) {
        return (
            <div className={classes.fullWidth}>
                <div className={classes.center}>
                    <Hidden xsDown>
                        <i className={classes.bigIcon + " fa fa-plus-circle"} aria-hidden="true" />
                    </Hidden>

                    <div>
                        {t("NO_ITEMS")} <Hidden xsDown>{t("RIGHT_CLICK_HERE_TO_CREATE_ONE")}</Hidden>
                        <Hidden smUp>
                            Click on the
                            <br />
                            <i className={classes.bigIcon + " fa fa-cogs"} />
                            <br />
                            symbol in the top right corner to start.
                        </Hidden>
                    </div>
                </div>
            </div>
        );
    } else {
        return (
            <div className={"tree"}>
                {datastore.folders &&
                    datastore.folders
                        .filter((folder) => !folder["hidden"] && !folder["deleted"])
                        .map(function (content, i) {
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
                                    nodePath={[content]}
                                    content={content}
                                    offline={offline}
                                    isExpandedDefault={Boolean(content["is_expanded"])}
                                />
                            );
                        })}
                {datastore.items &&
                    datastore.items
                        .filter((item) => !item["hidden"] && !item["deleted"])
                        .map(function (content, i) {
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
                                    nodePath={[content]}
                                    content={content}
                                    offline={offline}
                                />
                            );
                        })}
            </div>
        );
    }
};

DatastoreTree.propTypes = {
    search: PropTypes.string,
    datastore: PropTypes.object.isRequired,
    onNewFolder: PropTypes.func,
    onNewUser: PropTypes.func,
    onNewShare: PropTypes.func,
    onLinkShare: PropTypes.func,
    onRightsOverview: PropTypes.func,
    onNewEntry: PropTypes.func,
    onEditEntry: PropTypes.func,
    onCloneEntry: PropTypes.func,
    onDeleteEntry: PropTypes.func,
    onMoveEntry: PropTypes.func,
    onDeleteFolder: PropTypes.func,
    onMoveFolder: PropTypes.func,
    onLinkItem: PropTypes.func,
    onEditFolder: PropTypes.func,
    onSelectItem: PropTypes.func,
    onSelectNode: PropTypes.func,
    isSelectable: PropTypes.func,
};

export default DatastoreTree;
