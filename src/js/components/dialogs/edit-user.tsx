import { Grid } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SharingUser } from "../../../types/sharing-ui";

import GridContainerErrors from "../grid-container-errors";

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
}));

export interface DialogEditUserProps {
	open: boolean;
	onClose: () => void;
	onSave: (item: SharingUser) => void;
	item: SharingUser;
}

const DialogEditUser = (props: DialogEditUserProps) => {
	const { open, onClose, item } = props;
	const { t } = useTranslation();
	const classes = useStyles();
	const [errors, setErrors] = useState<string[]>([]);
	const [visualUsername, setVisualUsername] = useState(
		item.data.user_name || "",
	);
	const [username] = useState(item.data.user_username);
	const [userId] = useState(item.data.user_id);
	const [publicKey] = useState(item.data.user_public_key);

	const onSave = () => {
		if (item.data.user_name) {
			delete item.data.user_name;
		}
		if (visualUsername) {
			item.data.user_name = visualUsername;
		}

		item.name = "";
		if (item.data.user_name) {
			item.name += item.data.user_name;
		} else {
			item.name += item.data.user_username;
		}
		item.name += " (" + item.data.user_public_key + ")";

		props.onSave(item);
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
			<DialogTitle id="alert-dialog-title">{t("EDIT_USER")}</DialogTitle>
			<DialogContent>
				<Grid container>
					<Grid item xs={12} sm={12} md={12}>
						<TextField
							className={classes.textField}
							variant="outlined"
							margin="dense"
							size="small"
							id="visualUsername"
							label={t("NAME_OPTIONAL")}
							name="visualUsername"
							autoComplete="off"
							value={visualUsername}
							onChange={(event) => {
								setVisualUsername(event.target.value);
							}}
						/>
					</Grid>
					<Grid item xs={12} sm={12} md={12}>
						<TextField
							className={classes.textField}
							variant="outlined"
							margin="dense"
							size="small"
							id="username"
							label={t("USERNAME")}
							name="username"
							autoComplete="off"
							value={username}
							disabled
						/>
					</Grid>
					<Grid item xs={12} sm={12} md={12}>
						<TextField
							className={classes.textField}
							variant="outlined"
							margin="dense"
							size="small"
							id="publicKey"
							label={t("PUBLIC_KEY")}
							name="publicKey"
							autoComplete="off"
							helperText={t("TO_VERIFY_PUBLIC_KEY")}
							value={publicKey}
							disabled
						/>
					</Grid>
				</Grid>
				<GridContainerErrors errors={errors} setErrors={setErrors} />
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
						onSave();
					}}
					variant="contained"
					color="primary"
					disabled={!userId || !username || !publicKey}
				>
					{t("SAVE")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default DialogEditUser;
