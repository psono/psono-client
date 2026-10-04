import { Grid } from "@mui/material";
import type {
	NumericInputValue,
	SettingsViewProps,
} from "../../../types/settings-ui";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import action from "../../actions/bound-action-creators";
import {
	GeneratorTypeSelect,
	WordlistSelect,
} from "../../components/passphrase-generator";
import {
	isValidWordCount,
	MAX_WORD_COUNT,
	MIN_WORD_COUNT,
	normalizeWordCount,
	resolveWordlistLanguage,
} from "../../services/passphrase";

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

const SettingsPasswordGeneratorView = (props: SettingsViewProps) => {
	const { t } = useTranslation();
	const classes = useStyles();
	const settingsDatastore = useSelector((state) => state.settingsDatastore);
	const server = useSelector((state) => state.server);
	const [passwordLength, setPasswordLength] = useState<NumericInputValue>(
		settingsDatastore.passwordLength,
	);
	const [passwordLettersUppercase, setPasswordLettersUppercase] = useState(
		settingsDatastore.passwordLettersUppercase,
	);
	const [passwordLettersLowercase, setPasswordLettersLowercase] = useState(
		settingsDatastore.passwordLettersLowercase,
	);
	const [passwordNumbers, setPasswordNumbers] = useState(
		settingsDatastore.passwordNumbers,
	);
	const [passwordSpecialChars, setPasswordSpecialChars] = useState(
		settingsDatastore.passwordSpecialChars,
	);
	const [wordCount, setWordCount] = useState<number | string>(
		normalizeWordCount(
			settingsDatastore.passphraseWordCount ??
				server.compliancePasswordGeneratorDefaultWordLength,
		),
	);
	const [wordlistLanguage, setWordlistLanguage] = useState(
		settingsDatastore.passphraseLanguage
			? resolveWordlistLanguage(settingsDatastore.passphraseLanguage)
			: "",
	);
	const [defaultGenerator, setDefaultGenerator] = useState<
		"password" | "passphrase"
	>(
		settingsDatastore.defaultPasswordGenerator === "passphrase"
			? "passphrase"
			: "password",
	);

	React.useEffect(() => {
		setPasswordLength(settingsDatastore.passwordLength);
		setPasswordLettersUppercase(settingsDatastore.passwordLettersUppercase);
		setPasswordLettersLowercase(settingsDatastore.passwordLettersLowercase);
		setPasswordNumbers(settingsDatastore.passwordNumbers);
		setPasswordSpecialChars(settingsDatastore.passwordSpecialChars);
	}, [
		settingsDatastore.passwordLength,
		settingsDatastore.passwordLettersUppercase,
		settingsDatastore.passwordLettersLowercase,
		settingsDatastore.passwordNumbers,
		settingsDatastore.passwordSpecialChars,
	]);

	React.useEffect(() => {
		setWordCount(
			normalizeWordCount(
				settingsDatastore.passphraseWordCount ??
					server.compliancePasswordGeneratorDefaultWordLength,
			),
		);
		setWordlistLanguage(
			settingsDatastore.passphraseLanguage
				? resolveWordlistLanguage(settingsDatastore.passphraseLanguage)
				: "",
		);
	}, [
		settingsDatastore.passphraseWordCount,
		settingsDatastore.passphraseLanguage,
		server.compliancePasswordGeneratorDefaultWordLength,
	]);

	React.useEffect(() => {
		setDefaultGenerator(
			settingsDatastore.defaultPasswordGenerator === "passphrase"
				? "passphrase"
				: "password",
		);
	}, [settingsDatastore.defaultPasswordGenerator]);

	const getDefaultValues = () => {
		// Use compliance defaults if available, otherwise use hardcoded defaults
		return {
			length: server.compliancePasswordGeneratorDefaultPasswordLength || 16,
			uppercase:
				server.compliancePasswordGeneratorDefaultLettersUppercase ||
				"ABCDEFGHIJKLMNOPQRSTUVWXYZ",
			lowercase:
				server.compliancePasswordGeneratorDefaultLettersLowercase ||
				"abcdefghijklmnopqrstuvwxyz",
			numbers: server.compliancePasswordGeneratorDefaultNumbers || "0123456789",
			specialChars:
				server.compliancePasswordGeneratorDefaultSpecialChars ||
				",.-;:_#'+*~!\"$%&/@()=?{[]}\\",
		};
	};

	const resetToDefaults = () => {
		const defaults = getDefaultValues();
		setPasswordLength(defaults.length);
		setPasswordLettersUppercase(defaults.uppercase);
		setPasswordLettersLowercase(defaults.lowercase);
		setPasswordNumbers(defaults.numbers);
		setPasswordSpecialChars(defaults.specialChars);
		action().setPasswordConfig(
			defaults.length,
			defaults.uppercase,
			defaults.lowercase,
			defaults.numbers,
			defaults.specialChars,
		);
	};

	const save = () => {
		action().setPasswordConfig(
			passwordLength,
			passwordLettersUppercase,
			passwordLettersLowercase,
			passwordNumbers,
			passwordSpecialChars,
		);
	};

	return (
		<Grid container>
			<Grid
				item
				xs={12}
				component="section"
				aria-labelledby="default-password-generator-title"
			>
				<h2 id="default-password-generator-title">
					{t("DEFAULT_PASSWORD_GENERATOR")}
				</h2>
				<p>{t("DEFAULT_PASSWORD_GENERATOR_DESCRIPTION")}</p>
				<GeneratorTypeSelect
					id="defaultPasswordGenerator"
					className={classes.textField}
					label="DEFAULT_PASSWORD_GENERATOR"
					value={defaultGenerator}
					onChange={setDefaultGenerator}
				/>
				<Grid
					container
					style={{ marginBottom: "20px", marginTop: "8px" }}
					spacing={2}
				>
					<Grid item>
						<Button
							variant="contained"
							color="primary"
							onClick={() =>
								action().setDefaultPasswordGenerator(defaultGenerator)
							}
						>
							{t("SAVE")}
						</Button>
					</Grid>
					<Grid item>
						<Button
							onClick={() => {
								setDefaultGenerator("password");
								action().setDefaultPasswordGenerator("password");
							}}
						>
							{t("RESET")}
						</Button>
					</Grid>
				</Grid>
				<Divider />
			</Grid>
			<Grid item xs={12} sm={12} md={12}>
				<h2>{t("PASSWORD_GENERATOR")}</h2>
				<p>{t("PASSWORD_GENERATOR_DESCRIPTION")}</p>
				<Divider style={{ marginBottom: "20px" }} />
			</Grid>
			<Grid item xs={12} sm={12} md={12}>
				<TextField
					className={classes.textField}
					variant="outlined"
					margin="dense"
					size="small"
					id="passwordLength"
					label={t("PASSWORD_LENGTH")}
					name="passwordLength"
					autoComplete="off"
					value={passwordLength}
					onChange={(event) => {
						setPasswordLength(event.target.value);
					}}
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
					id="passwordLettersUppercase"
					label={t("LETTERS_UPPERCASE")}
					name="passwordLettersUppercase"
					autoComplete="off"
					value={passwordLettersUppercase}
					onChange={(event) => {
						setPasswordLettersUppercase(event.target.value);
					}}
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
					id="passwordLettersLowercase"
					label={t("LETTERS_LOWERCASE")}
					name="passwordLettersLowercase"
					autoComplete="off"
					value={passwordLettersLowercase}
					onChange={(event) => {
						setPasswordLettersLowercase(event.target.value);
					}}
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
					id="passwordNumbers"
					label={t("NUMBERS")}
					name="passwordNumbers"
					autoComplete="off"
					value={passwordNumbers}
					onChange={(event) => {
						setPasswordNumbers(event.target.value);
					}}
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
					id="passwordSpecialChars"
					label={t("SPECIAL_CHARS")}
					name="passwordSpecialChars"
					autoComplete="off"
					value={passwordSpecialChars}
					onChange={(event) => {
						setPasswordSpecialChars(event.target.value);
					}}
					InputProps={{
						classes: {
							input: classes.passwordField,
						},
					}}
				/>
			</Grid>
			<Grid
				container
				style={{ marginBottom: "8px", marginTop: "8px" }}
				spacing={2}
			>
				<Grid item>
					<Button
						variant="contained"
						color="primary"
						onClick={save}
						disabled={
							(passwordLength as number) <= 0 ||
							(
								passwordLettersUppercase +
								passwordLettersLowercase +
								passwordNumbers +
								passwordSpecialChars
							).length === 0
						}
					>
						{t("SAVE")}
					</Button>
				</Grid>
				<Grid item>
					<Button onClick={resetToDefaults}>{t("RESET")}</Button>
				</Grid>
			</Grid>
			<Grid item xs={12}>
				<h2>{t("PASSPHRASE_GENERATOR")}</h2>
				<p>{t("PASSPHRASE_GENERATOR_DESCRIPTION")}</p>
				<Divider style={{ marginBottom: "20px" }} />
			</Grid>
			<Grid item xs={12}>
				<TextField
					className={classes.textField}
					variant="outlined"
					margin="dense"
					size="small"
					type="number"
					label={t("PASSPHRASE_WORD_COUNT")}
					value={wordCount}
					inputProps={{ min: MIN_WORD_COUNT, max: MAX_WORD_COUNT, step: 1 }}
					error={!isValidWordCount(wordCount)}
					helperText={
						!isValidWordCount(wordCount)
							? t("PASSPHRASE_WORD_COUNT_ERROR", {
									min: MIN_WORD_COUNT,
									max: MAX_WORD_COUNT,
								})
							: undefined
					}
					onChange={(event) => setWordCount(event.target.value)}
				/>
			</Grid>
			<Grid item xs={12}>
				<WordlistSelect
					className={classes.textField}
					value={wordlistLanguage}
					onChange={setWordlistLanguage}
					allowAutomatic
				/>
			</Grid>
			<Grid
				container
				style={{ marginBottom: "8px", marginTop: "8px" }}
				spacing={2}
			>
				<Grid item>
					<Button
						variant="contained"
						color="primary"
						disabled={!isValidWordCount(wordCount)}
						onClick={() =>
							action().setPassphraseConfig(Number(wordCount), wordlistLanguage)
						}
					>
						{t("SAVE")}
					</Button>
				</Grid>
				<Grid item>
					<Button
						onClick={() => {
							const count = normalizeWordCount(
								server.compliancePasswordGeneratorDefaultWordLength,
							);
							setWordCount(count);
							setWordlistLanguage("");
							action().setPassphraseConfig(count, "");
						}}
					>
						{t("RESET")}
					</Button>
				</Grid>
			</Grid>
		</Grid>
	);
};

export default SettingsPasswordGeneratorView;
