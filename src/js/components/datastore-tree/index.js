import React from "react";
import { Trans } from 'react-i18next';
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import Hidden from "@mui/material/Hidden";
import { makeStyles } from '@mui/styles';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PeopleIcon from "@mui/icons-material/People";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

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
    emptyStateContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "400px",
        padding: theme.spacing(3),
    },
    emptyStateContent: {
        maxWidth: "600px",
        textAlign: "center",
        [theme.breakpoints.down('sm')]: {
            maxWidth: "90vw",
            padding: theme.spacing(2),
        },
    },
    emptyStateIcon: {
        fontSize: "120px",
        color: theme.palette.primary.main,
        marginBottom: theme.spacing(3),
        opacity: 0.7,
        [theme.breakpoints.down('sm')]: {
            fontSize: "80px",
        },
    },
    emptyStateTitle: {
        marginBottom: theme.spacing(2),
        fontWeight: 500,
    },
    emptyStateDescription: {
        marginBottom: theme.spacing(4),
        color: theme.palette.text.secondary,
    },
    emptyStateActions: {
        marginBottom: theme.spacing(3),
    },
    emptyStateInstructions: {
        padding: theme.spacing(2),
        backgroundColor: theme.palette.action.hover,
        borderRadius: theme.shape.borderRadius,
        marginTop: theme.spacing(2),
    },
    tree: {
        width: "100%",
        overflowX: 'visible',
        overflowY: 'visible',
        position: 'relative',
        height: deviceService.hasTitlebar() ? 'calc(100vh - 232px)' : 'calc(100vh - 200px)',
        '& *': {
            '-webkit-box-sizing': 'content-box',
            '-moz-box-sizing': 'content-box',
            'box-sizing': 'content-box',
        },
    }
}));

const DatastoreTree = (props) => {
    const classes = useStyles();
    const { datastore, setDatastore, search } = props;
    const { t } = useTranslation();
    const history = useHistory();
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
                .filter((item) => {
                    if (!props.selectedFilters || Object.keys(props.selectedFilters).filter((key) => props.selectedFilters[key]).length === 0) {
                        return true
                    }
                    for (const filter of  Object.keys(props.selectedFilters)) {
                        if (!props.selectedFilters[filter]) {
                            continue
                        }
                        if (filter.startsWith('entry_type:')) {
                            if (!item.hasOwnProperty("type") || `entry_type:${item["type"]}` !== filter) {
                                return false
                            }
                        }
                        if (filter.startsWith('tag:')) {
                            if (!item.hasOwnProperty("tags") || !item.tags || !item.tags.includes(filter.substring(4))) {
                                return false
                            }
                        }
                    }
                    return true
                })
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

    const handleImportClick = () => {
        history.push('/other/import');
    };

    if ((!datastore.folders || datastore.folders.filter((folder) => !folder["deleted"]).length === 0) && (!datastore.items || datastore.items.filter((item) => !item["deleted"]).length === 0)) {
        const canCreateEntries = !!props.onNewEntry;
        const canCreateFolders = !!props.onNewFolder;
        const hasCreateAbility = canCreateEntries || canCreateFolders;
        const isTrustedUsers = props.datastoreContext === "trusted-users";
        const isShare = props.datastoreContext === "share";

        // Select appropriate icon based on context
        let EmptyIcon = LockOpenIcon;
        if (isTrustedUsers) {
            EmptyIcon = PeopleIcon;
        } else if (isShare) {
            EmptyIcon = FolderOpenIcon;
        }

        // Trusted users datastore has special messaging
        if (isTrustedUsers) {
            return (
                <div className={classes.fullWidth}>
                    <Box className={classes.emptyStateContainer}>
                        <Box className={classes.emptyStateContent}>
                            {/* Icon Section */}
                            <EmptyIcon className={classes.emptyStateIcon} />

                            {/* Title */}
                            <Typography variant="h5" className={classes.emptyStateTitle}>
                                {t("TRUSTED_USERS_EMPTY_TITLE")}
                            </Typography>

                            {/* Description */}
                            <Typography variant="body1" className={classes.emptyStateDescription}>
                                {t("TRUSTED_USERS_EMPTY_DESCRIPTION")}
                            </Typography>

                            {/* Info Box */}
                            <Box className={classes.emptyStateInstructions}>
                                <Typography variant="body2" color="textSecondary">
                                    <InfoOutlinedIcon
                                        style={{
                                            fontSize: '18px',
                                            verticalAlign: 'middle',
                                            marginRight: '8px'
                                        }}
                                    />
                                    {t("TRUSTED_USERS_EMPTY_INFO")}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </div>
            );
        }

        // Share context (accept share dialog) has special messaging
        if (isShare) {
            return (
                <div className={classes.fullWidth}>
                    <Box className={classes.emptyStateContainer}>
                        <Box className={classes.emptyStateContent}>
                            {/* Icon Section */}
                            <EmptyIcon className={classes.emptyStateIcon} />

                            {/* Title */}
                            <Typography variant="h5" className={classes.emptyStateTitle}>
                                {t("SHARE_SELECT_EMPTY_TITLE")}
                            </Typography>

                            {/* Description */}
                            <Typography variant="body1" className={classes.emptyStateDescription}>
                                {t("SHARE_SELECT_EMPTY_DESCRIPTION")}
                            </Typography>

                            {/* Info Box - Only show if user can create folders */}
                            {canCreateFolders && (
                                <Box className={classes.emptyStateInstructions}>
                                    <Typography variant="body2" color="textSecondary">
                                        <InfoOutlinedIcon
                                            style={{
                                                fontSize: '18px',
                                                verticalAlign: 'middle',
                                                marginRight: '8px'
                                            }}
                                        />
                                        {t("SHARE_SELECT_EMPTY_INFO")}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </div>
            );
        }

        // Regular datastore logic
        // Determine the appropriate instruction key based on capabilities
        let instructionDesktopKey = "DATASTORE_EMPTY_NO_CREATE_INSTRUCTION";
        let instructionMobileKey = "DATASTORE_EMPTY_NO_CREATE_INSTRUCTION";

        if (canCreateEntries) {
            instructionDesktopKey = "DATASTORE_EMPTY_CREATE_INSTRUCTION_DESKTOP";
            instructionMobileKey = "DATASTORE_EMPTY_CREATE_INSTRUCTION_MOBILE";
        } else if (canCreateFolders) {
            instructionDesktopKey = "DATASTORE_EMPTY_CREATE_FOLDERS_ONLY_DESKTOP";
            instructionMobileKey = "DATASTORE_EMPTY_CREATE_FOLDERS_ONLY_MOBILE";
        }

        return (
            <div className={classes.fullWidth}>
                <Box className={classes.emptyStateContainer}>
                    <Box className={classes.emptyStateContent}>
                        {/* Icon Section */}
                        <EmptyIcon className={classes.emptyStateIcon} />

                        {/* Title */}
                        <Typography variant="h5" className={classes.emptyStateTitle}>
                            {t("DATASTORE_EMPTY_TITLE")}
                        </Typography>

                        {/* Description */}
                        <Typography variant="body1" className={classes.emptyStateDescription}>
                            {props.showImportAction
                                ? t("DATASTORE_EMPTY_DESCRIPTION")
                                : (hasCreateAbility
                                    ? t("DATASTORE_EMPTY_DESCRIPTION_NO_IMPORT")
                                    : t("DATASTORE_EMPTY_DESCRIPTION_READ_ONLY")
                                )
                            }
                        </Typography>

                        {/* Import Button - Only show in main datastore view */}
                        {props.showImportAction && (
                            <Box className={classes.emptyStateActions}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    startIcon={<CloudUploadIcon />}
                                    onClick={handleImportClick}
                                >
                                    {t("DATASTORE_EMPTY_IMPORT_BUTTON")}
                                </Button>
                            </Box>
                        )}

                        {/* Context-Aware Instructions - Only show if user can create items */}
                        {hasCreateAbility && (
                            <Box className={classes.emptyStateInstructions}>
                                <Hidden smDown>
                                    <Typography variant="body2" color="textSecondary">
                                        <InfoOutlinedIcon
                                            style={{
                                                fontSize: '18px',
                                                verticalAlign: 'middle',
                                                marginRight: '8px'
                                            }}
                                        />
                                        {t(instructionDesktopKey)}
                                    </Typography>
                                </Hidden>
                                <Hidden smUp>
                                    <Typography variant="body2" color="textSecondary">
                                        <InfoOutlinedIcon
                                            style={{
                                                fontSize: '18px',
                                                verticalAlign: 'middle',
                                                marginRight: '8px'
                                            }}
                                        />
                                        {t(instructionMobileKey)}
                                    </Typography>
                                </Hidden>
                            </Box>
                        )}
                    </Box>
                </Box>
            </div>
        );
    } else {
        return (
            <div className={classes.tree}>
                <AutoSizer>
                    {({height, width}) => (
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
    showImportAction: false,
    datastoreContext: "default",
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
    showImportAction: PropTypes.bool,
    datastoreContext: PropTypes.oneOf(["default", "trusted-users", "share"]),
};

export default DatastoreTree;
