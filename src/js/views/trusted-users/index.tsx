import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import type {
	AccountViewProps,
	ContextMenuPosition,
	EditTrustedEntryData,
	EditTrustedFolderData,
	NewTrustedNodeData,
} from "../../../types/account-ui";
import type {
	Datastore,
	DatastoreItem,
	DatastorePath,
	UserDatastoreItem,
} from "../../../types/datastore";
import type { SharingUser } from "../../../types/sharing-ui";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AppBar from "@mui/material/AppBar";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import { alpha } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { makeStyles } from "@mui/styles";
import React, { useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { ClipLoader } from "react-spinners";
import Base from "../../components/base";
import BaseContent from "../../components/base-content";
import BaseTitle from "../../components/base-title";
import DatastoreTree from "../../components/datastore-tree";
import DialogEditFolder from "../../components/dialogs/edit-folder";
import DialogEditUser from "../../components/dialogs/edit-user";
import DialogNewFolder from "../../components/dialogs/new-folder";
import DialogNewUser from "../../components/dialogs/new-user";
import Search from "../../components/search";
import datastorePassword from "../../services/datastore-password";
import datastoreUser from "../../services/datastore-user";
import datastoreUserService from "../../services/datastore-user";
import widget from "../../services/widget";

const useStyles = makeStyles((theme) => ({
	root: {
		display: "flex",
		padding: "15px",
	},
	loader: {
		textAlign: "center",
		marginTop: "30px",
		marginBottom: "30px",
		margin: "auto",
	},
	toolbarRoot: {
		backgroundColor: theme.palette.baseTitleBackground.main,
		display: "flex",
	},
	toolbarTitle: {
		display: "none",
		[theme.breakpoints.up("sm")]: {
			display: "block",
		},
	},
	search: {
		borderRadius: theme.shape.borderRadius,
		backgroundColor: alpha(theme.palette.lightBackground.main, 0.25),
		"&:hover": {
			backgroundColor: alpha(theme.palette.lightBackground.main, 0.45),
		},
		marginLeft: "auto",
		[theme.breakpoints.up("sm")]: {
			marginRight: theme.spacing(1),
		},
	},
	inputRoot: {
		color: "inherit",
	},
	inputInput: {
		padding: theme.spacing(1, 1, 1, 0),
		fontSize: "0.875em",
		// vertical padding + font size from searchIcon
		paddingLeft: "1em",
		transition: theme.transitions.create("width"),
		width: "100%",
		[theme.breakpoints.up("sm")]: {
			width: "12ch",
			"&:focus": {
				width: "20ch",
			},
		},
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
	icon: {
		fontSize: "18px",
	},
	listItemIcon: {
		minWidth: theme.spacing(4),
	},
}));

const TrustedUsersView = (props: AccountViewProps) => {
	const classes = useStyles();
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const [contextMenuPosition, setContextMenuPosition] =
		useState<ContextMenuPosition>({
			mouseX: null,
			mouseY: null,
		});

	const [newFolderOpen, setNewFolderOpen] = useState(false);
	const [newFolderData, setNewFolderData] = useState<
		Partial<NewTrustedNodeData>
	>({});

	const [newUserOpen, setNewUserOpen] = useState(false);
	const [newUserData, setNewUserData] = useState<Partial<NewTrustedNodeData>>(
		{},
	);

	const [editFolderOpen, setEditFolderOpen] = useState(false);
	const [editFolderData, setEditFolderData] = useState<
		Partial<EditTrustedFolderData>
	>({});

	const [editEntryOpen, setEditEntryOpen] = useState(false);
	const [editEntryData, setEditEntryData] = useState<
		Partial<EditTrustedEntryData>
	>({});
	const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

	const [datastore, setDatastore] = useState<Awaited<
		ReturnType<typeof datastoreUser.getUserDatastore>
	> | null>(null);

	let isSubscribed = true;
	React.useEffect(() => {
		datastoreUser.getUserDatastore().then(onNewDatastoreLoaded);
		return () => {
			isSubscribed = false;
		};
	}, []);

	const onNewDatastoreLoaded = (
		data: Awaited<ReturnType<typeof datastoreUser.getUserDatastore>>,
	) => {
		if (!isSubscribed) {
			return;
		}
		setDatastore(data);
	};

	const openMenu = (event: React.MouseEvent<HTMLElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setAnchorEl(event.currentTarget);
	};

	const handleClose = (event: React.SyntheticEvent) => {
		event.preventDefault();
		event.stopPropagation();
		setAnchorEl(null);
	};

	const onCreateFolder = (event: React.MouseEvent<HTMLElement>) => {
		handleClose(event);
		onNewFolder(undefined, []);
	};

	const onNewFolderCreate = (name: string, color?: string | null) => {
		// called once someone clicked the CREATE button in the dialog closes with the new name
		setNewFolderOpen(false);
		widget.newFolderSave(
			newFolderData["parent"],
			newFolderData["path"]!,
			datastore!,
			datastorePassword,
			name,
			color,
		);
	};
	const onNewFolder = (parent: Datastore | undefined, path: DatastorePath) => {
		onContextMenuClose();
		setAnchorEl(null);
		// called whenever someone clicks on a new folder Icon
		setNewFolderData({
			parent: parent,
			path: path,
		});
		setNewFolderOpen(true);
	};

	const onCreateUser = (event: React.MouseEvent<HTMLElement>) => {
		handleClose(event);
		onNewUser(undefined, []);
	};

	const onNewUserCreate = (userObject: UserDatastoreItem) => {
		// called once someone clicked the CREATE button in the dialog closes with the infos about the user
		setNewUserOpen(false);

		let parent;
		if (newUserData["parent"]) {
			parent = newUserData["parent"];
		} else {
			parent = datastore;
		}

		datastoreUserService.addUserToDatastore(datastore!, userObject, parent!);
	};
	const onNewUser = (parent: Datastore | undefined, path: DatastorePath) => {
		onContextMenuClose();
		setAnchorEl(null);
		// called whenever someone clicks on a new folder Icon
		setNewUserData({
			parent: parent,
			path: path,
		});
		setNewUserOpen(true);
	};

	const onEditFolderSave = (node: EditTrustedFolderData["node"]) => {
		setEditFolderOpen(false);
		widget.editFolderSave(
			node,
			editFolderData.path!,
			datastore!,
			datastoreUser,
		);
	};
	const onEditFolder = (node: Datastore, path: DatastorePath) => {
		setEditFolderData({
			node: node as EditTrustedFolderData["node"],
			path: path,
		});
		setEditFolderOpen(true);
	};

	const onEditEntrySave = () => {
		setEditEntryOpen(false);
		datastoreUser.saveDatastoreContent(datastore!);
	};
	const onEditEntry = (item: DatastoreItem, path: DatastorePath) => {
		setEditEntryData({
			// The trusted-user datastore supplies the identity fields used by the dialog.
			item: item as SharingUser,
			path: path,
		});
		setEditEntryOpen(true);
	};

	const onDeleteEntry = (item: DatastoreItem, path: DatastorePath) => {
		widget.deleteItemPermanent(datastore!, path, "user");
		forceUpdate();
	};

	const onDeleteFolder = (item: Datastore, path: DatastorePath) => {
		widget.deleteItemPermanent(datastore!, path, "user");
		forceUpdate();
	};
	const onContextMenu = (event: React.MouseEvent<HTMLElement>) => {
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

	return (
		<Base {...props}>
			<BaseTitle>{t("TRUSTED_USERS")}</BaseTitle>
			<BaseContent>
				<Paper square>
					<AppBar elevation={0} position="static" color="default">
						<Toolbar className={classes.toolbarRoot}>
							<span className={classes.toolbarTitle}>{t("TRUSTED_USERS")}</span>
							<div className={classes.search}>
								<Search
									value={search}
									onChange={(newValue: string) => {
										setSearch(newValue);
									}}
								/>
								<Divider className={classes.divider} orientation="vertical" />
								<IconButton
									color="primary"
									className={classes.iconButton}
									aria-label="menu"
									onClick={openMenu}
									size="large"
								>
									<MenuOpenIcon />
								</IconButton>
								<Menu
									id="simple-menu"
									anchorEl={anchorEl}
									keepMounted
									open={Boolean(anchorEl)}
									onClose={handleClose}
									onContextMenu={(event) => {
										event.preventDefault();
										event.stopPropagation();
									}}
								>
									<MenuItem onClick={onCreateFolder}>
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
									<MenuItem onClick={onCreateUser}>
										<ListItemIcon className={classes.listItemIcon}>
											<PersonAddIcon
												className={classes.icon}
												fontSize="small"
											/>
										</ListItemIcon>
										<Typography variant="body2" noWrap>
											{t("SEARCH_USER")}
										</Typography>
									</MenuItem>
								</Menu>
							</div>
						</Toolbar>
					</AppBar>
					<div className={classes.root} onContextMenu={onContextMenu}>
						{!datastore && (
							<div className={classes.loader}>
								<ClipLoader />
							</div>
						)}
						{datastore && (
							<DatastoreTree
								datastore={datastore}
								setDatastore={setDatastore}
								search={search}
								onNewFolder={onNewFolder}
								onNewUser={onNewUser}
								onEditEntry={onEditEntry}
								onEditFolder={onEditFolder}
								onDeleteEntry={onDeleteEntry}
								onDeleteFolder={onDeleteFolder}
								onSelectItem={onEditEntry}
								deleteFolderLabel={t("DELETE")}
								deleteItemLabel={t("DELETE")}
								datastoreContext="trusted-users"
							/>
						)}
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
						<MenuItem onClick={onCreateFolder}>
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
						<MenuItem onClick={onCreateUser}>
							<ListItemIcon className={classes.listItemIcon}>
								<PersonAddIcon className={classes.icon} fontSize="small" />
							</ListItemIcon>
							<Typography variant="body2" noWrap>
								{t("SEARCH_USER")}
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
					{newUserOpen && (
						<DialogNewUser
							open={newUserOpen}
							onClose={() => setNewUserOpen(false)}
							onCreate={onNewUserCreate}
						/>
					)}
					{editFolderOpen && (
						<DialogEditFolder
							open={editFolderOpen}
							onClose={() => setEditFolderOpen(false)}
							onSave={onEditFolderSave}
							node={editFolderData.node!}
						/>
					)}
					{editEntryOpen && (
						<DialogEditUser
							open={editEntryOpen}
							onClose={() => setEditEntryOpen(false)}
							onSave={onEditEntrySave}
							item={editEntryData.item!}
						/>
					)}
				</Paper>
			</BaseContent>
		</Base>
	);
};

export default TrustedUsersView;
