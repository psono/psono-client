import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
	Button,
	Checkbox,
	FormControlLabel,
	Grid,
	IconButton,
	InputAdornment,
	MenuItem,
	TextField,
} from "@mui/material";
import PropTypes from "prop-types";
import React from "react";
import { useTranslation } from "react-i18next";

import ConnectionAuthentication from "./connection-authentication";
import MarkdownNotesField from "./markdown-notes-field";

const ConnectionEntryFields = ({
	connection,
	connectionType,
	onChange,
	onPersonalAuthenticationChange,
	onSavePersonalAuthentication,
	onToggleSecrets,
	personalAuthentication,
	personalAuthenticationDisabled,
	readOnly,
	showPersonalAuthentication,
	showSecrets,
}) => {
	const { t } = useTranslation();
	const isSSH = connectionType === "ssh_connection";
	const isRDP = connectionType === "rdp_connection";
	const prefix = isSSH
		? "sshConnection"
		: isRDP
			? "rdpConnection"
			: "vncConnection";
	const useConnectionCredentials =
		!showPersonalAuthentication || !personalAuthentication;
	const update = (field) => (event) => onChange(field, event.target.value);
	const secretAdornment = (
		<InputAdornment position="end">
			<IconButton onClick={onToggleSecrets} size="large" tabIndex={-1}>
				{showSecrets ? <VisibilityOff /> : <Visibility />}
			</IconButton>
		</InputAdornment>
	);

	return (
		<>
			<Grid item xs={12}>
				<TextField
					fullWidth
					id={`${prefix}Title`}
					label={t("TITLE")}
					margin="dense"
					onChange={update("title")}
					required
					value={connection.title}
					variant="outlined"
					disabled={readOnly}
				/>
			</Grid>
			<Grid item xs={12} sm={8}>
				<TextField
					fullWidth
					id={`${prefix}Host`}
					label={t("HOST")}
					margin="dense"
					onChange={update("host")}
					required
					value={connection.host}
					variant="outlined"
					disabled={readOnly}
				/>
			</Grid>
			<Grid item xs={12} sm={4}>
				<TextField
					fullWidth
					id={`${prefix}Port`}
					inputProps={{ min: 1, max: 65535 }}
					label={t("PORT")}
					margin="dense"
					onChange={update("port")}
					required
					type="number"
					value={connection.port}
					variant="outlined"
					disabled={readOnly}
				/>
			</Grid>

			{isRDP && (
				<>
					<Grid item xs={12}>
						<TextField
							disabled={readOnly}
							fullWidth
							id="rdpConnectionDomain"
							label={t("DOMAIN")}
							margin="dense"
							onChange={update("domain")}
							value={connection.domain}
							variant="outlined"
						/>
					</Grid>
					<Grid item xs={12}>
						<FormControlLabel
							control={
								<Checkbox
									checked={connection.ignoreCertificate}
									disabled={readOnly}
									onChange={(event) =>
										onChange("ignoreCertificate", event.target.checked)
									}
								/>
							}
							label={t("IGNORE_CERTIFICATE_VALIDATION")}
						/>
					</Grid>
				</>
			)}

			{showPersonalAuthentication && (
				<>
					<ConnectionAuthentication
						disabled={personalAuthenticationDisabled}
						onChange={onPersonalAuthenticationChange}
						type={connectionType}
						value={personalAuthentication}
					/>
					{onSavePersonalAuthentication && (
						<Grid item xs={12}>
							<Button
								color="primary"
								disabled={personalAuthenticationDisabled}
								onClick={onSavePersonalAuthentication}
								variant="outlined"
							>
								{t("SAVE")}
							</Button>
						</Grid>
					)}
				</>
			)}

			{useConnectionCredentials && isSSH && (
				<Grid item xs={12}>
					<TextField
						disabled={readOnly}
						fullWidth
						label={t("AUTHENTICATION_TYPE")}
						margin="dense"
						onChange={update("authenticationType")}
						select
						value={connection.authenticationType}
						variant="outlined"
					>
						<MenuItem value="password">{t("PASSWORD")}</MenuItem>
						<MenuItem value="private_key">{t("PRIVATE_KEY")}</MenuItem>
					</TextField>
				</Grid>
			)}

			{useConnectionCredentials && (
				<Grid item xs={12}>
					<TextField
						disabled={readOnly}
						fullWidth
						id={`${prefix}Username`}
						label={t("USERNAME")}
						margin="dense"
						onChange={update("username")}
						value={connection.username}
						variant="outlined"
					/>
				</Grid>
			)}

			{useConnectionCredentials &&
				(!isSSH || connection.authenticationType === "password") && (
					<Grid item xs={12}>
						<TextField
							disabled={readOnly}
							fullWidth
							id={`${prefix}Password`}
							InputProps={{ endAdornment: secretAdornment }}
							label={t("PASSWORD")}
							margin="dense"
							onChange={update("password")}
							type={showSecrets ? "text" : "password"}
							value={connection.password}
							variant="outlined"
						/>
					</Grid>
				)}

			{useConnectionCredentials &&
				isSSH &&
				connection.authenticationType === "private_key" && (
					<Grid item xs={12}>
						<TextField
							disabled={readOnly}
							fullWidth
							id="sshConnectionPrivateKey"
							InputProps={{ endAdornment: secretAdornment }}
							label={t("PRIVATE_KEY")}
							margin="dense"
							multiline={showSecrets}
							onChange={update("privateKey")}
							rows={showSecrets ? 6 : undefined}
							type={showSecrets ? "text" : "password"}
							value={connection.privateKey}
							variant="outlined"
						/>
					</Grid>
				)}

			<Grid item xs={12}>
				<MarkdownNotesField
					id={`${prefix}Notes`}
					label={t("NOTES")}
					onChange={(value) => onChange("notes", value)}
					readOnly={readOnly}
					value={connection.notes}
				/>
			</Grid>
		</>
	);
};

ConnectionEntryFields.propTypes = {
	connection: PropTypes.object.isRequired,
	connectionType: PropTypes.oneOf([
		"ssh_connection",
		"rdp_connection",
		"vnc_connection",
	]).isRequired,
	onChange: PropTypes.func.isRequired,
	onPersonalAuthenticationChange: PropTypes.func.isRequired,
	onSavePersonalAuthentication: PropTypes.func,
	onToggleSecrets: PropTypes.func.isRequired,
	personalAuthentication: PropTypes.object,
	personalAuthenticationDisabled: PropTypes.bool,
	readOnly: PropTypes.bool,
	showPersonalAuthentication: PropTypes.bool,
	showSecrets: PropTypes.bool,
};

ConnectionEntryFields.defaultProps = {
	showPersonalAuthentication: true,
};

export default ConnectionEntryFields;
