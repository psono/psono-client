import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import {
	IconButton,
	InputAdornment,
	LinearProgress,
	TextField,
	Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { generatePassphrase, passphraseEntropy } from "../services/passphrase";
import {
	isValidWordCount,
	MAX_WORD_COUNT,
	MIN_WORD_COUNT,
	normalizeWordCount,
	resolveWordlistLanguage,
} from "../services/passphrase-config";
import TextFieldColored from "./text-field/colored";
import GeneratorStrength from "./generator-strength";
import { WordlistSelect } from "./generator-select";

export interface PassphraseGeneratorProps {
	onChange: (value: string) => void;
	className?: string;
}

/** Shared by the entry dialog and the browser extension popup. */
export default function PassphraseGenerator({
	onChange,
	className,
}: PassphraseGeneratorProps) {
	const { t, i18n } = useTranslation();
	const settings = useSelector((state) => state.settingsDatastore);
	const server = useSelector((state) => state.server);
	const [count, setCount] = useState<number | string>(
		normalizeWordCount(
			settings.passphraseWordCount ??
				server.compliancePasswordGeneratorDefaultWordLength,
		),
	);
	const [language, setLanguage] = useState(
		resolveWordlistLanguage(settings.passphraseLanguage || i18n.language),
	);
	const [generated, setGenerated] = useState<{
		value: string;
		entropy: number;
	} | null>(null);
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(true);
	const [failed, setFailed] = useState(false);
	const [generation, setGeneration] = useState(0);

	useEffect(() => {
		if (!isValidWordCount(count)) {
			setLoading(false);
			return;
		}
		let active = true;
		setLoading(true);
		setFailed(false);
		setPassword("");
		Promise.all([
			generatePassphrase(count, language),
			passphraseEntropy(count, language),
		]).then(
			([value, entropy]) => {
				if (!active) return;
				setGenerated({ value, entropy });
				setPassword(value);
				setLoading(false);
			},
			(error: unknown) => {
				if (!active) return;
				console.error(error);
				setFailed(true);
				setLoading(false);
			},
		);
		// Discard stale loads after a language/count change or unmount.
		return () => {
			active = false;
		};
	}, [count, language, generation]);

	useEffect(() => {
		onChange(password);
	}, [password, onChange]);

	const entropy = password === generated?.value ? generated.entropy : undefined;

	return (
		<>
			<TextFieldColored
				fullWidth
				className={className}
				variant="outlined"
				margin="dense"
				size="small"
				label={t("PASSPHRASE")}
				value={password}
				disabled={loading}
				autoComplete="off"
				onChange={(event) => setPassword(event.target.value)}
				InputProps={{
					classes: { input: "psono-addPasswordFormButtons-covered" },
					style: { fontFamily: "'Fira Code', monospace" },
					endAdornment: (
						<InputAdornment position="end">
							<IconButton
								aria-label={t("GENERATE_PASSPHRASE")}
								disabled={loading || !isValidWordCount(count)}
								onClick={() => setGeneration((value) => value + 1)}
								edge="end"
							>
								<ReplayRoundedIcon fontSize="small" />
							</IconButton>
						</InputAdornment>
					),
				}}
			/>
			{loading ? (
				<LinearProgress aria-label={t("LOADING")} />
			) : failed ? (
				<Typography color="error" role="alert">
					{t("UNKNOWN_ERROR")}
				</Typography>
			) : (
				<GeneratorStrength mode="passphrase" entropy={entropy} />
			)}
			<TextField
				fullWidth
				className={className}
				variant="outlined"
				margin="dense"
				size="small"
				type="number"
				label={t("PASSPHRASE_WORD_COUNT")}
				value={count}
				inputProps={{ min: MIN_WORD_COUNT, max: MAX_WORD_COUNT, step: 1 }}
				error={!isValidWordCount(count)}
				helperText={
					!isValidWordCount(count)
						? t("PASSPHRASE_WORD_COUNT_ERROR", {
								min: MIN_WORD_COUNT,
								max: MAX_WORD_COUNT,
							})
						: undefined
				}
				onChange={(event) => setCount(event.target.value)}
			/>
			<WordlistSelect
				className={className}
				value={language}
				onChange={setLanguage}
			/>
		</>
	);
}
