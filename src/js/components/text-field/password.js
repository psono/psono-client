import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";
import React, { useState } from "react";

const useStyles = makeStyles((theme) => ({
	passwordField: {
		fontFamily: "'Fira Code', monospace",
	},
}));

const TextFieldPassword = (props) => {
	const classes = useStyles();
	const { InputProps, ...rest } = props;
	const [showPassword, setShowPassword] = useState(false);

	const localInputProps = InputProps || {};

	localInputProps["type"] = showPassword ? "text" : "password";
	localInputProps["classes"] = localInputProps["classes"] || {};
	localInputProps["classes"]["input"] = classes.passwordField;
	localInputProps["endAdornment"] = (
		<InputAdornment position="end">
			<IconButton
				aria-label="toggle show"
				onClick={() => setShowPassword(!showPassword)}
				edge="end"
				size="large"
			>
				{showPassword ? (
					<Visibility fontSize="small" />
				) : (
					<VisibilityOff fontSize="small" />
				)}
			</IconButton>
		</InputAdornment>
	);

	return <TextField InputProps={localInputProps} {...rest} />;
};

export default TextFieldPassword;
