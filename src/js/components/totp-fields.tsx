import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { Grid, IconButton, InputAdornment, TextField } from "@mui/material";
import * as OTPAuth from "otpauth";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import cryptoLibrary from "../services/crypto-library";
import SelectFieldTotpAlgorithm from "./select-field/totp-algorithm";

export interface TotpParameters {
	period: number;
	algorithm: string;
	digits: number;
	code: string;
}

interface TotpFieldsProps {
	value: TotpParameters;
	onChange: (value: TotpParameters) => void;
	onValidityChange: (valid: boolean) => void;
	onTitleSuggestion?: (title: string) => void;
}

function stringifyUri(uri: URL) {
	// OTPAuth decodes query values with decodeURIComponent, which leaves '+' intact.
	uri.search = uri.searchParams.toString().replace(/\+/g, "%20");
	return uri.toString();
}

function buildUri(value: TotpParameters, previousUri: string) {
	if (!value.code) return "";
	const uri = new URL(previousUri || "otpauth://totp/TOTP");
	// Replace case-insensitive parameter names accepted by OTPAuth as well.
	for (const name of Array.from(uri.searchParams.keys())) {
		if (
			["secret", "period", "algorithm", "digits"].includes(name.toLowerCase())
		) {
			uri.searchParams.delete(name);
		}
	}
	uri.searchParams.set("secret", value.code);
	uri.searchParams.set("period", String(value.period));
	uri.searchParams.set("algorithm", value.algorithm);
	uri.searchParams.set("digits", String(value.digits));
	return stringifyUri(uri);
}

const TotpFields = ({
	value,
	onChange,
	onValidityChange,
	onTitleSuggestion,
}: TotpFieldsProps) => {
	const { t } = useTranslation();
	const [showPassword, setShowPassword] = useState(false);
	const [uri, setUri] = useState(() => buildUri(value, ""));
	const [uriError, setUriError] = useState(false);
	const lastValidUri = useRef("");
	const { period, algorithm, digits, code } = value;

	useEffect(() => {
		setUri(buildUri({ period, algorithm, digits, code }, lastValidUri.current));
		setUriError(false);
		onValidityChange(true);
	}, [period, algorithm, digits, code, onValidityChange]);

	const secretInputProps = {
		type: showPassword ? "text" : "password",
		classes: { input: "psono-addPasswordFormButtons-covered" },
		endAdornment: (
			<InputAdornment position="end">
				<IconButton
					aria-label={t("SHOW_OR_HIDE_PASSWORD")}
					onClick={() => setShowPassword(!showPassword)}
					size="large"
				>
					<VisibilityOffIcon fontSize="small" />
				</IconButton>
			</InputAdornment>
		),
	};

	return (
		<>
			<Grid item xs={12}>
				<TextField
					fullWidth
					variant="outlined"
					margin="dense"
					size="small"
					id="totpUri"
					name="totpUri"
					label={t("TOTP_URI")}
					autoComplete="off"
					value={uri}
					error={uriError}
					helperText={uriError ? t("INVALID_TOTP_URI") : undefined}
					InputProps={secretInputProps}
					onChange={(event) => {
						const text = event.target.value.trim();
						setUri(text);
						setUriError(false);
						onValidityChange(true);
						if (!text) return;
						try {
							const sourceUri = new URL(text);
							const normalizedUri = stringifyUri(sourceUri);
							const parsed = OTPAuth.URI.parse(normalizedUri);
							if (
								!(parsed instanceof OTPAuth.TOTP) ||
								!cryptoLibrary
									.getSupportedTotpAlgorithm()
									.some(
										(option) => option.value === parsed.algorithm.toUpperCase(),
									)
							) {
								throw new Error("Unsupported TOTP URI");
							}
							// Preserve the supplied secret instead of decoding and re-encoding it.
							// Match OTPAuth's case-insensitive, last-value-wins parameter handling.
							let secret = "";
							for (const [name, value] of sourceUri.searchParams) {
								if (name.toLowerCase() === "secret") secret = value;
							}
							lastValidUri.current = normalizedUri;
							onChange({
								period: parsed.period,
								algorithm: parsed.algorithm.toUpperCase(),
								digits: parsed.digits,
								code: secret,
							});
							onTitleSuggestion?.(
								parsed.issuer.trim() ||
									(parsed.label.split(":")[0] || "").trim(),
							);
						} catch {
							setUriError(true);
							onValidityChange(false);
						}
					}}
				/>
			</Grid>
			<Grid item xs={12}>
				<TextField
					fullWidth
					variant="outlined"
					margin="dense"
					size="small"
					id="totpPeriod"
					name="totpPeriod"
					label={t("PERIOD_EG_30")}
					autoComplete="off"
					value={period}
					required
					type="number"
					InputProps={{ inputProps: { min: 1, step: 1 } }}
					onChange={(event) =>
						onChange({ ...value, period: parseInt(event.target.value) || 30 })
					}
				/>
			</Grid>
			<Grid item xs={12}>
				<SelectFieldTotpAlgorithm
					fullWidth
					variant="outlined"
					margin="dense"
					size="small"
					id="totpAlgorithm"
					name="totpAlgorithm"
					value={algorithm}
					required
					onChange={(algorithm) => onChange({ ...value, algorithm })}
				/>
			</Grid>
			<Grid item xs={12}>
				<TextField
					fullWidth
					variant="outlined"
					margin="dense"
					size="small"
					id="totpDigits"
					name="totpDigits"
					label={t("DIGITS_EG_6")}
					autoComplete="off"
					value={digits}
					required
					type="number"
					InputProps={{ inputProps: { min: 1, step: 1 } }}
					onChange={(event) =>
						onChange({ ...value, digits: parseInt(event.target.value) || 6 })
					}
				/>
			</Grid>
			<Grid item xs={12}>
				<TextField
					fullWidth
					variant="outlined"
					margin="dense"
					size="small"
					id="totpCode"
					name="totpCode"
					label={t("SECRET")}
					autoComplete="off"
					value={code}
					required
					InputProps={secretInputProps}
					onChange={(event) =>
						onChange({ ...value, code: event.target.value.replace(/\s+/g, "") })
					}
				/>
			</Grid>
		</>
	);
};

export default TotpFields;
