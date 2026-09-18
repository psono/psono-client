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
	PendingSharingInvitation,
	SharingFolderTarget,
	VerifiedSharingUser,
} from "../../../types/sharing-ui";
import datastorePassword from "../../services/datastore-password";
import shareService from "../../services/share";
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
		height: "250px",
		overflowY: "auto",
	},
	search: {
		backgroundColor: theme.palette.lightBackground.main,
		position: "absolute",
		right: "28px",
		top: theme.spacing(2),
	},
}));

export interface DialogAcceptShareProps {
	open: boolean;
	onClose: () => void;
	item: PendingSharingInvitation;
	hideUser?: boolean;
	title?: string;
}

const DialogAcceptShare = (props: DialogAcceptShareProps) => {
	const {
		open,
		onClose,
		item,
		hideUser = false,
		title = "ACCEPT_SHARE",
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
	const [user, setUser] = useState<VerifiedSharingUser>({
		data: {
			user_id: "",
			user_username: "",
			user_public_key: "",
		},
		name: "",
	});

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
		if (!item.share_right_grant && node.share_id) {
			return false;
		}
		// filter out all targets that are inside of a share if the item is not allowed to be shared
		if (!item.share_right_grant && node.parent_share_id) {
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

	const onConfirm = () => {
		const onSuccess = (loadedDatastore: Datastore | undefined) => {
			const datastore = loadedDatastore!;
			const breadcrumbs = { id_breadcrumbs: path.map((node) => node.id) };

			const analyzedBreadcrumbs = datastorePassword.analyzeBreadcrumbs(
				breadcrumbs,
				datastore,
			);

			if (
				item.share_right_grant === false &&
				typeof analyzedBreadcrumbs["parent_share_id"] !== "undefined"
			) {
				// No grant right, yet the parent is a a share?!?
				alert(
					"Wups, this should not happen. Error: 781f3da7-d38b-470e-a3c8-dd5787642230",
				);
			}

			const onSuccess = (
				acceptedShare: Awaited<
					ReturnType<typeof shareService.acceptShareRight>
				>,
			) => {
				const share = acceptedShare!;
				if (typeof share.name === "undefined") {
					share.name = item.share_right_title;
				}

				const shares = [share];

				const onSuccess = () => {
					statusService.getStatus(true);
					onClose();
				};
				const onError = (data: unknown) => {
					console.log(data);
				};

				return datastorePassword
					.createShareLinksInDatastore(
						shares,
						analyzedBreadcrumbs["target"],
						analyzedBreadcrumbs["parent_path"],
						analyzedBreadcrumbs["path"],
						analyzedBreadcrumbs["parent_share_id"],
						analyzedBreadcrumbs["parent_datastore_id"],
						datastore,
						analyzedBreadcrumbs["parent_share"],
					)
					.then(onSuccess, onError);
			};

			const onError = (data: unknown) => {
				//pass
				console.log(data);
			};
			return shareService
				.acceptShareRight(
					item.share_right_id,
					item.share_right_key,
					item.share_right_key_nonce,
					user.data.user_public_key,
				)
				.then(onSuccess, onError);
		};
		const onError = (data: unknown) => {
			//pass
			console.log(data);
		};

		return datastorePassword.getPasswordDatastore().then(onSuccess, onError);
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
							{t("SHARED_BY")}:
						</Grid>
					)}
					{!hideUser && (
						<TrustedUser
							user_id={item.share_right_create_user_id}
							user_username={item.share_right_create_user_username}
							onSetUser={setUser}
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

export default DialogAcceptShare;
