import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import {
	Alert,
	Grid,
	IconButton,
	InputAdornment,
	LinearProgress,
	TextField,
} from "@mui/material";
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
	const [qrError, setQrError] = useState("");
	const [scanning, setScanning] = useState(false);
	const fileInput = useRef<HTMLInputElement>(null);
	const scanRequest = useRef(0);
	const lastValidUri = useRef("");
	const { period, algorithm, digits, code } = value;

	useEffect(() => {
		setUri(buildUri({ period, algorithm, digits, code }, lastValidUri.current));
		setUriError(false);
	}, [period, algorithm, digits, code]);

	useEffect(() => {
		onValidityChange(!uriError && !scanning);
	}, [uriError, scanning, onValidityChange]);

	useEffect(
		() => () => {
			scanRequest.current += 1;
		},
		[],
	);

	const cancelScan = () => {
		scanRequest.current += 1;
		setScanning(false);
		setQrError("");
	};

	const updateParameters = (parameters: TotpParameters) => {
		cancelScan();
		onChange(parameters);
	};

	const applyUri = (text: string) => {
		const sourceUri = new URL(text);
		const normalizedUri = stringifyUri(sourceUri);
		const parsed = OTPAuth.URI.parse(normalizedUri);
		if (
			!(parsed instanceof OTPAuth.TOTP) ||
			!cryptoLibrary
				.getSupportedTotpAlgorithm()
				.some((option) => option.value === parsed.algorithm.toUpperCase())
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
		setUri(text);
		setUriError(false);
		onChange({
			period: parsed.period,
			algorithm: parsed.algorithm.toUpperCase(),
			digits: parsed.digits,
			code: secret,
		});
		onTitleSuggestion?.(
			parsed.issuer.trim() || (parsed.label.split(":")[0] || "").trim(),
		);
	};

	const scan = async (image: Blob) => {
		const request = ++scanRequest.current;
		setScanning(true);
		setQrError("");
		try {
			const { default: qrCode } = await import(
				/* webpackChunkName: "totp-qr-scanner" */ "../services/qr-code"
			);
			if (request !== scanRequest.current) return;
			const text = await qrCode.readFromImage(image);
			if (request !== scanRequest.current) return;
			try {
				applyUri(text.trim());
			} catch {
				setQrError("INVALID_TOTP_URI");
			}
		} catch (error) {
			if (request !== scanRequest.current) return;
			setQrError(
				error instanceof Error && error.message === "TOTP_QR_NOT_FOUND"
					? error.message
					: "TOTP_QR_READ_ERROR",
			);
		} finally {
			if (request === scanRequest.current) setScanning(false);
		}
	};

	const showHideButton = (
		<IconButton
			aria-label={t("SHOW_OR_HIDE_PASSWORD")}
			onClick={() => setShowPassword(!showPassword)}
			size="large"
		>
			<VisibilityOffIcon fontSize="small" />
		</IconButton>
	);
	const secretInputProps = {
		type: showPassword ? "text" : "password",
		classes: { input: "psono-addPasswordFormButtons-covered" },
		endAdornment: (
			<InputAdornment position="end">{showHideButton}</InputAdornment>
		),
	};

	return (
		<>
			<Grid
				item
				xs={12}
				aria-busy={scanning}
				onPaste={(event) => {
					const image = Array.from(event.clipboardData.items)
						.find((item) => item.type.startsWith("image/"))
						?.getAsFile();
					if (!image) return;
					event.preventDefault();
					void scan(image);
				}}
			>
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
					helperText={t(uriError ? "INVALID_TOTP_URI" : "TOTP_QR_HELP")}
					InputProps={{
						...secretInputProps,
						endAdornment: (
							<InputAdornment position="end">
								<IconButton
									aria-label={t("TOTP_IMPORT_QR_IMAGE")}
									title={t("TOTP_IMPORT_QR_IMAGE")}
									disabled={scanning}
									onClick={() => fileInput.current?.click()}
									size="large"
								>
									<QrCodeScannerIcon fontSize="small" />
								</IconButton>
								{showHideButton}
							</InputAdornment>
						),
					}}
					onChange={(event) => {
						cancelScan();
						const text = event.target.value.trim();
						setUri(text);
						setUriError(false);
						if (!text) return;
						try {
							applyUri(text);
						} catch {
							setUriError(true);
						}
					}}
				/>
				<input
					ref={fileInput}
					type="file"
					name="totpQrImage"
					accept="image/*"
					hidden
					onChange={(event) => {
						const image = event.target.files?.[0];
						event.target.value = "";
						if (image) void scan(image);
					}}
				/>
				{scanning && <LinearProgress aria-label={t("TOTP_SCANNING_QR")} />}
				{qrError && (
					<Alert severity="error" onClose={() => setQrError("")}>
						{t(qrError)}
					</Alert>
				)}
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
						updateParameters({
							...value,
							period: parseInt(event.target.value) || 30,
						})
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
					onChange={(algorithm) => updateParameters({ ...value, algorithm })}
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
						updateParameters({
							...value,
							digits: parseInt(event.target.value) || 6,
						})
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
						updateParameters({
							...value,
							code: event.target.value.replace(/\s+/g, ""),
						})
					}
				/>
			</Grid>
		</>
	);
};

export default TotpFields;
