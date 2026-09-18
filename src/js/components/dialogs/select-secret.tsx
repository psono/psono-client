import { Grid } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { makeStyles } from "@mui/styles";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Datastore, DatastoreItem } from "../../../types/datastore";
import type { DialogNodeSelection, DialogProps } from "../../../types/dialogs";
import datastorePassword from "../../services/datastore-password";
import DatastoreTree from "../datastore-tree";
import Search from "../search";

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

export interface DialogSelectSecretProps extends DialogProps {
	onSelectItems: (items: DatastoreItem[]) => void;
	isSelectable?: DialogNodeSelection;
}

const DialogSelectSecret = (props: DialogSelectSecretProps) => {
	const { open, onClose, onSelectItems, isSelectable } = props;
	const { t } = useTranslation();
	const classes = useStyles();

	const [selected, setSelected] = useState<Record<string, DatastoreItem>>({});
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

	const isSelected = (item: DatastoreItem) => {
		return Object.hasOwn(selected, item.id);
	};

	const onSelectItem = (item: DatastoreItem) => {
		const newSelected = { ...selected };
		if (isSelected(item)) {
			delete newSelected[item.id];
		} else {
			newSelected[item.id] = item;
		}
		setSelected(newSelected);
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
				{t("ADD_SECRET_TO_API_KEY")}
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
					<Grid item xs={12} sm={12} md={12} className={classes.tree}>
						{datastore && (
							<DatastoreTree
								datastore={datastore}
								setDatastore={setDatastore}
								onSelectItem={onSelectItem}
								isSelected={isSelected}
								allowMultiselect={true}
								isSelectable={isSelectable}
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
				<Button
					onClick={() => {
						onSelectItems(Object.values(selected));
					}}
					variant="contained"
					color="primary"
				>
					{t("CONFIRM")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default DialogSelectSecret;
