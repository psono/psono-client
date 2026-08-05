import { Grid, MenuItem, TextField } from "@mui/material";
import PropTypes from "prop-types";
import React from "react";
import { useTranslation } from "react-i18next";

import SelectFieldConnectionCredential from "./select-field/connection-credential";

const ConnectionAuthentication = ({ disabled, onChange, type, value }) => {
	const { t } = useTranslation();
	const source = value?.type || "connection";

	const changeSource = (nextSource) => {
		if (nextSource === "connection") {
			onChange(null);
			return;
		}
		onChange({ type: nextSource });
	};

	return (
		<>
			<Grid item xs={12}>
				<TextField
					disabled={disabled}
					fullWidth
					label={t("AUTHENTICATION_SOURCE")}
					margin="dense"
					onChange={(event) => changeSource(event.target.value)}
					select
					value={source}
					variant="outlined"
				>
					<MenuItem value="connection">
						{t("USE_CREDENTIALS_FROM_CONNECTION")}
					</MenuItem>
					<MenuItem value="application_password">
						{t("USE_APPLICATION_PASSWORD")}
					</MenuItem>
					{type === "ssh_connection" && (
						<MenuItem value="ssh_own_key">{t("USE_SSH_KEY")}</MenuItem>
					)}
				</TextField>
			</Grid>
			{source === "ssh_own_key" && (
				<Grid item xs={12}>
					<TextField
						disabled={disabled}
						error={!value?.username}
						fullWidth
						label={t("PERSONAL_USERNAME")}
						margin="dense"
						onChange={(event) =>
							onChange({ ...value, username: event.target.value })
						}
						required
						value={value?.username || ""}
						variant="outlined"
					/>
				</Grid>
			)}
			{source !== "connection" && (
				<Grid item xs={12}>
					<SelectFieldConnectionCredential
						allowedType={source}
						disabled={disabled}
						error={!value?.secret_id || !value?.secret_key}
						helperText={
							!value?.secret_id || !value?.secret_key
								? t("BROKEN_REFERENCE")
								: ""
						}
						label={
							source === "ssh_own_key"
								? "SSH_KEY_REFERENCE"
								: "APPLICATION_PASSWORD_REFERENCE"
						}
						onChange={(credential) =>
							onChange(
								credential
									? { ...credential, username: value?.username }
									: { type: source, username: value?.username },
							)
						}
						value={value}
					/>
				</Grid>
			)}
		</>
	);
};

ConnectionAuthentication.propTypes = {
	disabled: PropTypes.bool,
	onChange: PropTypes.func.isRequired,
	type: PropTypes.oneOf(["ssh_connection", "rdp_connection", "vnc_connection"])
		.isRequired,
	value: PropTypes.object,
};

export default ConnectionAuthentication;
