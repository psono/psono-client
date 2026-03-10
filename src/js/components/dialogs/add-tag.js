import { Grid } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles((theme) => ({
	textField: {
		width: "100%",
	},
}));

const DialogAddTag = (props) => {
	const { open, onClose } = props;
	const { t } = useTranslation();
	const classes = useStyles();

	const [tag, setTag] = useState("");

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
						<TextField
							className={classes.textField}
							variant="outlined"
							margin="dense"
							size="small"
							id="tag"
							label={t("TAG")}
							name="tag"
							autoComplete="off"
							value={tag}
							required
							onChange={(event) => {
								setTag(event.target.value);
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
						onClose(tag);
					}}
					variant="contained"
					color="primary"
					disabled={!tag}
				>
					{t("SAVE")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

DialogAddTag.propTypes = {
	onClose: PropTypes.func.isRequired,
	open: PropTypes.bool.isRequired,
};

export default DialogAddTag;
