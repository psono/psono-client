import React from "react";
import { Trans } from 'react-i18next';
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Hidden from "@mui/material/Hidden";
import { makeStyles } from '@mui/styles';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";

import offlineCache from "../../services/offline-cache";
import datastorePassword from "../../services/datastore-password";
import DatastoreTreeVirtualElement from "./datastore-tree-virtual-element";
import deviceService from "../../services/device";

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
    const { datastore, setDatastore, search } = props;
    const { t } = useTranslation();
    const offline = offlineCache.isActive();

    const getIsExpandedFolder = (folder) => {
        if (folder.datastore_id) return true;

        return folder.expanded_temporary
            ? typeof folder.expanded === 'undefined' ? true : folder.expanded
            : folder.expanded;
    };

    React.useEffect(() => {
        const updatedDatastore = datastorePassword.collapseFoldersRecursive(datastore);

        setDatastore(updatedDatastore);
    }, [search]);

    datastorePassword.modifyTreeForSearch(search, datastore);

    const formatDatastoreItems = (folder, acc, isFolder, nodePath, path) => {
        const currentPath = folder.datastore_id ? [...path] : [...path, folder.id];

        // Ignore the parent datastore folder with 'datastore_id' property
        if (!folder.datastore_id) {
            folder.is_folder = isFolder;
            folder.path = currentPath;

            acc.push(folder);
        }

        const isExpanded = getIsExpandedFolder(folder);

        if (folder.folders && (folder.datastore_id || isExpanded)) {
            folder.folders
                .sort(function(a, b){
                    let a_name = a.name ? a.name : '';
                    let b_name = b.name ? b.name : '';
                    if (a_name.toLowerCase() < b_name.toLowerCase())
                        return -1;
                    if (a_name.toLowerCase() > b_name.toLowerCase())
                        return 1;
                    return 0;
                })
                .filter((folder) => !folder["hidden"] && !folder["deleted"])
                .forEach(item => formatDatastoreItems(item, acc, true, nodePath.concat(item), currentPath));
        }

        if (!props.hideItems && isExpanded && folder.items) {
            folder.items
                .sort(function(a, b){
                    let a_name = a.name ? a.name : '';
                    let b_name = b.name ? b.name : '';
                    if (a_name.toLowerCase() < b_name.toLowerCase())
                        return -1;
                    if (a_name.toLowerCase() > b_name.toLowerCase())
                        return 1;
                    return 0;
                })
                .filter((item) => !item["hidden"] && !item["deleted"])
                .forEach(item => formatDatastoreItems(item, acc, false, nodePath.concat(item), currentPath))
        }

        return acc;
    }

    const updateExpandFolderProperty = (id, folder) => {
        if (folder.id === id) {
            const isExpanded = getIsExpandedFolder(folder);

            return {
                ...folder,
                expanded: !isExpanded,
            };
        }

        if (folder.folders) {
            const updatedFolders = folder.folders.map(item => {
                return updateExpandFolderProperty(id, item);
            });

            return {
                ...folder,
                folders: updatedFolders,
            };
        }

        return folder;
    }

    const onUpdateExpandFolderProperty = (id) => {
        const updatedDatastore = updateExpandFolderProperty(id, datastore);

        setDatastore(updatedDatastore);
    };

    const datastoreItems = formatDatastoreItems(datastore, [], true, [], []);

    if ((!datastore.folders || datastore.folders.filter((folder) => !folder["deleted"]).length === 0) && (!datastore.items || datastore.items.filter((item) => !item["deleted"]).length === 0)) {
        return (
            <div className={classes.fullWidth}>
                <div className={classes.center}>
                    <Hidden smDown>
                        <i className={classes.bigIcon + " fa fa-plus-circle"} aria-hidden="true" />
                    </Hidden>

                    <div>
                        {t("NO_ITEMS")} <Hidden smDown>{t("RIGHT_CLICK_HERE_TO_CREATE_ONE")}</Hidden>
                        <Hidden smUp>
                            <Trans i18nKey="CLICK_ON_THE_SYMBOL_IN_THE_TOP_RIGHT_CORNER_TO_START">
                                Click on the<br /><i className={classes.bigIcon + " fa fa-cogs"} /><br />symbol in the top right corner to start.
                            </Trans>
                        </Hidden>
                    </div>
                </div>
            </div>
        );
    } else {
        return (
            <div className={"tree"} style={{ height: deviceService.hasTitlebar() ? 'calc(100vh - 232px)' : 'calc(100vh - 200px)' }}>
                <AutoSizer>
                    {({ height, width }) => (
                        <List
                            itemCount={datastoreItems.length}
                            itemSize={46}
                            width={width}
                            height={height}
                            itemData={{
                                props,
                                offline,
                                datastore,
                                items: datastoreItems,
                                getIsExpandedFolder,
                                onUpdateExpandFolderProperty,
                            }}
                        >
                            {DatastoreTreeVirtualElement}
                        </List>
                    )}
                </AutoSizer>
            </div>
        );
    }
};

DatastoreTree.defaultProps = {
    allowMultiselect: false,
};


DatastoreTree.propTypes = {
    search: PropTypes.string,
    datastore: PropTypes.object.isRequired,
    onNewFolder: PropTypes.func,
    onNewUser: PropTypes.func,
    onShare: PropTypes.func,
    onLinkShare: PropTypes.func,
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
    isSelected: PropTypes.func,
    allowMultiselect: PropTypes.bool.isRequired,
    onSelectNode: PropTypes.func,
    isSelectable: PropTypes.func,
    hideItems: PropTypes.bool,
    deleteFolderLabel: PropTypes.string.isRequired,
    deleteItemLabel: PropTypes.string.isRequired,
    setDatastore: PropTypes.func.isRequired,
};

export default DatastoreTree;
