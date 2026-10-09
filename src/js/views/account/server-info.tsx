import { Grid } from "@mui/material";
import type { AccountViewProps } from "../../../types/account-ui";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";
import React from "react";
import { useTranslation } from "react-i18next";

import { getStore } from "../../services/store";

const useStyles = makeStyles((theme) => ({
	textField: {
		width: "100%",
		[theme.breakpoints.up("md")]: {
			width: "440px",
		},
	},
	passwordField: {
		fontFamily: "'Fira Code', monospace",
	},
}));

// Preserve the legacy root prop; moving it to InputProps would change behavior.
const readOnlyTextFieldProps = { readOnly: true };

const AccountOverviewView = (props: AccountViewProps) => {
	const { t } = useTranslation();
	const classes = useStyles();

	return (
		<Grid container>
			<Grid item xs={12} sm={12} md={12}>
				<h2>{t("SERVER_INFO")}</h2>
				<p>{t("SERVER_INFO_DESCRIPTION")}</p>
				<Divider style={{ marginBottom: "20px" }} />
			</Grid>
			<Grid item xs={12} sm={12} md={12}>
				<TextField
					className={classes.textField}
					variant="outlined"
					margin="dense"
					size="small"
					id="api"
					label={t("SERVER_API_VERSION")}
					name="api"
					autoComplete="off"
					value={getStore().getState().server.api}
					{...readOnlyTextFieldProps}
					InputProps={{
						classes: {
							input: classes.passwordField,
						},
					}}
				/>
			</Grid>
			<Grid item xs={12} sm={12} md={12}>
				<TextField
					className={classes.textField}
					variant="outlined"
					margin="dense"
					size="small"
					id="version"
					label={t("SERVER_VERSION")}
					name="version"
					autoComplete="off"
					value={getStore().getState().server.version}
					{...readOnlyTextFieldProps}
					InputProps={{
						classes: {
							input: classes.passwordField,
						},
					}}
				/>
			</Grid>
			<Grid item xs={12} sm={12} md={12}>
				<TextField
					className={classes.textField}
					variant="outlined"
					margin="dense"
					size="small"
					id="verifyKey"
					label={t("SERVER_SIGNATURE")}
					name="verifyKey"
					autoComplete="off"
					value={getStore().getState().server.verifyKey}
					{...readOnlyTextFieldProps}
					InputProps={{
						classes: {
							input: classes.passwordField,
						},
					}}
				/>
			</Grid>
			<Grid item xs={12} sm={12} md={12}>
				<TextField
					className={classes.textField}
					variant="outlined"
					margin="dense"
					size="small"
					id="logAudit"
					label={t("SERVER_AUDIT_LOGGING")}
					name="logAudit"
					autoComplete="off"
					value={getStore().getState().server.logAudit}
					{...readOnlyTextFieldProps}
					InputProps={{
						classes: {
							input: classes.passwordField,
						},
					}}
				/>
			</Grid>
			<Grid item xs={12} sm={12} md={12}>
				<TextField
					className={classes.textField}
					variant="outlined"
					margin="dense"
					size="small"
					id="publicKey"
					label={t("SERVER_PUBLIC_KEY")}
					name="publicKey"
					autoComplete="off"
					value={getStore().getState().server.publicKey}
					{...readOnlyTextFieldProps}
					InputProps={{
						classes: {
							input: classes.passwordField,
						},
					}}
				/>
			</Grid>
			<Grid item xs={12} sm={12} md={12}>
				<TextField
					className={classes.textField}
					variant="outlined"
					margin="dense"
					size="small"
					id="type"
					label={t("SERVER_LICENSE_TYPE")}
					name="type"
					autoComplete="off"
					value={getStore().getState().server.type}
					{...readOnlyTextFieldProps}
					InputProps={{
						classes: {
							input: classes.passwordField,
						},
					}}
				/>
			</Grid>
			<Grid item xs={12} sm={12} md={12}>
				<TextField
					className={classes.textField}
					variant="outlined"
					margin="dense"
					size="small"
					id="licenseMaxUsers"
					label={t("SERVER_MAX_USERS")}
					name="licenseMaxUsers"
					autoComplete="off"
					value={getStore().getState().server.licenseMaxUsers}
					{...readOnlyTextFieldProps}
					InputProps={{
						classes: {
							input: classes.passwordField,
						},
					}}
				/>
			</Grid>
			<Grid item xs={12} sm={12} md={12}>
				<TextField
					className={classes.textField}
					variant="outlined"
					margin="dense"
					size="small"
					id="licenseValidFrom"
					label={t("SERVER_LICENSE_VALID_FROM")}
					name="licenseValidFrom"
					autoComplete="off"
					value={
						getStore().getState().server.licenseValidFrom
							? new Date(getStore().getState().server.licenseValidFrom! * 1000)
							: "N/A"
					}
					{...readOnlyTextFieldProps}
					InputProps={{
						classes: {
							input: classes.passwordField,
						},
					}}
				/>
			</Grid>
			<Grid item xs={12} sm={12} md={12}>
				<TextField
					className={classes.textField}
					variant="outlined"
					margin="dense"
					size="small"
					id="licenseValidTill"
					label={t("SERVER_LICENSE_VALID_TILL")}
					name="licenseValidTill"
					autoComplete="off"
					value={
						getStore().getState().server.licenseValidTill
							? new Date(getStore().getState().server.licenseValidTill! * 1000)
							: "N/A"
					}
					{...readOnlyTextFieldProps}
					InputProps={{
						classes: {
							input: classes.passwordField,
						},
					}}
				/>
			</Grid>
		</Grid>
	);
};

export default AccountOverviewView;
