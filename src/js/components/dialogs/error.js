import { Grid } from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const DialogError = (props) => {
	const { open, onClose, title, description } = props;
	const { t } = useTranslation();

	return (
		<Dialog
			fullWidth
			maxWidth={"sm"}
			open={open}
			onClose={onClose}
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
		>
			<DialogTitle id="alert-dialog-title">{t(title)}</DialogTitle>
			<DialogContent>
				<Grid container>
					<Grid item xs={12} sm={12} md={12}>
						<MuiAlert
							severity="error"
							style={{
								marginBottom: "5px",
								marginTop: "5px",
							}}
						>
							{t(description)}
						</MuiAlert>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>{t("CLOSE")}</Button>
			</DialogActions>
		</Dialog>
	);
};

DialogError.propTypes = {
	title: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	onClose: PropTypes.func.isRequired,
	open: PropTypes.bool.isRequired,
};

export default DialogError;
