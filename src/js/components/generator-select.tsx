import { MenuItem, TextField } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { wordlistLanguages } from "../services/passphrase-config";

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
