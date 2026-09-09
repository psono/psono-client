import { Grid } from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import React from "react";
import { useTranslation } from "react-i18next";

const AdminRecoveryKeyChanged = (props) => {
	const { t } = useTranslation();
	const oldKey =
		props.serverCheck.admin_recovery_public_key_old || t("NOT_CONFIGURED");
	const newKey =
		props.serverCheck.admin_recovery_public_key || t("NOT_CONFIGURED");

	return (
		<React.Fragment>
			<Grid container>
				<Grid item xs={12} sm={12} md={12}>
					<h4>{t("ADMIN_RECOVERY_PUBLIC_KEY_CHANGED")}</h4>
				</Grid>
			</Grid>
			<Grid container>
				<Grid item xs={12} sm={12} md={12}>
					<TextField
						className={props.textFieldClass}
						variant="outlined"
						margin="dense"
						size="small"
						label={t("NEW_ADMIN_RECOVERY_PUBLIC_KEY")}
						multiline
						InputProps={{ readOnly: true }}
						value={newKey}
					/>
				</Grid>
			</Grid>
			<Grid container>
				<Grid item xs={12} sm={12} md={12}>
					<TextField
						className={props.textFieldClass}
						variant="outlined"
						margin="dense"
						size="small"
						label={t("OLD_ADMIN_RECOVERY_PUBLIC_KEY")}
						multiline
						InputProps={{ readOnly: true }}
						value={oldKey}
					/>
				</Grid>
			</Grid>
			<Grid container>
				<Grid item xs={12} sm={12} md={12}>
					<MuiAlert
						severity="warning"
						style={{ marginBottom: "5px", marginTop: "5px" }}
					>
						{t("THE_ADMIN_RECOVERY_PUBLIC_KEY_CHANGED")}
						<br />
						<br />
						<strong>{t("CONTACT_THE_OWNER_OF_THE_SERVER")}</strong>
					</MuiAlert>
				</Grid>
			</Grid>
			{props.showActions !== false && (
				<Grid container>
					<Grid
						item
						xs={12}
						sm={12}
						md={12}
						style={{ marginTop: "5px", marginBottom: "5px" }}
					>
						<Button
							variant="contained"
							color="primary"
							onClick={props.onCancel}
							type="submit"
							style={{ marginRight: "10px" }}
						>
							{t("CANCEL")}
						</Button>
						<Button onClick={props.onApprove}>
							<span className={props.regularButtonTextClass}>
								{t("IGNORE_AND_CONTINUE")}
							</span>
						</Button>
					</Grid>
				</Grid>
			)}
		</React.Fragment>
	);
};

export default AdminRecoveryKeyChanged;
