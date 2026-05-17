import ColorLensIcon from "@mui/icons-material/ColorLens";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";
import PropTypes from "prop-types";
import React from "react";
import { useTranslation } from "react-i18next";

import folderColorService from "../../services/folder-color";

const useStyles = makeStyles((theme) => ({
	textField: {
		width: "100%",
	},
	colorPickerButton: {
		position: "relative",
		overflow: "hidden",
		border: `1px solid ${theme.palette.divider}`,
		backgroundColor: theme.palette.background.default,
	},
	colorPickerInput: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		width: "100%",
		height: "100%",
		opacity: 0,
		cursor: "pointer",
	},
}));

const FolderColorField = (props) => {
	const { value, onChange, error } = props;
	const { t } = useTranslation();
	const classes = useStyles();
	const normalizedColor = folderColorService.normalizeFolderColor(value);
	const backgroundColor = `#${normalizedColor}`;
	const contrastColor =
		folderColorService.getFolderColorContrastColor(normalizedColor);

	return (
		<TextField
			className={classes.textField}
			variant="outlined"
			margin="dense"
			size="small"
			id="folderColor"
			label={t("FOLDER_COLOR")}
			name="folderColor"
			autoComplete="off"
			value={value}
			error={error}
			helperText={error ? t("FOLDER_COLOR_INVALID") : " "}
			onChange={(event) => {
				onChange(
					folderColorService.sanitizeFolderColorInput(event.target.value),
				);
			}}
			inputProps={{
				maxLength: 6,
				pattern: "[0-9a-fA-F]{6}",
			}}
			InputProps={{
				startAdornment: <InputAdornment position="start">#</InputAdornment>,
				endAdornment: (
					<InputAdornment position="end">
						<IconButton
							aria-label={t("SELECT_FOLDER_COLOR")}
							className={classes.colorPickerButton}
							component="label"
							size="small"
							style={{ backgroundColor: contrastColor }}
						>
							<ColorLensIcon
								fontSize="small"
								style={{ color: backgroundColor }}
							/>
							<input
								className={classes.colorPickerInput}
								type="color"
								value={backgroundColor}
								onChange={(event) => {
									onChange(event.target.value.replace("#", ""));
								}}
							/>
						</IconButton>
					</InputAdornment>
				),
			}}
		/>
	);
};

FolderColorField.propTypes = {
	onChange: PropTypes.func.isRequired,
	value: PropTypes.string.isRequired,
	error: PropTypes.bool.isRequired,
};

export default FolderColorField;
