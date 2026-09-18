import { Grid } from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import React from "react";
import { useTranslation } from "react-i18next";
import type { DialogProps } from "../../../types/dialogs";

export interface DialogErrorProps extends DialogProps {
	title: string;
	description: string;
}

const DialogError = (props: DialogErrorProps) => {
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

export default DialogError;
