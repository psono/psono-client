import AddIcon from "@mui/icons-material/Add";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import OpenWithIcon from "@mui/icons-material/OpenWith";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SettingsIcon from "@mui/icons-material/Settings";
import ShareIcon from "@mui/icons-material/Share";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { makeStyles } from "@mui/styles";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type {
	ContextMenuPosition,
	DatastoreTreeActions,
	DatastoreTreeFolderNode,
	DatastoreNodePath,
} from "../../../types/datastore-ui";

import folderColorService from "../../services/folder-color";
import { getStore } from "../../services/store";

const useStyles = makeStyles((theme) => ({
	treeFolder: {
		width: "auto",
		minHeight: "20px",
		position: "relative",
		"&::before": {
			content: '""',
			position: "absolute",
			top: "20px",
			left: "-13px",
			width: "12px",
			height: 0,
			borderTop: `1px dotted ${theme.palette.blueBackground.main}`,
			zIndex: 1,
		},
	},
	treeFolderHeader: {
		position: "relative",
		height: "44px",
		lineHeight: "34px",
		cursor: "pointer",
		display: "flex",
		alignItems: "center",
		width: "100%",
		boxSizing: "border-box",
		border: 0,
		background: "transparent",
		color: "inherit",
		font: "inherit",
		textAlign: "left",
		padding: "5px 3px",
		paddingRight: "120px",
		"&.selected": {
			backgroundColor: "#F0F7FC",
			borderRadius: "4px",
			borderColor: theme.palette.lightBackground.main,
		},
		"&:hover": {
			backgroundColor: "#F0F7FC",
		},
		"&:focus-visible": {
			outline: `2px solid ${theme.palette.secondary.main}`,
			outlineOffset: "-2px",
		},
		"&.notSelectable": {
			color: "#bbbbbb",
		},
	},
	treeFolderName: {
		display: "inline-block",
		minWidth: 0,
		marginLeft: "5px",
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
		verticalAlign: "middle",
		zIndex: 2,
	},
	nodeOpenLink: {
		position: "absolute",
		right: 0,
		top: "50%",
		transform: "translateY(-50%)",
		display: "flex",
		alignItems: "center",
		zIndex: 2,
	},
	faStack: {
		display: "inline-block",
		verticalAlign: "middle",
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
	divider: {
		marginTop: "8px",
		marginBottom: "8px",
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

interface DatastoreTreeFolderProps extends DatastoreTreeActions {
	content: DatastoreTreeFolderNode;
	nodePath: DatastoreNodePath;
	offline: boolean;
	isExpandedDefault: boolean;
	onUpdateExpandFolderProperty: (id: string, isExpanded: boolean) => void;
}

const DatastoreTreeFolder = (props: DatastoreTreeFolderProps) => {
	const { t } = useTranslation();
	const { content, offline, isExpandedDefault, nodePath } = props;
	const classes = useStyles();
	const isExpanded = isExpandedDefault;
	const [contextMenuPosition, setContextMenuPosition] =
		useState<ContextMenuPosition>({
			mouseX: null,
			mouseY: null,
		});
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const isSelectable = props.isSelectable ? props.isSelectable(content) : true;
	const folderColor = folderColorService.normalizeFolderColor(content.color);

	const openMenu = (event: React.MouseEvent<HTMLElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setAnchorEl(event.currentTarget);
	};

	const handleClose = (event: React.SyntheticEvent) => {
		event.preventDefault();
		event.stopPropagation();
		setAnchorEl(null);
		onContextMenuClose();
	};

	const onEdit = (event: React.MouseEvent) => {
		handleClose(event);
		props.onEditFolder!(content, content.path);
	};

	const onNewFolder = (event: React.MouseEvent) => {
		handleClose(event);
		if (props.onNewFolder) {
			props.onNewFolder(content, content.path);
		}
	};

	const onShare = (event: React.MouseEvent) => {
		handleClose(event);
		props.onShare!(content, content.path, props.nodePath);
	};

	const onNewEntry = (event: React.MouseEvent) => {
		handleClose(event);
		props.onNewEntry!(content, content.path);
	};

	const onNewUser = (event: React.MouseEvent) => {
		handleClose(event);
		props.onNewUser!(content, content.path);
	};

	const onMoveFolder = (event: React.MouseEvent) => {
		handleClose(event);
		props.onMoveFolder!(content, content.path);
	};

	const onDelete = (event: React.MouseEvent) => {
		handleClose(event);
		props.onDeleteFolder!(content, content.path);
	};

	const selectNode = (event: React.MouseEvent) => {
		event.stopPropagation();
		if (props.allowMultiselect && props.onSelectItem && isSelectable) {
			props.onSelectItem(content, content.path);
			return;
		}
		props.onUpdateExpandFolderProperty(content.id, isExpanded);
		if (props.onSelectNode && isSelectable) {
			props.onSelectNode(content, content.path, nodePath);
		}
	};
	const hideNewShare =
		(getStore().getState().server.complianceDisableShares &&
			!Object.hasOwn(content, "share_id")) ||
		offline ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights!.grant === false) ||
		!props.onShare;
	const hideRightsOverview =
		offline ||
		//(content.hasOwnProperty("share_rights") && content.share_rights.grant === false) ||
		!Object.hasOwn(content, "share_id") ||
		typeof content.share_id === "undefined";
	const hideShare = hideNewShare && hideRightsOverview;
	const hideEdit =
		offline ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights!.write === false) ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights!.read === false) ||
		!props.onEditFolder;
	const hideNewFolder =
		offline ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights!.write === false) ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights!.read === false) ||
		!props.onNewFolder;
	const hideNewEntry =
		offline ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights!.write === false) ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights!.read === false) ||
		!props.onNewEntry;
	const hideNewUser =
		offline ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights!.write === false) ||
		!props.onNewUser;
	const hideMove =
		offline ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights!.delete === false) ||
		!props.onMoveFolder;
	const hideDelete =
		offline ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights!.delete === false) ||
		!props.onDeleteFolder;
	const disableMenu =
		hideShare &&
		hideEdit &&
		hideNewFolder &&
		hideNewEntry &&
		hideNewUser &&
		hideMove &&
		hideDelete;

	const onContextMenu = (event: React.MouseEvent) => {
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
				<div>
					<button
						type="button"
						className={
							classes.treeFolderHeader + (isSelectable ? "" : " notSelectable")
						}
						onClick={selectNode}
						onContextMenu={onContextMenu}
						aria-label={content.name}
						aria-expanded={
							props.allowMultiselect && props.onSelectItem && isSelectable
								? undefined
								: isExpanded
						}
						aria-pressed={
							props.allowMultiselect && props.onSelectItem && isSelectable
								? props.isSelected!(content)
								: undefined
						}
					>
						<span className={`fa-stack ${classes.faStack}`}>
							{isExpanded && (
								<i
									className="fa-fw fa fa-folder-open"
									style={{ color: `#${folderColor}` }}
								/>
							)}
							{!isExpanded && (
								<i
									className="fa-fw fa fa-folder"
									style={{ color: `#${folderColor}` }}
								/>
							)}
							{content.share_id && (
								<i
									className={`fa fa-circle fa-stack-2x text-danger ${classes.faCircleShared}`}
								/>
							)}
							{content.share_id && (
								<i
									className={`fa fa-group fa-stack-2x ${classes.faGroupShared}`}
								/>
							)}
						</span>
						{props.allowMultiselect && props.isSelected!(content) && (
							<i
								className={"fa fa-check-square-o" + " " + classes.iconCheckbox}
							/>
						)}
						{props.allowMultiselect && !props.isSelected!(content) && (
							<i className={"fa fa-square-o" + " " + classes.iconCheckbox} />
						)}
						<span className={classes.treeFolderName}>{content.name}</span>
					</button>
					<ButtonGroup
						variant="text"
						aria-label="text button group"
						className={classes.nodeOpenLink}
					>
						<Button
							aria-label="settings"
							onClick={openMenu}
							disabled={disableMenu}
						>
							<SettingsIcon fontSize="small" />
						</Button>
					</ButtonGroup>
					<Menu
						id="simple-menu"
						anchorEl={anchorEl}
						keepMounted={false}
						open={Boolean(anchorEl)}
						onClose={(event) => handleClose(event as React.SyntheticEvent)}
						onContextMenu={(event) => {
							event.preventDefault();
							event.stopPropagation();
						}}
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
									<CreateNewFolderIcon
										className={classes.icon}
										fontSize="small"
									/>
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
						contextMenuPosition.mouseY !== null &&
						contextMenuPosition.mouseX !== null
							? {
									top: contextMenuPosition.mouseY,
									left: contextMenuPosition.mouseX,
								}
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
								<CreateNewFolderIcon
									className={classes.icon}
									fontSize="small"
								/>
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

export default DatastoreTreeFolder;
