import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import PeopleIcon from "@mui/icons-material/People";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Hidden from "@mui/material/Hidden";
import Typography from "@mui/material/Typography";
import { makeStyles } from "@mui/styles";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import type { Datastore, DatastorePath } from "../../../types/datastore";
import type {
	DatastoreTreeProps,
	DatastoreTreeNode,
	DatastoreTreeListData,
} from "../../../types/datastore-ui";
import datastorePassword from "../../services/datastore-password";
import deviceService from "../../services/device";
import offlineCache from "../../services/offline-cache";
import DatastoreTreeVirtualElement from "./datastore-tree-virtual-element";

const FOLDER_EXPANSION_STORAGE_KEY_PREFIX =
	"psono:datastore-tree:folder-expansion";

const getFolderExpansionStorageKey = (
	datastore: Datastore,
	datastoreContext: DatastoreTreeProps["datastoreContext"],
) => {
	const datastoreId = datastore.datastore_id || datastore.id || "default";

	return `${FOLDER_EXPANSION_STORAGE_KEY_PREFIX}:${datastoreContext}:${datastoreId}`;
};

const getLocalStorage = () => {
	if (typeof window === "undefined") {
		return null;
	}

	try {
		return window.localStorage;
	} catch (e) {
		return null;
	}
};

const readFolderExpansionState = (
	storageKey: string,
): Record<string, unknown> => {
	const localStorage = getLocalStorage();

	if (!localStorage) {
		return {};
	}

	try {
		const folderExpansionState: unknown = JSON.parse(
			localStorage.getItem(storageKey) || "{}",
		);

		return folderExpansionState &&
			typeof folderExpansionState === "object" &&
			!Array.isArray(folderExpansionState)
			? (folderExpansionState as Record<string, unknown>)
			: {};
	} catch (e) {
		return {};
	}
};

const writeFolderExpansionState = (
	storageKey: string,
	folderExpansionState: Record<string, unknown>,
) => {
	const localStorage = getLocalStorage();

	if (!localStorage) {
		return;
	}

	try {
		localStorage.setItem(storageKey, JSON.stringify(folderExpansionState));
	} catch (e) {
		// Ignore unavailable localStorage, e.g. private browsing quota errors.
	}
};

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
		[theme.breakpoints.down("sm")]: {
			maxWidth: "90vw",
			padding: theme.spacing(2),
		},
	},
	emptyStateIcon: {
		fontSize: "120px",
		color: theme.palette.primary.main,
		marginBottom: theme.spacing(3),
		opacity: 0.7,
		[theme.breakpoints.down("sm")]: {
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
		overflowX: "visible",
		overflowY: "visible",
		position: "relative",
		height: deviceService.hasTitlebar()
			? "calc(100vh - 232px)"
			: "calc(100vh - 200px)",
	},
}));

const DatastoreTree = (props: DatastoreTreeProps) => {
	const classes = useStyles();
	const { datastore, setDatastore, search } = props;
	const { t } = useTranslation();
	const history = useHistory();
	const offline = offlineCache.isActive();
	const folderExpansionStorageKey = getFolderExpansionStorageKey(
		datastore,
		props.datastoreContext,
	);
	const [folderExpansionState, setFolderExpansionState] = React.useState(() =>
		readFolderExpansionState(folderExpansionStorageKey),
	);
	const [searchCollapsedFolders, setSearchCollapsedFolders] = React.useState<
		Record<string, boolean>
	>({});

	const getIsExpandedFolder = (folder: Datastore) => {
		if (folder.datastore_id) return true;

		if (search && searchCollapsedFolders[folder.id!]) return false;

		if (folder.expanded_temporary) return true;

		return folderExpansionState[folder.id!] === true;
	};

	React.useEffect(() => {
		setFolderExpansionState(
			readFolderExpansionState(folderExpansionStorageKey),
		);
	}, [folderExpansionStorageKey]);

	React.useEffect(() => {
		setSearchCollapsedFolders({});

		const updatedDatastore =
			datastorePassword.collapseFoldersRecursive(datastore);

		setDatastore(updatedDatastore);
	}, [search]);

	datastorePassword.modifyTreeForSearch(search, datastore);

	const formatDatastoreItems = (
		folder: Datastore,
		acc: DatastoreTreeNode[],
		isFolder: boolean,
		nodePath: Datastore[],
		path: DatastorePath,
	): DatastoreTreeNode[] => {
		const currentPath = folder.datastore_id ? [...path] : [...path, folder.id!];

		// Ignore the parent datastore folder with 'datastore_id' property
		if (!folder.datastore_id) {
			folder.is_folder = isFolder;
			folder.path = currentPath;

			// Non-root nodes have IDs; the two fields above define the rendered node.
			acc.push(folder as DatastoreTreeNode);
		}

		const isExpanded = getIsExpandedFolder(folder);

		if (folder.folders && (folder.datastore_id || isExpanded)) {
			folder.folders
				.sort((a, b) => {
					const a_name = a.name ? a.name : "";
					const b_name = b.name ? b.name : "";
					if (a_name.toLowerCase() < b_name.toLowerCase()) return -1;
					if (a_name.toLowerCase() > b_name.toLowerCase()) return 1;
					return 0;
				})
				.filter((folder) => !folder["hidden"] && !folder["deleted"])
				.forEach((item) =>
					formatDatastoreItems(
						item,
						acc,
						true,
						nodePath.concat(item),
						currentPath,
					),
				);
		}

		if (!props.hideItems && isExpanded && folder.items) {
			folder.items
				.sort((a, b) => {
					const a_name = a.name ? a.name : "";
					const b_name = b.name ? b.name : "";
					if (a_name.toLowerCase() < b_name.toLowerCase()) return -1;
					if (a_name.toLowerCase() > b_name.toLowerCase()) return 1;
					return 0;
				})
				.filter((item) => !item["hidden"] && !item["deleted"])
				.filter((item) => {
					if (
						!props.selectedFilters ||
						Object.keys(props.selectedFilters).filter(
							(key) => props.selectedFilters![key],
						).length === 0
					) {
						return true;
					}
					for (const filter of Object.keys(props.selectedFilters)) {
						if (!props.selectedFilters[filter]) {
							continue;
						}
						if (filter.startsWith("entry_type:")) {
							if (
								!Object.hasOwn(item, "type") ||
								`entry_type:${item["type"]}` !== filter
							) {
								return false;
							}
						}
						if (filter.startsWith("tag:")) {
							if (
								!Object.hasOwn(item, "tags") ||
								!item.tags ||
								!item.tags.includes(filter.substring(4))
							) {
								return false;
							}
						}
					}
					return true;
				})
				.forEach((item) =>
					formatDatastoreItems(
						item,
						acc,
						false,
						nodePath.concat(item),
						currentPath,
					),
				);
		}

		return acc;
	};

	const onUpdateExpandFolderProperty = (id: string, isExpanded: boolean) => {
		if (search) {
			setSearchCollapsedFolders((currentSearchCollapsedFolders) => {
				const updatedSearchCollapsedFolders = {
					...currentSearchCollapsedFolders,
				};

				if (isExpanded) {
					updatedSearchCollapsedFolders[id] = true;
				} else {
					delete updatedSearchCollapsedFolders[id];
				}

				return updatedSearchCollapsedFolders;
			});
			return;
		}

		setFolderExpansionState((currentFolderExpansionState) => {
			const updatedFolderExpansionState = {
				...currentFolderExpansionState,
				[id]: !isExpanded,
			};

			writeFolderExpansionState(
				folderExpansionStorageKey,
				updatedFolderExpansionState,
			);

			return updatedFolderExpansionState;
		});
	};

	const datastoreItems = formatDatastoreItems(datastore, [], true, [], []);

	const handleImportClick = () => {
		history.push("/other/import");
	};

	if (
		(!datastore.folders ||
			datastore.folders.filter((folder) => !folder["deleted"]).length === 0) &&
		(!datastore.items ||
			datastore.items.filter((item) => !item["deleted"]).length === 0)
	) {
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
							<Typography
								variant="body1"
								className={classes.emptyStateDescription}
							>
								{t("TRUSTED_USERS_EMPTY_DESCRIPTION")}
							</Typography>

							{/* Info Box */}
							<Box className={classes.emptyStateInstructions}>
								<Typography variant="body2" color="textSecondary">
									<InfoOutlinedIcon
										style={{
											fontSize: "18px",
											verticalAlign: "middle",
											marginRight: "8px",
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
							<Typography
								variant="body1"
								className={classes.emptyStateDescription}
							>
								{t("SHARE_SELECT_EMPTY_DESCRIPTION")}
							</Typography>

							{/* Info Box - Only show if user can create folders */}
							{canCreateFolders && (
								<Box className={classes.emptyStateInstructions}>
									<Typography variant="body2" color="textSecondary">
										<InfoOutlinedIcon
											style={{
												fontSize: "18px",
												verticalAlign: "middle",
												marginRight: "8px",
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
						<Typography
							variant="body1"
							className={classes.emptyStateDescription}
						>
							{props.showImportAction
								? t("DATASTORE_EMPTY_DESCRIPTION")
								: hasCreateAbility
									? t("DATASTORE_EMPTY_DESCRIPTION_NO_IMPORT")
									: t("DATASTORE_EMPTY_DESCRIPTION_READ_ONLY")}
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
												fontSize: "18px",
												verticalAlign: "middle",
												marginRight: "8px",
											}}
										/>
										{t(instructionDesktopKey)}
									</Typography>
								</Hidden>
								<Hidden smUp>
									<Typography variant="body2" color="textSecondary">
										<InfoOutlinedIcon
											style={{
												fontSize: "18px",
												verticalAlign: "middle",
												marginRight: "8px",
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
					{({ height, width }: { height: number; width: number }) => (
						<List<DatastoreTreeListData>
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

export default DatastoreTree;
