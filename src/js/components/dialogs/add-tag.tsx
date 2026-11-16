import { Grid } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
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

const useStyles = makeStyles((theme) => ({
	textField: {
		width: "100%",
	},
}));

interface DialogAddTagProps extends ResultDialogProps<string> {
	availableTags?: string[];
	selectedTags?: string[];
}

const DialogAddTag = (props: DialogAddTagProps) => {
	const { open, onClose, availableTags = [], selectedTags = [] } = props;
	const { t } = useTranslation();
	const classes = useStyles();

	const [tag, setTag] = useState("");
	const options = [...new Set(availableTags.map((value) => value.trim()))]
		.filter((value) => value && !selectedTags.includes(value))
		.sort((a, b) => a.localeCompare(b));

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
			<DialogTitle id="alert-dialog-title">{t("ADD_TAG")}</DialogTitle>
			<DialogContent>
				<Grid container>
					<Grid item xs={12} sm={12} md={12}>
						<Autocomplete
							className={classes.textField}
							freeSolo
							openOnFocus
							options={options}
							id="tag"
							inputValue={tag}
							onInputChange={(_event, value) => setTag(value)}
							onChange={(_event, value) => setTag(value ?? "")}
							renderInput={(params) => (
								<TextField
									{...params}
									variant="outlined"
									margin="dense"
									size="small"
									label={t("TAG")}
									name="tag"
									required
								/>
							)}
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
						onClose(tag.trim());
					}}
					variant="contained"
					color="primary"
					disabled={!tag.trim() || selectedTags.includes(tag.trim())}
				>
					{t("SAVE")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default DialogAddTag;
