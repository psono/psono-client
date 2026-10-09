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
	DialogNodeSelection,
	DialogProps,
	FolderBreadcrumbs,
} from "../../../types/dialogs";
import datastorePassword from "../../services/datastore-password";
import DatastoreTree from "../datastore-tree";
import Search from "../search";
import TextFieldPath from "../text-field/path";

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

export interface DialogSelectFolderProps extends DialogProps {
	title: string;
	onSelectNode: (breadcrumbs: FolderBreadcrumbs) => void;
	isSelectable?: DialogNodeSelection;
}

const DialogSelectFolder = (props: DialogSelectFolderProps) => {
	const { open, onClose, isSelectable, title } = props;
	const { t } = useTranslation();
	const classes = useStyles();

	const [path, setPath] = useState<DatastoreItem[]>([]);
	const [datastore, setDatastore] = useState<Datastore | null | undefined>(
		null,
	);
	const [search, setSearch] = useState("");

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

	const onSelectNode = (
		_parent: DatastoreItem,
		_path: DatastorePath | undefined,
		nodePath: DatastoreItem[],
	) => {
		if (!isSubscribed) {
			return;
		}
		setPath(Array.from(nodePath));
	};

	const onConfirm = () => {
		if (!isSubscribed) {
			return;
		}
		const breadcrumbs = {
			id_breadcrumbs: path.map((node) => node.id),
			path: Array.from(path),
		};
		props.onSelectNode(breadcrumbs);
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
				{title}
				<div className={classes.search}>
					<Search
						value={search}
						onChange={(newValue: string) => {
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
								onSelectNode={onSelectNode}
								isSelectable={isSelectable}
								hideItems={true}
								search={search}
								deleteFolderLabel={t("DELETE")}
								deleteItemLabel={t("DELETE")}
							/>
						)}
					</Grid>
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

export default DialogSelectFolder;
