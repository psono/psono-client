import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import type { DialogProps } from "../../../types/dialogs";
import vaultLock from "../../services/vault-lock";

export default function DialogUnlockOfflineCache({
	open,
	onClose,
}: DialogProps) {
	const { t } = useTranslation();
	const [error, setError] = React.useState("");
	const [busy, setBusy] = React.useState(false);
	const unlock = async () => {
		setBusy(true);
		try {
			await vaultLock.unlock();
			onClose();
		} catch (error) {
			setError(error instanceof Error ? error.message : String(error));
		} finally {
			setBusy(false);
		}
	};
	return (
		<Dialog open={open} fullWidth maxWidth="sm">
			<DialogTitle>{t("VAULT_LOCKED")}</DialogTitle>
			<DialogContent>
				{error && <Alert severity="error">{t(error)}</Alert>}
			</DialogContent>
			<DialogActions>
				<Button disabled={busy} onClick={unlock}>
					{t("UNLOCK")}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
