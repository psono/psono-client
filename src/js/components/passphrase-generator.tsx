import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import { IconButton, InputAdornment, MenuItem, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
	generatePassphrase,
	isValidWordCount,
	MAX_WORD_COUNT,
	MIN_WORD_COUNT,
	normalizeWordCount,
	passphraseEntropy,
	resolveWordlistLanguage,
	wordlistLanguages,
} from "../services/passphrase";
import TextFieldColored from "./text-field/colored";
import GeneratorStrength from "./generator-strength";

export function GeneratorTypeSelect({
	value,
	onChange,
	className,
	label = "GENERATOR",
	id,
}: {
	value: "password" | "passphrase";
	onChange: (value: "password" | "passphrase") => void;
	className?: string;
	label?: string;
	id?: string;
}) {
	const { t } = useTranslation();
	return (
		<TextField
			select
			fullWidth
			className={className}
			variant="outlined"
			margin="dense"
			size="small"
			label={t(label)}
			id={id}
			value={value}
			onChange={(event) =>
				onChange(
					event.target.value === "passphrase" ? "passphrase" : "password",
				)
			}
		>
			<MenuItem value="password">{t("PASSWORD_GENERATOR")}</MenuItem>
			<MenuItem value="passphrase">{t("PASSPHRASE_GENERATOR")}</MenuItem>
		</TextField>
	);
}

export function WordlistSelect({
	value,
	onChange,
	className,
	allowAutomatic = false,
}: {
	value: string;
	onChange: (value: string) => void;
	className?: string;
	allowAutomatic?: boolean;
}) {
	const { t } = useTranslation();
	return (
		<TextField
			select
			fullWidth
			className={className}
			variant="outlined"
			margin="dense"
			size="small"
			label={t("WORDLIST_LANGUAGE")}
			value={value}
			onChange={(event) => onChange(event.target.value)}
		>
			{allowAutomatic && <MenuItem value="">{t("FRONTEND_LANGUAGE")}</MenuItem>}
			{Object.entries(wordlistLanguages).map(([language, name]) => (
				<MenuItem key={language} value={language}>
					{name}
				</MenuItem>
			))}
		</TextField>
	);
}

/** Shared by the entry dialog and the browser extension popup. */
export default function PassphraseGenerator({
	onChange,
	className,
}: {
	onChange: (value: string) => void;
	className?: string;
}) {
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
	const [generated, setGenerated] = useState(() => ({
		value: generatePassphrase(count, language),
		entropy: passphraseEntropy(count, language),
	}));
	const [password, setPassword] = useState(generated.value);

	useEffect(() => {
		onChange(password);
	}, [password, onChange]);

	const regenerate = (nextCount = count, nextLanguage = language) => {
		if (!isValidWordCount(nextCount)) return;
		const value = generatePassphrase(nextCount, nextLanguage);
		setGenerated({
			value,
			entropy: passphraseEntropy(nextCount, nextLanguage),
		});
		setPassword(value);
	};
	const entropy = password === generated.value ? generated.entropy : undefined;

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
				autoComplete="off"
				onChange={(event) => setPassword(event.target.value)}
				InputProps={{
					classes: { input: "psono-addPasswordFormButtons-covered" },
					style: { fontFamily: "'Fira Code', monospace" },
					endAdornment: (
						<InputAdornment position="end">
							<IconButton
								aria-label={t("GENERATE_PASSPHRASE")}
								disabled={!isValidWordCount(count)}
								onClick={() => regenerate()}
								edge="end"
							>
								<ReplayRoundedIcon fontSize="small" />
							</IconButton>
						</InputAdornment>
					),
				}}
			/>
			<GeneratorStrength mode="passphrase" entropy={entropy} />
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
				onChange={(event) => {
					setCount(event.target.value);
					regenerate(event.target.value);
				}}
			/>
			<WordlistSelect
				className={className}
				value={language}
				onChange={(value) => {
					setLanguage(value);
					regenerate(count, value);
				}}
			/>
		</>
	);
}
