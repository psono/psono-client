import { Grid } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { makeStyles } from "@mui/styles";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type {
	Datastore,
	DatastoreItem,
	DatastorePath,
} from "../../../types/datastore";
import type {
	GroupIndex,
	SharingFolderTarget,
} from "../../../types/sharing-ui";
import datastorePassword from "../../services/datastore-password";
import groupsService from "../../services/groups";
import statusService from "../../services/status";
import widget from "../../services/widget";
import DatastoreTree from "../datastore-tree";
import Search from "../search";
import TextFieldPath from "../text-field/path";
import TrustedUser from "../trusted-user";
import DialogNewFolder from "./new-folder";

const useStyles = makeStyles((theme) => ({
	textField: {
		width: "100%",
	},
	checked: {
		color: theme.palette.checked.main,
	},
	checkedIcon: {
		width: "20px",
		height: "20px",
		border: `1px solid ${theme.palette.greyText.main}`,
		borderRadius: "3px",
	},
	uncheckedIcon: {
		width: "0px",
		height: "0px",
		padding: "9px",
		border: `1px solid ${theme.palette.greyText.main}`,
		borderRadius: "3px",
	},
	tree: {
		marginTop: "8px",
		marginBottom: "8px",
	},
	search: {
		backgroundColor: theme.palette.lightBackground.main,
		position: "absolute",
		right: "28px",
		top: theme.spacing(2),
	},
}));

export interface DialogAcceptGroupProps {
	open: boolean;
	onClose: () => void;
	groupIndex: GroupIndex;
	groupIds: string[];
	hideUser?: boolean;
	title?: string;
}

const DialogAcceptGroup = (props: DialogAcceptGroupProps) => {
	const {
		open,
		onClose,
		groupIndex,
		groupIds,
		hideUser = false,
		title = "ACCEPT_GROUP",
	} = props;
	const { t } = useTranslation();
	const classes = useStyles();
	const [path, setPath] = useState<DatastoreItem[]>([]);
	const [newFolderOpen, setNewFolderOpen] = useState(false);
	const [newFolderData, setNewFolderData] = useState<
		Partial<SharingFolderTarget>
	>({});
	const [search, setSearch] = useState("");

	const [datastore, setDatastore] = useState<Datastore | null | undefined>(
		null,
	);

	let isSubscribed = true;
	React.useEffect(() => {
		datastorePassword.getPasswordDatastore().then(onNewDatastoreLoaded);
		// cancel subscription to useEffect
		return () => {
			isSubscribed = false;
		};
	}, []);

	const onNewDatastoreLoaded = (data: Datastore | undefined) => {
		if (!isSubscribed) {
			return;
		}
		setDatastore(data);
	};

	const onNewFolderCreate = (name: string, color: string) => {
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
		// called whenever someone clicks on a new folder Icon
		setNewFolderOpen(true);
		setNewFolderData({
			parent: parent,
			path: path,
		});
	};

	const onSelectNode = (
		parent: Datastore,
		path: DatastorePath,
		nodePath: DatastoreItem[],
	) => {
		setPath(Array.from(nodePath));
	};

	const isSelectable = (node: Datastore) => {
		// filter out all targets that are a share if the item is not allowed to be shared
		if (node.share_id) {
			return false;
		}
		// filter out all targets that are inside of a share if the item is not allowed to be shared
		if (node.parent_share_id) {
			return false;
		}
		//
		if (!Object.hasOwn(node, "share_rights")) {
			return true;
		}
		// we need both read and write permission on the target folder in order to update it with the new content
		if (node.share_rights!.read && node.share_rights!.write) {
			return true;
		}

		return false;
	};

	const onConfirm = async () => {
		const membershipIds = [];

		for (const groupId of groupIds) {
			membershipIds.push(groupIndex[groupId].membership_id);
		}

		try {
			await groupsService.acceptMembershipsAndShares(membershipIds, path);
			statusService.getStatus(true);
		} catch (e) {
			console.log(e);
		}
		onClose();
	};

	return (
		<Dialog
			fullWidth
			maxWidth={"sm"}
			open={open}
			onClose={() => {
				onClose();
			}}
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
		>
			<DialogTitle id="alert-dialog-title">
				{t(title)}
				<div className={classes.search}>
					<Search
						value={search}
						onChange={(newValue) => {
							setSearch(newValue);
						}}
					/>
				</div>
			</DialogTitle>
			<DialogContent>
				<Grid container>
					<Grid item xs={12} sm={12} md={12}>
						<TextFieldPath
							className={classes.textField}
							variant="outlined"
							margin="dense"
							size="small"
							value={path}
							setPath={setPath}
						/>
					</Grid>
					<Grid item xs={12} sm={12} md={12} className={classes.tree}>
						{datastore && (
							<DatastoreTree
								datastore={datastore}
								setDatastore={setDatastore}
								onNewFolder={onNewFolder}
								onSelectNode={onSelectNode}
								isSelectable={isSelectable}
								search={search}
								deleteFolderLabel={t("DELETE")}
								deleteItemLabel={t("DELETE")}
								datastoreContext="share"
							/>
						)}
						{newFolderOpen && (
							<DialogNewFolder
								open={newFolderOpen}
								onClose={() => setNewFolderOpen(false)}
								onCreate={onNewFolderCreate}
							/>
						)}
					</Grid>
					{!hideUser && (
						<Grid
							item
							xs={12}
							sm={12}
							md={12}
							style={{
								marginBottom: "8px",
							}}
						>
							{t("INVITED_BY")}:
						</Grid>
					)}
					{!hideUser && (
						<TrustedUser
							user_id={groupIndex[groupIds[0]].user_id}
							user_username={groupIndex[groupIds[0]].user_username}
						/>
					)}
				</Grid>
			</DialogContent>
			<DialogActions>
				<Button
					onClick={() => {
						onClose();
					}}
				>
					{t("CLOSE")}
				</Button>
				<Button onClick={onConfirm} variant="contained" color="primary">
					{t("OK")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default DialogAcceptGroup;
