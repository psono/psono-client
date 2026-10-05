import { Check } from "@mui/icons-material";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import { Checkbox, Divider, Grid } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { DialogProps } from "../../../types/dialogs";
import datastorePassword from "../../services/datastore-password";
import { passwordEntropy } from "../../services/password-entropy";
import GeneratorStrength from "../generator-strength";
import TextFieldColored from "../text-field/colored";
import { GeneratorTypeSelect } from "../generator-select";
import PassphraseGenerator from "../passphrase-generator-lazy";

const useStyles = makeStyles((theme) => ({
	textField: {
		width: "100%",
	},
	checked: {
		color: theme.palette.checked.main,
	},
	checkedIcon: {
		width: "20px",
		height: "20px",
		border: `1px solid ${theme.palette.greyText.main}`,
		borderRadius: "3px",
	},
	uncheckedIcon: {
		width: "0px",
		height: "0px",
		padding: "9px",
		border: `1px solid ${theme.palette.greyText.main}`,
		borderRadius: "3px",
	},
	passwordField: {
		fontFamily: "'Fira Code', monospace",
	},
	regularButtonText: {
		color: theme.palette.lightGreyText.main,
	},
}));

export interface DialogGeneratePasswordProps extends DialogProps {
	onConfirm: (password: string) => void;
}

const DialogGeneratePassword = (props: DialogGeneratePasswordProps) => {
	const { open, onClose, onConfirm } = props;
	const { t } = useTranslation();
	const classes = useStyles();
	const [includeLettersLowercase, setIncludeLettersLowercase] = useState(true);
	const [includeLettersUppercase, setIncludeLettersUppercase] = useState(true);
	const [includeNumbers, setIncludeNumbers] = useState(true);
	const [includeSpecialChars, setIncludeSpecialChars] = useState(true);
	const settingsDatastore = useSelector((state) => state.settingsDatastore);
	const [generator, setGenerator] = useState<"password" | "passphrase">(
		settingsDatastore.defaultPasswordGenerator === "passphrase"
			? "passphrase"
			: "password",
	);
	const [passwordLength, setPasswordLength] = useState<number | string>(
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
	const [password, setPassword] = useState(() =>
		generator === "passphrase"
			? ""
			: datastorePassword.generate(
					passwordLength,
					passwordLettersUppercase,
					passwordLettersLowercase,
					passwordNumbers,
					passwordSpecialChars,
				),
	);
	const [generated, setGenerated] = useState(() => ({
		value: password,
		entropy: passwordEntropy(
			password.length,
			passwordLettersUppercase +
				passwordLettersLowercase +
				passwordNumbers +
				passwordSpecialChars,
		),
	}));

	const generatePassword = (
		passwordLength: number | string,
		passwordLettersUppercase: string,
		passwordLettersLowercase: string,
		passwordNumbers: string,
		passwordSpecialChars: string,
	) => {
		const password = datastorePassword.generate(
			passwordLength,
			passwordLettersUppercase,
			passwordLettersLowercase,
			passwordNumbers,
			passwordSpecialChars,
		);
		setGenerated({
			value: password,
			entropy: passwordEntropy(
				password.length,
				passwordLettersUppercase +
					passwordLettersLowercase +
					passwordNumbers +
					passwordSpecialChars,
			),
		});
		setPassword(password);
	};

	return (
		<Dialog
			fullWidth
			maxWidth={"sm"}
			open={open}
			onClose={() => {
				onClose();
			}}
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
		>
			<DialogTitle id="alert-dialog-title">
				{t(
					generator === "passphrase"
						? "GENERATE_PASSPHRASE"
						: "GENERATE_PASSWORD",
				)}
			</DialogTitle>
			<DialogContent>
				<GeneratorTypeSelect
					value={generator}
					onChange={(value) => {
						setGenerator(value);
						if (value === "password") {
							generatePassword(
								passwordLength,
								includeLettersUppercase ? passwordLettersUppercase : "",
								includeLettersLowercase ? passwordLettersLowercase : "",
								includeNumbers ? passwordNumbers : "",
								includeSpecialChars ? passwordSpecialChars : "",
							);
						} else {
							setPassword("");
						}
					}}
				/>
				{generator === "passphrase" ? (
					<PassphraseGenerator onChange={setPassword} />
				) : (
					<>
						<Grid container>
							<Grid item xs={12} sm={12} md={12}>
								<TextFieldColored
									className={classes.textField}
									variant="outlined"
									margin="dense"
									size="small"
									id="password"
									label={t("PASSWORD")}
									name="password"
									autoComplete="off"
									value={password}
									required
									onChange={(event) => {
										setPassword(event.target.value);
									}}
									InputProps={{
										classes: {
											input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
										},
										endAdornment: (
											<InputAdornment position="end">
												<IconButton
													aria-label="generate"
													onClick={() =>
														generatePassword(
															passwordLength,
															includeLettersUppercase
																? passwordLettersUppercase
																: "",
															includeLettersLowercase
																? passwordLettersLowercase
																: "",
															includeNumbers ? passwordNumbers : "",
															includeSpecialChars ? passwordSpecialChars : "",
														)
													}
													edge="end"
													className={classes.regularButtonText}
													size="large"
												>
													<ReplayRoundedIcon fontSize="small" />
												</IconButton>
											</InputAdornment>
										),
									}}
								/>
								<GeneratorStrength
									mode="password"
									entropy={
										password === generated.value ? generated.entropy : undefined
									}
								/>
							</Grid>
						</Grid>

						<Grid item xs={12} sm={12} md={12}>
							<Divider />
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
									generatePassword(
										event.target.value,
										includeLettersUppercase ? passwordLettersUppercase : "",
										includeLettersLowercase ? passwordLettersLowercase : "",
										includeNumbers ? passwordNumbers : "",
										includeSpecialChars ? passwordSpecialChars : "",
									);
									setPasswordLength(event.target.value);
								}}
							/>
						</Grid>
						<Grid item xs={12} sm={12} md={12}>
							<Checkbox
								checked={includeLettersUppercase}
								onChange={(event) => {
									generatePassword(
										passwordLength,
										event.target.checked ? passwordLettersUppercase : "",
										includeLettersLowercase ? passwordLettersLowercase : "",
										includeNumbers ? passwordNumbers : "",
										includeSpecialChars ? passwordSpecialChars : "",
									);
									setIncludeLettersUppercase(event.target.checked);
								}}
								checkedIcon={<Check className={classes.checkedIcon} />}
								icon={<Check className={classes.uncheckedIcon} />}
								classes={{
									checked: classes.checked,
								}}
							/>{" "}
							{t("LETTERS_UPPERCASE")}
						</Grid>
						<Grid item xs={12} sm={12} md={12}>
							<Checkbox
								checked={includeLettersLowercase}
								onChange={(event) => {
									generatePassword(
										passwordLength,
										includeLettersUppercase ? passwordLettersUppercase : "",
										event.target.checked ? passwordLettersLowercase : "",
										includeNumbers ? passwordNumbers : "",
										includeSpecialChars ? passwordSpecialChars : "",
									);
									setIncludeLettersLowercase(event.target.checked);
								}}
								checkedIcon={<Check className={classes.checkedIcon} />}
								icon={<Check className={classes.uncheckedIcon} />}
								classes={{
									checked: classes.checked,
								}}
							/>{" "}
							{t("LETTERS_LOWERCASE")}
						</Grid>
						<Grid item xs={12} sm={12} md={12}>
							<Checkbox
								checked={includeNumbers}
								onChange={(event) => {
									generatePassword(
										passwordLength,
										includeLettersUppercase ? passwordLettersUppercase : "",
										includeLettersLowercase ? passwordLettersLowercase : "",
										event.target.checked ? passwordNumbers : "",
										includeSpecialChars ? passwordSpecialChars : "",
									);
									setIncludeNumbers(event.target.checked);
								}}
								checkedIcon={<Check className={classes.checkedIcon} />}
								icon={<Check className={classes.uncheckedIcon} />}
								classes={{
									checked: classes.checked,
								}}
							/>{" "}
							{t("NUMBERS")}
						</Grid>
						<Grid item xs={12} sm={12} md={12}>
							<Checkbox
								checked={includeSpecialChars}
								onChange={(event) => {
									generatePassword(
										passwordLength,
										includeLettersUppercase ? passwordLettersUppercase : "",
										includeLettersLowercase ? passwordLettersLowercase : "",
										includeNumbers ? passwordNumbers : "",
										event.target.checked ? passwordSpecialChars : "",
									);
									setIncludeSpecialChars(event.target.checked);
								}}
								checkedIcon={<Check className={classes.checkedIcon} />}
								icon={<Check className={classes.uncheckedIcon} />}
								classes={{
									checked: classes.checked,
								}}
							/>{" "}
							{t("SPECIAL_CHARS")}
						</Grid>
					</>
				)}
			</DialogContent>
			<DialogActions>
				<Button
					onClick={() => {
						onClose();
					}}
				>
					{t("CLOSE")}
				</Button>
				<Button
					onClick={() => {
						onConfirm(password);
					}}
					variant="contained"
					color="primary"
					disabled={!password}
				>
					{t("CONFIRM")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default DialogGeneratePassword;
