import AddIcon from "@mui/icons-material/Add";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import AppBar from "@mui/material/AppBar";
import Grid from "@mui/material/Grid";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { makeStyles } from "@mui/styles";
import { differenceInSeconds } from "date-fns";
import React, { useReducer, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import action from "../../actions/bound-action-creators";
import AlertSecurityReport from "../../components/alert/security-report";
import Base from "../../components/base";
import BaseContent from "../../components/base-content";
import BaseTitle from "../../components/base-title";
import DatastoreTree from "../../components/datastore-tree";
import DialogCreateLinkShare from "../../components/dialogs/create-link-share";
import DialogEditEntry from "../../components/dialogs/edit-entry";
import DialogEditFolder from "../../components/dialogs/edit-folder";
import DialogError from "../../components/dialogs/error";
import DialogNewEntry from "../../components/dialogs/new-entry";
import DialogNewFolder from "../../components/dialogs/new-folder";
import DialogProgress from "../../components/dialogs/progress";
import DialogRightsOverview from "../../components/dialogs/rights-overview";
import DialogSelectFolder from "../../components/dialogs/select-folder";
import DialogUnlockOfflineCache from "../../components/dialogs/unlock-offline-cache";
import DialogVerify from "../../components/dialogs/verify";
import FilterSideBar from "../../components/filter-sidebar";
import datastoreService from "../../services/datastore";
import datastorePasswordService from "../../services/datastore-password";
import fileTransferService from "../../services/file-transfer";
import itemBlueprintService from "../../services/item-blueprint";
import offlineCacheService from "../../services/offline-cache";
import secretService from "../../services/secret";
import { getStore } from "../../services/store";
import widget from "../../services/widget";
import widgetService from "../../services/widget";
import DatastoreToolbar from "./toolbar";

const useStyles = makeStyles((theme) => ({
	root: {
		position: "relative",
		display: "flex",
		padding: "15px",
	},
	contentShift: {
		marginRight: 300, // Same as drawer width
	},
	loader: {
		textAlign: "center",
		marginTop: "30px",
		marginBottom: "30px",
		margin: "auto",
	},
	securityReportAlert: {
		marginBottom: theme.spacing(1),
	},
	iconButton: {
		padding: 10,
		display: "inline-flex",
	},
	divider: {
		height: 28,
		margin: 0,
		marginBottom: -10,
		display: "inline-flex",
	},
	topMessage: {
		marginBottom: 20,
	},
	icon: {
		fontSize: "18px",
	},
	listItemIcon: {
		minWidth: theme.spacing(4),
	},
	filterSideBar: {
		marginTop: `-${theme.spacing(2)}`,
		height: `calc(100% + ${theme.spacing(4)})`,
		overflowY: "auto",
	},
}));

function useWidth() {
	const theme = useTheme();
	const keys = [...theme.breakpoints.keys].reverse();
	return (
		keys.reduce((output, key) => {
			// eslint-disable-next-line react-hooks/rules-of-hooks
			const matches = useMediaQuery(theme.breakpoints.up(key));
			return !output && matches ? key : output;
		}, null) || "xs"
	);
}

const DatastoreView = (props) => {
	const width = useWidth();
	const bigScreen = ["lg", "md", "xl"].includes(width);
	const hugeScreen = ["xl"].includes(width);
	const { defaultSearch, secretType, secretId } = useParams();
	const [progress, setProgress] = React.useState(0);
	const serverStatus = useSelector((state) => state.server.status);
	const passwordDatastore = useSelector((state) =>
		state.user.userDatastoreOverview?.datastores?.find(
			(datastore) => datastore.type === "password" && datastore.is_default,
		),
	);
	const recurrenceInterval = useSelector(
		(state) => state.server.complianceCentralSecurityReportsRecurrenceInterval,
	);
	const disableCentralSecurityReports = useSelector(
		(state) => state.server.disableCentralSecurityReports,
	);
	const classes = useStyles();
	const { t } = useTranslation();
	const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
	const [search, setSearch] = useState(defaultSearch || "");
	const [massOperationSelected, setMassOperationSelected] = useState({});
	const [showMassOperationControls, setShowMassOperationControls] = useState();
	const [error, setError] = useState(null);
	const [selectedFilters, setSelectedFilters] = useState({});
	const [contextMenuPosition, setContextMenuPosition] = useState({
		mouseX: null,
		mouseY: null,
	});

	const showFilters = useSelector((state) => !!state.client.showFilters);
	const [unlockOfflineCache, setUnlockOfflineCache] = useState(false);

	const [newFolderOpen, setNewFolderOpen] = useState(false);
	const [newFolderData, setNewFolderData] = useState({});

	const [newEntryOpen, setNewEntryOpen] = useState(false);
	const [newEntryData, setNewEntryData] = useState({});

	const [editFolderOpen, setEditFolderOpen] = useState(false);
	const [editFolderData, setEditFolderData] = useState({});

	const [editEntryOpen, setEditEntryOpen] = useState(false);
	const [editEntryData, setEditEntryData] = useState({});

	const [editEntryDirty, setEditEntryDirty] = useState(false);
	const [editEntryConfirmDialog, setEditEntryConfirmDialog] = useState(false);

	const getEditEntryConfirmDialog = () => {
		return editEntryConfirmDialog;
	};

	const [rightsOverviewOpen, setRightsOverviewOpen] = useState(false);
	const [rightsOverviewData, setRightsOverviewData] = useState({});

	const [moveEntryData, setMoveEntryData] = useState([]);
	const [moveFolderData, setMoveFolderData] = useState([]);

	const [createLinkShareOpen, setCreateLinkShareOpen] = useState(false);
	const [createLinkShareData, setCreateLinkShareData] = useState({});

	const [datastore, setDatastore] = useState(null);
	const [tags, setTags] = useState([]);

	const [preselectItem, setPreselectItem] = useState(null);
	const [preselectPath, setPreselectPath] = useState(null);

	useHotkeys(
		"shift",
		(event, handler) => {
			if (event.type === "keydown") {
				setShowMassOperationControls(true);
			} else {
				setShowMassOperationControls(
					Object.keys(massOperationSelected).length > 0,
				);
			}
		},
		{
			keyup: true,
			keydown: true,
		},
	);

	let isSubscribed = true;
	React.useEffect(() => {
		return () => (isSubscribed = false);
	}, []);
	React.useEffect(() => {
		loadDatastore();
	}, [passwordDatastore]);

	// Add beforeunload event handler to warn user when closing tab with unsaved changes
	React.useEffect(() => {
		const handleBeforeUnload = (event) => {
			if (editEntryDirty) {
				event.preventDefault();
				event.returnValue = t("ITEM_UNSAVED_WARNING");
				return t("ITEM_UNSAVED_WARNING");
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [editEntryDirty]);

	const progressDialogOpen = progress !== 0 && progress !== 100;
	let openRequests = 0;
	let closedRequests = 0;

	const onStartProgress = () => {
		openRequests = openRequests + 1;
		setProgress(Math.round((closedRequests / openRequests) * 1000) / 10);
	};
	const onCloseProgress = () => {
		closedRequests = closedRequests + 1;
		setProgress(Math.round((closedRequests / openRequests) * 1000) / 10);
	};

	const isSelected = (item) => {
		return Object.hasOwn(massOperationSelected, item.id);
	};

	const isMovableItem = (item) => {
		return (
			!Object.hasOwn(item, "share_id") &&
			(!Object.hasOwn(item, "share_rights") ||
				item.share_rights.delete !== false)
		);
	};

	const hasSharedChild = (item) => {
		if (item.items) {
			for (const child of item.items) {
				if (Object.hasOwn(child, "share_id")) {
					return true;
				}
			}
		}

		if (item.folders) {
			for (const child of item.folders) {
				if (Object.hasOwn(child, "share_id") || hasSharedChild(child)) {
					return true;
				}
			}
		}

		return false;
	};

	const isMovableFolder = (item) => {
		return isMovableItem(item) && !hasSharedChild(item);
	};

	const hasGrantRights = (item) => {
		return !Object.hasOwn(item, "share_rights") || item.share_rights.grant;
	};

	const hasSameParent = (item, selectedItem) => {
		return (
			item.parent_datastore_id === selectedItem.parent_datastore_id &&
			item.parent_share_id === selectedItem.parent_share_id
		);
	};

	const isNestedFolderSelection = (item, selectedItem) => {
		return (
			item.id !== selectedItem.id &&
			item.is_folder &&
			selectedItem.is_folder &&
			(item.path.includes(selectedItem.id) ||
				selectedItem.path.includes(item.id))
		);
	};

	const isSelectable = (item) => {
		if (!showMassOperationControls) {
			return true;
		}
		const defaultIsSelectable = item.is_folder
			? isMovableFolder(item)
			: isMovableItem(item);
		const massOperationSelectedKeys = Object.keys(massOperationSelected);
		if (Object.hasOwn(massOperationSelected, item.id)) {
			return true;
		}
		if (massOperationSelectedKeys.length === 0) {
			return defaultIsSelectable;
		}

		const selectedItem =
			massOperationSelected[massOperationSelectedKeys[0]].item;
		if (item.is_folder !== selectedItem.is_folder) {
			return false;
		}

		for (const key of massOperationSelectedKeys) {
			if (isNestedFolderSelection(item, massOperationSelected[key].item)) {
				return false;
			}
		}

		return hasSameParent(item, selectedItem) && defaultIsSelectable;
	};

	const loadDatastore = () => {
		if (offlineCacheService.isActive() && offlineCacheService.isLocked()) {
			setUnlockOfflineCache(true);
		} else {
			datastorePasswordService
				.getPasswordDatastore()
				.then(onNewDatastoreLoaded);
		}
	};

	const onUnlockOfflineCacheClosed = () => {
		setUnlockOfflineCache(false);
		datastorePasswordService.getPasswordDatastore().then(onNewDatastoreLoaded);
	};

	const onNewDatastoreLoaded = (data) => {
		if (!isSubscribed) {
			return;
		}
		setDatastore(data);
		setTags(datastorePasswordService.getTags(data));

		if (typeof secretType === "undefined") {
			return;
		}
		const paths = datastorePasswordService.searchInDatastore(
			secretId,
			data,
			(secretId, item) =>
				Object.hasOwn(item, "secret_id") && item.secret_id === secretId,
		);
		if (paths.length === 0) {
			return;
		}
		const search = datastoreService.findInDatastore(paths[0], data);
		const node = search[0][search[1]];

		onEditEntry(node, paths[0]);
	};

	let newSecurityReport = "NOT_REQUIRED";
	if (recurrenceInterval > 0 && !disableCentralSecurityReports) {
		if (
			Object.hasOwn(serverStatus, "data") &&
			Object.hasOwn(serverStatus.data, "last_security_report_created") &&
			serverStatus.data.last_security_report_created !== null
		) {
			const lastSecurityReportAgeSeconds = differenceInSeconds(
				new Date(),
				new Date(serverStatus.data.last_security_report_created),
			);

			if (lastSecurityReportAgeSeconds > recurrenceInterval) {
				newSecurityReport = "REQUIRED";
			} else {
				const days_28 = 28 * 24 * 3600;
				const days_14 = 14 * 24 * 3600;
				if (
					recurrenceInterval >= days_28 &&
					lastSecurityReportAgeSeconds > recurrenceInterval - days_14
				) {
					newSecurityReport = "SOON_REQUIRED";
				} else {
					newSecurityReport = "NOT_REQUIRED";
				}
			}
		} else {
			newSecurityReport = "REQUIRED";
		}
	}

	const onShare = (node, path) => {
		setRightsOverviewData({
			item: node,
			path: path,
		});
		setRightsOverviewOpen(true);
		// called whenever someone clicks on a new folder Icon
		// setNewShareOpen(true);
		// setNewShareData({
		//     node: node,
		//     path: path,
		// });
	};

	const onNewFolderCreate = (name, color) => {
		// called once someone clicked the CREATE button in the dialog closes with the new name
		widget.newFolderSave(
			newFolderData["parent"],
			newFolderData["path"],
			datastore,
			datastorePasswordService,
			name,
			color,
		);
		setNewFolderOpen(false);
	};
	const onNewFolder = (parent, path) => {
		onContextMenuClose();
		// called whenever someone clicks on a new folder Icon
		setNewFolderOpen(true);
		setNewFolderData({
			parent: parent,
			path: path,
		});
	};

	const onNewEntryCreate = (item) => {
		// called once someone clicked the CREATE button in the dialog closes with the new name
		widget.newItemSave(
			item,
			datastore,
			newEntryData["parent"],
			newEntryData["path"],
			datastorePasswordService,
		);
		setNewEntryOpen(false);
	};
	const onNewEntry = (parent, path) => {
		onContextMenuClose();
		// called whenever someone clicks on a new entry Icon
		setNewEntryOpen(true);

		let parentShareId = parent.parent_share_id;
		let parentDatastoreId = parent.parent_datastore_id;

		if (Object.hasOwn(parent, "datastore_id")) {
			parentShareId = undefined;
			parentDatastoreId = parent.datastore_id;
		} else if (Object.hasOwn(parent, "share_id")) {
			parentShareId = parent.share_id;
			parentDatastoreId = undefined;
		}
		setNewEntryData({
			parent: parent,
			path: path,
			parentShareId: parentShareId,
			parentDatastoreId: parentDatastoreId,
		});
	};

	const onEditFolderSave = (node) => {
		setEditFolderOpen(false);
		widget.editFolderSave(
			node,
			editFolderData.path,
			datastore,
			datastorePasswordService,
		);
	};
	const onEditFolder = (node, path) => {
		setEditFolderData({
			node: node,
			path: path,
		});
		setEditFolderOpen(true);
	};

	const onEditEntrySave = (node) => {
		setEditEntryOpen(false);
		setEditEntryDirty(false);
		widget.editItemSave(
			datastore,
			node,
			editEntryData.path,
			datastorePasswordService,
		);
	};

	const onCloseEdit = () => {
		if (
			editEntryDirty &&
			getStore().getState().settingsDatastore.confirmOnUnsavedChanges
		) {
			setEditEntryConfirmDialog(true);
		} else {
			setEditEntryOpen(false);
			setEditEntryDirty(false);
		}
	};

	const verifyConfirmDialog = () => {
		setEditEntryDirty(false);

		if (preselectItem != null) {
			setEditEntryData({
				item: preselectItem,
				path: preselectPath,
			});
			setPreselectItem(null);
			setPreselectPath(null);
			setEditEntryOpen(true);
		} else {
			setEditEntryOpen(false);
		}
		setEditEntryConfirmDialog(false);
	};

	const onEditEntry = (item, path) => {
		if (editEntryOpen && editEntryDirty) {
			setEditEntryConfirmDialog(true);
			setPreselectItem(item);
			setPreselectPath(path);
		} else {
			setEditEntryData({
				item: item,
				path: path,
			});
			setEditEntryOpen(true);
		}
	};

	const onSelectEntry = (item, path) => {
		if (showMassOperationControls) {
			const newMassOperationSelected = {
				...massOperationSelected,
			};
			if (Object.hasOwn(newMassOperationSelected, item.id)) {
				delete newMassOperationSelected[item.id];
			} else {
				newMassOperationSelected[item.id] = { item: item, path: path };
			}

			setMassOperationSelected(newMassOperationSelected);
			if (Object.keys(newMassOperationSelected).length === 0) {
				setShowMassOperationControls(false);
			}
		} else {
			onEditEntry(item, path);
		}
	};

	const onCloneEntry = async (item, path) => {
		await widget.cloneItem(datastore, item, path);
		loadDatastore();
	};

	const onDeleteEntry = async (item, path) => {
		await widget.markItemAsDeleted(datastore, path, "password");
		forceUpdate();
	};

	const onDeleteFolder = async (item, path) => {
		await widget.markItemAsDeleted(datastore, path, "password");
		forceUpdate();
	};

	const onDeleteItemFromEditModal = async () => {
		await widget.markItemAsDeleted(datastore, editEntryData.path, "password");
		forceUpdate();
	};

	const onLinkItem = (item, path) => {
		if (item.type === "file") {
			return fileTransferService.onItemClick(item);
		} else {
			return secretService.onItemClick(item);
		}
	};

	const onMoveFolder = (item, path) => {
		setMoveFolderData([
			{
				item: item,
				path: path,
			},
		]);
	};

	const onSelectNodeForMoveFolder = async (breadcrumbs) => {
		for (const index in moveFolderData) {
			await widgetService.moveItem(
				datastore,
				moveFolderData[index].path,
				breadcrumbs["id_breadcrumbs"],
				"folders",
				"password",
				onStartProgress,
				onCloseProgress,
			);
		}
		setMoveFolderData([]);
		setShowMassOperationControls(false);
		setMassOperationSelected({});
		loadDatastore();
	};

	const isSelectableForMoveFolder = (node) => {
		// filter out targets that the folder itself or are inside of that folder
		for (const folderData of moveFolderData) {
			if (node.path.includes(folderData.item.id)) {
				return false;
			}
		}
		// filter out all targets that are a share if the item is not allowed to be shared
		for (const folderData of moveFolderData) {
			if (!hasGrantRights(folderData.item) && node.share_id) {
				return false;
			}
		}
		// filter out all targets that are inside of a share if the item is not allowed to be shared
		for (const folderData of moveFolderData) {
			if (!hasGrantRights(folderData.item) && node.parent_share_id) {
				return false;
			}
		}
		//
		if (
			Object.hasOwn(node, "share_id") &&
			!Object.hasOwn(node, "share_rights")
		) {
			return false;
		}
		if (!Object.hasOwn(node, "share_rights")) {
			return true;
		}
		// we need both read and write permission on the target folder in order to update it with the new content
		if (node.share_rights.read && node.share_rights.write) {
			return true;
		}
		return false;
	};

	const onMoveEntry = (item, path) => {
		setMoveEntryData([
			{
				item: item,
				path: path,
			},
		]);
	};

	const onSelectNodeForMoveEntry = async (breadcrumbs) => {
		for (const index in moveEntryData) {
			onStartProgress();
		}

		for (const index in moveEntryData) {
			await widgetService.moveItem(
				datastore,
				moveEntryData[index].path,
				breadcrumbs["id_breadcrumbs"],
				"items",
				"password",
			);
			onCloseProgress();
		}
		setMoveEntryData([]);
		setShowMassOperationControls(false);
		setMassOperationSelected({});
		loadDatastore();
	};

	const isSelectableForMoveEntry = (node) => {
		// filter out all targets that are a share if the item is not allowed to be shared
		// yet don't filter out entries that are just moved within a share
		if (
			!moveEntryData[0].item.share_rights.grant &&
			node.share_id &&
			(!moveEntryData[0].item.parent_share_id ||
				moveEntryData[0].item.parent_share_id !== node.share_id)
		) {
			return false;
		}
		// filter out all targets that are inside of a share if the item is not allowed to be shared
		// yet don't filter out entries that are just moved within a share
		if (
			!moveEntryData[0].item.share_rights.grant &&
			node.parent_share_id &&
			(!moveEntryData[0].item.parent_share_id ||
				moveEntryData[0].item.parent_share_id !== node.parent_share_id)
		) {
			return false;
		}
		//
		if (
			Object.hasOwn(node, "share_id") &&
			!Object.hasOwn(node, "share_rights")
		) {
			return false;
		}
		if (!Object.hasOwn(node, "share_rights")) {
			return true;
		}
		// we need both read and write permission on the target folder in order to update it with the new content
		if (node.share_rights.read && node.share_rights.write) {
			return true;
		}
		return false;
	};

	const onLinkShare = (item, path) => {
		setCreateLinkShareData({
			item: item,
		});
		setCreateLinkShareOpen(true);
	};
	const onContextMenu = (event) => {
		event.preventDefault();
		event.stopPropagation();
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

	const toggleShowFilter = () => {
		action().setShowFilters(!showFilters);
	};

	const toggleFilter = (key) => {
		setSelectedFilters((prev) => {
			const newSelectedFilters = {
				//...prev, deselect others
			};
			if (!prev[key]) {
				newSelectedFilters[key] = !prev[key];
			}
			return newSelectedFilters;
		});
	};

	const filters = [
		{
			label: t("ENTRY_TYPES"),
			options: itemBlueprintService.getEntryTypes(true, false).map((e) => {
				return {
					key: `entry_type:${e.value}`,
					label: t(e.title),
				};
			}),
		},
	];
	if (tags.length > 0) {
		filters.push({
			label: t("TAGS"),
			options: tags.map((tag) => {
				return {
					key: `tag:${tag}`,
					label: tag,
				};
			}),
		});
	}

	return (
		<Base {...props}>
			<BaseTitle>{t("DATASTORE")}</BaseTitle>
			<BaseContent>
				<Grid container spacing={1}>
					<Grid item xs={bigScreen && editEntryOpen ? 6 : 12}>
						<Paper square>
							<AppBar elevation={0} position="static" color="default">
								<DatastoreToolbar
									hasMassOperationSelected={
										Object.keys(massOperationSelected).length > 0
									}
									onMassMove={() => {
										const selectedItems = Object.keys(
											massOperationSelected,
										).map((key) => massOperationSelected[key]);
										if (selectedItems[0].item.is_folder) {
											setMoveFolderData(selectedItems);
										} else {
											setMoveEntryData(selectedItems);
										}
									}}
									onMassDelete={async () => {
										for (const key in massOperationSelected) {
											if (!Object.hasOwn(massOperationSelected, key)) {
												continue;
											}
											onStartProgress();
										}

										for (const key in massOperationSelected) {
											if (!Object.hasOwn(massOperationSelected, key)) {
												continue;
											}
											await onDeleteEntry(
												massOperationSelected[key].item,
												massOperationSelected[key].path,
											);
											onCloseProgress();
										}
										setMassOperationSelected({});
										setShowMassOperationControls(false);
									}}
									search={search}
									setSearch={setSearch}
									toggleShowFilter={toggleShowFilter}
									filterCount={
										Object.keys(selectedFilters).filter(
											(key) => selectedFilters[key],
										).length
									}
									datastore={datastore}
									onNewFolder={() => onNewFolder(datastore, [])}
									onNewEntry={() => onNewEntry(datastore, [])}
									newSecurityReportRequired={newSecurityReport !== "REQUIRED"}
								/>
							</AppBar>
							<div
								className={classes.root}
								onContextMenu={
									newSecurityReport === "REQUIRED" ? null : onContextMenu
								}
							>
								<Grid
									container
									className={`${(showFilters && bigScreen && !editEntryOpen) || (showFilters && hugeScreen) ? classes.contentShift : ""}`}
								>
									<Grid item xs={12} sm={12} md={12}>
										<AlertSecurityReport
											className={classes.securityReportAlert}
										/>
									</Grid>
									<Grid item xs={12} sm={12} md={12}>
										{!datastore && newSecurityReport !== "REQUIRED" && (
											<div className={classes.loader}>
												<ClipLoader />
											</div>
										)}
										{datastore && newSecurityReport !== "REQUIRED" && (
											<DatastoreTree
												datastore={datastore}
												setDatastore={setDatastore}
												search={search}
												onNewFolder={onNewFolder}
												onNewEntry={onNewEntry}
												onShare={onShare}
												onEditEntry={onEditEntry}
												onCloneEntry={onCloneEntry}
												onDeleteEntry={onDeleteEntry}
												onEditFolder={onEditFolder}
												onDeleteFolder={onDeleteFolder}
												onSelectItem={onSelectEntry}
												onLinkItem={onLinkItem}
												onLinkShare={onLinkShare}
												onMoveFolder={onMoveFolder}
												onMoveEntry={onMoveEntry}
												allowMultiselect={showMassOperationControls}
												isSelected={isSelected}
												isSelectable={isSelectable}
												deleteFolderLabel={t("MOVE_TO_TRASH")}
												deleteItemLabel={t("MOVE_TO_TRASH")}
												selectedFilters={selectedFilters}
												showImportAction={true}
											/>
										)}
										<FilterSideBar
											open={showFilters}
											onClose={() => action().setShowFilters(false)}
											filters={filters}
											toggleFilter={toggleFilter}
											selectedFilters={selectedFilters}
										/>
									</Grid>
								</Grid>
							</div>
							<Menu
								keepMounted
								open={contextMenuPosition.mouseY !== null}
								onClose={onContextMenuClose}
								anchorReference="anchorPosition"
								anchorPosition={
									contextMenuPosition.mouseY !== null &&
									contextMenuPosition.mouseX !== null
										? {
												top: contextMenuPosition.mouseY,
												left: contextMenuPosition.mouseX,
											}
										: undefined
								}
								onContextMenu={(event) => {
									event.preventDefault();
									event.stopPropagation();
								}}
							>
								<MenuItem onClick={() => onNewFolder(datastore, [])}>
									<ListItemIcon className={classes.listItemIcon}>
										<CreateNewFolderIcon
											className={classes.icon}
											fontSize="small"
										/>
									</ListItemIcon>
									<Typography variant="body2" noWrap>
										{t("NEW_FOLDER")}
									</Typography>
								</MenuItem>
								<MenuItem onClick={() => onNewEntry(datastore, [])}>
									<ListItemIcon className={classes.listItemIcon}>
										<AddIcon className={classes.icon} fontSize="small" />
									</ListItemIcon>
									<Typography variant="body2" noWrap>
										{t("NEW_ENTRY")}
									</Typography>
								</MenuItem>
							</Menu>
							{newFolderOpen && (
								<DialogNewFolder
									open={newFolderOpen}
									onClose={() => setNewFolderOpen(false)}
									onCreate={onNewFolderCreate}
								/>
							)}
							{newEntryOpen && (
								<DialogNewEntry
									open={newEntryOpen}
									onClose={() => setNewEntryOpen(false)}
									onCreate={onNewEntryCreate}
									parentDatastoreId={newEntryData.parentDatastoreId}
									parentShareId={newEntryData.parentShareId}
								/>
							)}
							{editFolderOpen && (
								<DialogEditFolder
									open={editFolderOpen}
									onClose={() => setEditFolderOpen(false)}
									onSave={onEditFolderSave}
									node={editFolderData.node}
								/>
							)}
							{editEntryOpen && !bigScreen && (
								<DialogEditEntry
									open={editEntryOpen}
									onClose={() => setEditEntryOpen(false)}
									onEdit={onEditEntrySave}
									setDirty={setEditEntryDirty}
									isDirty={editEntryDirty}
									item={editEntryData.item}
									onDeleteItem={onDeleteItemFromEditModal}
									getShowConfirmDialog={getEditEntryConfirmDialog}
									setConfirmDialog={setEditEntryConfirmDialog}
								/>
							)}
							{createLinkShareOpen && (
								<DialogCreateLinkShare
									open={createLinkShareOpen}
									onClose={() => setCreateLinkShareOpen(false)}
									item={createLinkShareData.item}
								/>
							)}
							{rightsOverviewOpen && (
								<DialogRightsOverview
									open={rightsOverviewOpen}
									onClose={() => setRightsOverviewOpen(false)}
									item={rightsOverviewData.item}
									path={rightsOverviewData.path}
								/>
							)}
							{moveEntryData.length > 0 && (
								<DialogSelectFolder
									open={moveEntryData.length > 0}
									onClose={() => setMoveEntryData([])}
									title={t("MOVE_ENTRY")}
									onSelectNode={onSelectNodeForMoveEntry}
									isSelectable={isSelectableForMoveEntry}
								/>
							)}
							{moveFolderData.length > 0 && (
								<DialogSelectFolder
									open={moveFolderData.length > 0}
									onClose={() => setMoveFolderData([])}
									title={t("MOVE_FOLDER")}
									onSelectNode={onSelectNodeForMoveFolder}
									isSelectable={isSelectableForMoveFolder}
								/>
							)}
							{unlockOfflineCache && (
								<DialogUnlockOfflineCache
									open={unlockOfflineCache}
									onClose={onUnlockOfflineCacheClosed}
								/>
							)}
							{error !== null && (
								<DialogError
									open={error !== null}
									onClose={() => setError(null)}
									title={error.title}
									description={error.description}
								/>
							)}
						</Paper>
					</Grid>
					{bigScreen && editEntryOpen && (
						<Grid item xs={6}>
							{editEntryOpen && (
								<DialogEditEntry
									open={editEntryOpen}
									onClose={onCloseEdit}
									onEdit={onEditEntrySave}
									item={editEntryData.item}
									onDeleteItem={onDeleteItemFromEditModal}
									inline={true}
									setDirty={setEditEntryDirty}
									isDirty={editEntryDirty}
									getShowConfirmDialog={getEditEntryConfirmDialog}
									setConfirmDialog={setEditEntryConfirmDialog}
								/>
							)}
						</Grid>
					)}
				</Grid>

				{progressDialogOpen && (
					<DialogProgress
						percentageComplete={progress}
						open={progressDialogOpen}
					/>
				)}

				{editEntryConfirmDialog && (
					<DialogVerify
						title={"DATA_CHANGED"}
						description={"ITEM_UNSAVED_WARNING"}
						open={editEntryConfirmDialog}
						onClose={() => verifyConfirmDialog()}
						onConfirm={() => setEditEntryConfirmDialog(false)}
						close={"DISCARD"}
						confirm={"RETURN"}
					/>
				)}
			</BaseContent>
		</Base>
	);
};

export default DatastoreView;
