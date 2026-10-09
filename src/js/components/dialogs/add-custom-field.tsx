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
import type { ResultDialogProps } from "../../../types/dialogs";
import type { CustomField } from "../../../types/vault";
import SelectFieldCustomFieldType from "../select-field/custom-field-type";
import type { CustomFieldType } from "../select-field/custom-field-type";

const useStyles = makeStyles((theme) => ({
	textField: {
		width: "100%",
	},
}));

const DialogAddCustomField = (props: ResultDialogProps<CustomField>) => {
	const { open, onClose } = props;
	const { t } = useTranslation();
	const classes = useStyles();

	const [customField, setCustomField] = useState<
		CustomField & { type: CustomFieldType | "" }
	>({
		name: "",
		type: "text",
		value: "",
	});

	return (
		<Dialog
			fullWidth
			maxWidth={"sm"}
			open={open}
			onClose={() => {
				onClose(null);
			}}
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
		>
			<DialogTitle id="alert-dialog-title">{t("ADD_CUSTOM_FIELD")}</DialogTitle>
			<DialogContent>
				<Grid container>
					<Grid item xs={12} sm={12} md={12}>
						<TextField
							className={classes.textField}
							variant="outlined"
							margin="dense"
							size="small"
							id="name"
							label={t("NAME")}
							name="name"
							autoComplete="off"
							value={customField.name}
							required
							onChange={(event) => {
								setCustomField({
									...customField,
									name: event.target.value,
								});
							}}
						/>
					</Grid>
					<Grid item xs={12} sm={12} md={12}>
						<SelectFieldCustomFieldType
							className={classes.textField}
							variant="outlined"
							margin="dense"
							size="small"
							value={customField.type}
							required
							onChange={(value) => {
								setCustomField({
									...customField,
									type: value,
								});
							}}
						/>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions>
				<Button
					onClick={() => {
						onClose(null);
					}}
				>
					{t("CLOSE")}
				</Button>
				<Button
					onClick={() => {
						onClose(customField);
					}}
					variant="contained"
					color="primary"
					disabled={!customField.name}
				>
					{t("SAVE")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default DialogAddCustomField;
