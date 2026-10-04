import { Button, CircularProgress, Grid, TextField } from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { makeStyles } from "@mui/styles";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { dialogErrorMessage, isDialogRecord } from "../../../types/dialogs";
import type { DialogProps } from "../../../types/dialogs";
import actionCreators from "../../actions/action-creators";
import deviceCodeService from "../../services/device-code";
import GridContainerErrors from "../grid-container-errors";

const useStyles = makeStyles((theme) => ({
	textField: {
		width: "100%",
		"& .MuiInputBase-root": {
			color: theme.palette.lightGreyText.main,
		},
		"& .MuiInputAdornment-root .MuiTypography-colorTextSecondary": {
			color: theme.palette.greyText.main,
		},
		"& MuiFormControl-root": {
			color: theme.palette.lightGreyText.main,
		},
		"& label": {
			color: theme.palette.lightGreyText.main,
		},
		"& .MuiInput-underline:after": {
			borderBottomColor: "green",
		},
		"& .MuiOutlinedInput-root": {
			"& fieldset": {
				borderColor: theme.palette.greyText.main,
			},
		},
		// Override readonly styling to make text clearly readable
		"& .MuiInputBase-input[readonly]": {
			color: theme.palette.text.primary,
			cursor: "default",
		},
		"& .MuiOutlinedInput-root .MuiInputBase-input[readonly]": {
			color: theme.palette.text.primary,
		},
	},
	logoContainer: {
		textAlign: "center",
		marginBottom: "16px",
		position: "relative",
	},
	infoLabel: {
		position: "absolute",
		top: "8px",
		right: "8px",
		color: theme.palette.greyText.main,
		textDecoration: "none",
		"&:hover": {
			color: theme.palette.primary.main,
		},
	},
}));

/**
 * Dialog component to display a consent screen for claiming a device code
 */
const DialogDeviceClaimConsent = ({ open, onClose }: DialogProps) => {
	const dispatch = useDispatch();
	const classes = useStyles();
	const { t } = useTranslation();

	const [processing, setProcessing] = useState(false);
	const [success, setSuccess] = useState(false);
	const [errors, setErrors] = useState<string[]>([]);

	const storeDeviceCode = useSelector((state) => state.device.deviceCode);

	const deviceCodeId = storeDeviceCode?.id;
	const deviceCodeSecretBoxKey = storeDeviceCode?.secretBoxKey;

	const extractErrorMessage = (err: unknown): string => {
		try {
			if (!isDialogRecord(err)) {
				return JSON.stringify(err) ?? "";
			}
			// Handle client-side errors: {errors: ["ERROR_CODE"]}
			if (Array.isArray(err.errors) && typeof err.errors[0] === "string") {
				return t(err.errors[0]);
			}

			// Handle DRF error response format: {"data": {"detail": "ERROR_CODE"}}
			if (
				isDialogRecord(err.data) &&
				typeof err.data.detail === "string" &&
				err.data.detail
			) {
				return t(err.data.detail);
			}

			// Handle DRF validation errors: {"data": {"field": ["ERROR_CODE"]}}
			if (isDialogRecord(err.data)) {
				for (const field in err.data) {
					const messages = err.data[field];
					if (Array.isArray(messages) && typeof messages[0] === "string") {
						return t(messages[0]);
					}
				}
			}

			if (typeof err.message === "string" && err.message) {
				return t(err.message);
			}

			return JSON.stringify(err);
		} catch (parseError) {
			return dialogErrorMessage(err);
		}
	};

	const handleAccept = async () => {
		if (!deviceCodeId || !deviceCodeSecretBoxKey) {
			setErrors([t("MISSING_DEVICE_CODE_INFORMATION")]);
			return;
		}

		setProcessing(true);
		setErrors([]);

		try {
			await deviceCodeService.claimDeviceCode(
				deviceCodeId,
				deviceCodeSecretBoxKey,
			);
			setSuccess(true);
			dispatch(actionCreators.clearDeviceCode());
		} catch (err) {
			const errorMessage = extractErrorMessage(err);
			setErrors([errorMessage]);
		} finally {
			setProcessing(false);
		}
	};

	const handleClose = () => {
		dispatch(actionCreators.clearDeviceCode());
		setProcessing(false);
		setSuccess(false);
		setErrors([]);
		onClose();
	};

	const handleCancel = () => {
		handleClose();
	};

	// Keep the success confirmation visible after clearing the stored device code.
	if (!success && (!deviceCodeId || !deviceCodeSecretBoxKey)) {
		return null;
	}

	return (
		<Dialog
			fullWidth
			maxWidth="sm"
			open={open}
			onClose={handleCancel}
			aria-labelledby="device-claim-dialog-title"
			aria-describedby="device-claim-dialog-description"
		>
			<DialogTitle id="device-claim-dialog-title">
				{t("DEVICE_CODE_CLAIM_TITLE")}
			</DialogTitle>

			<DialogContent>
				<Grid container spacing={2}>
					{!success && (
						<Grid item xs={12}>
							<TextField
								className={classes.textField}
								variant="outlined"
								margin="dense"
								size="small"
								id="device_code_id"
								label={t("DEVICE_CODE")}
								InputProps={{
									readOnly: true,
									multiline: true,
								}}
								name="device_code_id"
								autoComplete="off"
								value={deviceCodeId}
							/>
						</Grid>
					)}

					{!success && (
						<Grid item xs={12}>
							<MuiAlert
								severity="warning"
								style={{
									marginBottom: "5px",
									marginTop: "5px",
								}}
							>
								{t("DEVICE_CODE_IT_APPEARS_THAT_YOU_WANT_TO_CONNECT_DEVICE")}
							</MuiAlert>
						</Grid>
					)}

					{success && (
						<Grid item xs={12}>
							<MuiAlert
								severity="success"
								style={{
									marginBottom: "5px",
									marginTop: "5px",
								}}
							>
								{t("DEVICE_CODE_CLAIMED_SUCCESSFULLY")}
							</MuiAlert>
						</Grid>
					)}

					<Grid item xs={12}>
						<GridContainerErrors
							errors={errors}
							setErrors={setErrors}
							style={{
								marginBottom: "5px",
								marginTop: "5px",
							}}
						/>
					</Grid>
				</Grid>
			</DialogContent>

			<DialogActions>
				{!success && (
					<>
						<Button
							onClick={handleCancel}
							disabled={processing}
							color="inherit"
						>
							{t("CANCEL")}
						</Button>
						<Button
							onClick={handleAccept}
							variant="contained"
							color="primary"
							disabled={processing}
							startIcon={processing ? <CircularProgress size={20} /> : null}
						>
							{processing ? t("PROCESSING") : t("APPROVE")}
						</Button>
					</>
				)}
				{success && (
					<Button onClick={handleClose} variant="contained" color="primary">
						{t("CLOSE")}
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};

export default DialogDeviceClaimConsent;
