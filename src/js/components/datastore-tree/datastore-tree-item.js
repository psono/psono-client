import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import GetAppIcon from "@mui/icons-material/GetApp";
import LinkIcon from "@mui/icons-material/Link";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import OpenWithIcon from "@mui/icons-material/OpenWith";
import SettingsIcon from "@mui/icons-material/Settings";
import ShareIcon from "@mui/icons-material/Share";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { makeStyles } from "@mui/styles";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import secretService from "../../services/secret";
import { getStore } from "../../services/store";
import widgetService from "../../services/widget";
import EntryIcon from "../entry-icon";
import ContentCopy from "../icons/ContentCopy";
import GatewayLaunchButton from "../gateway-launch-button";

const useStyles = makeStyles((theme) => ({
	treeItem: {
		position: "relative",
		height: "34px",
		lineHeight: "34px",
		cursor: "pointer",
		margin: 0,
		padding: "5px 3px",
		border: "1px solid #FFF",
		display: "block",
		textDecoration: "none",
		flexGrow: 1,
		paddingRight: "120px",
		"&:hover, &:focus": {
			backgroundColor: "#F0F7FC",
			outline: "none",
			textDecoration: "none",
		},
		"&::before": {
			display: "inline-block",
			content: '""',
			position: "absolute",
			top: "20px",
			left: "-13px",
			width: "12px",
			height: 0,
			borderTop: `1px dotted ${theme.palette.blueBackground.main}`,
			zIndex: 1,
		},
		"&.selected": {
			backgroundColor: "inherit",
			borderColor: theme.palette.lightBackground.main,
			borderRadius: "4px",
			"&:hover": {
				backgroundColor: "#F0F7FC",
			},
		},
	},
	treeItemObject: {
		display: "block",
		position: "relative",
		whiteSpace: "nowrap",
		overflow: "hidden",
	},
	treeItemName: {
		display: "inline-block",
		flexGrow: 1,
		flexShrink: 1,
		minWidth: 0,
		overflow: "hidden",
		whiteSpace: "nowrap",
		textOverflow: "ellipsis",
		verticalAlign: "middle",
		lineHeight: "16px",
	},
	treeItemDescription: {
		fontSize: "12px",
		lineHeight: "13px",
		color: theme.palette.greyText.main,
	},
	faStack: {
		display: "inline-block",
		verticalAlign: "middle",
	},
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
	nodeOpenLink: {
		position: "absolute",
		right: 0,
		top: "50%",
		transform: "translateY(-50%)",
		display: "flex",
		alignItems: "center",
		zIndex: 2,
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
		if (
			Object.hasOwn(content, "share_rights") &&
			content.share_rights.read === false
		) {
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

	const onCopyUrl = (event) => {
		handleClose(event);
		secretService.copyUrl(content);
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
		props.onDeleteEntry(content, content.path);
	};
	const selectItem = (event) => {
		event.stopPropagation();
		if (props.onSelectItem && isSelectable) {
			props.onSelectItem(content, content.path, props.nodePath);
		}
	};
	const linkItem = (event) => {
		event.stopPropagation();
		if (props.onLinkItem) {
			props.onLinkItem(content, content.path, props.nodePath);
		}
	};

	const hideNewShare =
		(getStore().getState().server.complianceDisableShares &&
			!Object.hasOwn(content, "share_id")) ||
		offline ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights.grant === false) ||
		content.type === "user" ||
		!props.onShare;
	const hideRightsOverview =
		offline ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights.grant === false) ||
		!Object.hasOwn(content, "share_id") ||
		typeof content.share_id === "undefined";
	const hideShare = hideNewShare && hideRightsOverview;
	const hideLinkShare =
		offline ||
		!Object.hasOwn(content, "type") ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights.read === false) ||
		getStore().getState().server.complianceDisableLinkShares ||
		content.type === "user" ||
		!props.onLinkShare;
	const hideCopyTotpToken =
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights.read !== true) ||
		!Object.hasOwn(content, "type") ||
		!["website_password", "totp"].includes(content.type);
	const hideCopyUsername =
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights.read !== true) ||
		!Object.hasOwn(content, "type") ||
		![
			"website_password",
			"application_password",
			"ssh_connection",
			"rdp_connection",
			"vnc_connection",
		].includes(content.type);
	const hideCopyPassword =
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights.read !== true) ||
		!Object.hasOwn(content, "type") ||
		![
			"website_password",
			"application_password",
			"ssh_connection",
			"rdp_connection",
			"vnc_connection",
		].includes(content.type);
	const hideCopyUrl =
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights.read !== true) ||
		!Object.hasOwn(content, "type") ||
		!["website_password", "bookmark"].includes(content["type"]);
	const hideEdit =
		offline ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights.write === false) ||
		!props.onEditEntry;
	const hideShow =
		!hideEdit ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights.read === false) ||
		!props.onEditEntry;
	const hideClone =
		offline ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights.write === false) ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights.read === false) ||
		content.type === "file" ||
		content.type === "user" ||
		!props.onCloneEntry;
	const hideMove =
		offline ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights.delete === false) ||
		!props.onMoveEntry;
	const hideDelete =
		offline ||
		(Object.hasOwn(content, "share_rights") &&
			content.share_rights.delete === false) ||
		!props.onDeleteEntry;
	const disableMenu =
		hideLinkShare &&
		hideShare &&
		hideCopyTotpToken &&
		hideCopyUsername &&
		hideCopyPassword &&
		hideCopyUrl &&
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

	let description = "";
	if (
		Object.hasOwn(content, "description") &&
		content.description &&
		(!content.name ||
			!content.name.toLowerCase().includes(content.description.toLowerCase()))
	) {
		description = content.description;
	}

	return (
		<div className={classes.treeItem}>
			<div
				className={
					classes.treeItemObject + (isSelectable ? "" : " notSelectable")
				}
				onClick={selectItem}
				onContextMenu={onContextMenu}
			>
				<span className={`fa-stack ${classes.faStack}`}>
					<EntryIcon
						key={content.secret_id || content.file_id}
						entry={content}
					/>
					{content.share_id && (
						<i
							className={`fa fa-circle fa-stack-2x text-danger ${classes.faCircleShared}`}
						/>
					)}
					{content.share_id && (
						<i className={`fa fa-group fa-stack-2x ${classes.faGroupShared}`} />
					)}
				</span>
				{props.allowMultiselect && props.isSelected(content) && (
					<i className={"fa fa-check-square-o" + " " + classes.iconCheckbox} />
				)}
				{props.allowMultiselect && !props.isSelected(content) && (
					<i className={"fa fa-square-o" + " " + classes.iconCheckbox} />
				)}
				<div className={classes.treeItemName}>
					{content.name}
					<br />
					<span className={classes.treeItemDescription}>
						{description ? ` ${description}` : ""}
					</span>
				</div>
			</div>
			<ButtonGroup
				variant="text"
				aria-label="outlined button group"
				className={classes.nodeOpenLink}
			>
				<GatewayLaunchButton item={content} offline={offline} />
				{Boolean(props.onLinkItem) &&
					["bookmark", "website_password", "elster_certificate"].indexOf(
						content.type,
					) !== -1 && (
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
				{!hideCopyUrl && (
					<MenuItem onClick={onCopyUrl}>
						<ListItemIcon className={classes.listItemIcon}>
							<ContentCopy className={classes.icon} fontSize="small" />
						</ListItemIcon>
						<Typography variant="body2" noWrap>
							{t("COPY_URL")}
						</Typography>
					</MenuItem>
				)}
				{(!hideShare ||
					!hideLinkShare ||
					!hideCopyTotpToken ||
					!hideCopyUsername ||
					!hideCopyPassword ||
					!hideCopyUrl) && <Divider className={classes.divider} />}
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
				{!hideCopyUrl && (
					<MenuItem onClick={onCopyUrl}>
						<ListItemIcon className={classes.listItemIcon}>
							<ContentCopy className={classes.icon} fontSize="small" />
						</ListItemIcon>
						<Typography variant="body2" noWrap>
							{t("COPY_URL")}
						</Typography>
					</MenuItem>
				)}
				{(!hideShare ||
					!hideLinkShare ||
					!hideCopyTotpToken ||
					!hideCopyUsername ||
					!hideCopyPassword ||
					!hideCopyUrl) && <Divider className={classes.divider} />}
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
