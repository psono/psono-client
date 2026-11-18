import { Grid } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TotpDialogCallback } from "../../../types/dialogs";
import cryptoLibraryService from "../../services/crypto-library";
import GridContainerErrors from "../grid-container-errors";
import TotpFields from "../totp-fields";

export interface DialogAddTotpProps {
	open: boolean;
	onClose: TotpDialogCallback;
}

const DialogAddTotp = (props: DialogAddTotpProps) => {
	const { open, onClose } = props;
	const { t } = useTranslation();
	const [errors, setErrors] = useState<string[]>([]);
	const [totpPeriod, setTotpPeriod] = useState(30);
	const [totpAlgorithm, setTotpAlgorithm] = useState("SHA1");
	const [totpDigits, setTotpDigits] = useState(6);
	const [totpCode, setTotpCode] = useState("");
	const [totpUriValid, setTotpUriValid] = useState(true);
	const onSave = () => {
		try {
			cryptoLibraryService.getTotpToken(
				totpCode,
				totpPeriod,
				totpAlgorithm,
				totpDigits,
			);
			onClose(totpPeriod, totpAlgorithm, totpDigits, totpCode);
		} catch (e) {
			console.log(e);
			setErrors(["INVALID_TOTP_PARAMETERS"]);
		}
	};

	return (
		<Dialog
			fullWidth
			maxWidth={"sm"}
			open={open}
			onClose={() => {
				onClose(30, "SHA1", 6, "");
			}}
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
		>
			<DialogTitle id="alert-dialog-title">{t("ADD_TOTP")}</DialogTitle>
			<DialogContent>
				<Grid container>
					<TotpFields
						onValidityChange={setTotpUriValid}
						value={{
							period: totpPeriod,
							algorithm: totpAlgorithm,
							digits: totpDigits,
							code: totpCode,
						}}
						onChange={({ period, algorithm, digits, code }) => {
							setTotpPeriod(period);
							setTotpAlgorithm(algorithm);
							setTotpDigits(digits);
							setTotpCode(code);
						}}
					/>
				</Grid>
				<GridContainerErrors errors={errors} setErrors={setErrors} />
			</DialogContent>
			<DialogActions>
				<Button
					onClick={() => {
						onClose(30, "SHA1", 6, "");
					}}
				>
					{t("CLOSE")}
				</Button>
				<Button
					onClick={onSave}
					variant="contained"
					color="primary"
					disabled={!totpCode || !totpUriValid}
				>
					{t("SAVE")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default DialogAddTotp;
