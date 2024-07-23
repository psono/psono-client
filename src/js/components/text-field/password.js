import React, { useState } from "react";
import { makeStyles } from '@mui/styles';
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const useStyles = makeStyles((theme) => ({
    passwordField: {
        fontFamily: "'Fira Code', monospace",
    },
}));

const TextFieldPassword = (props) => {
    const classes = useStyles();
    const { InputProps, ...rest } = props;
    const [showPassword, setShowPassword] = useState(false);

    let localInputProps = InputProps || {};

    localInputProps["type"] = showPassword ? "text" : "password";
    localInputProps["classes"] = localInputProps["classes"] || {};
    localInputProps["classes"]["input"] = classes.passwordField;
    localInputProps["endAdornment"] = (
        <InputAdornment position="end">
            <IconButton
                aria-label="toggle show"
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                size="large">
                {showPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
            </IconButton>
        </InputAdornment>
    );

    return <TextField InputProps={localInputProps} {...rest} />;
};

export default TextFieldPassword;
