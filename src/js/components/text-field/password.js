import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import IconButton from "@material-ui/core/IconButton";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";

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
            <IconButton aria-label="toggle show" onClick={() => setShowPassword(!showPassword)} edge="end">
                {showPassword ? <Visibility /> : <VisibilityOff />}
            </IconButton>
        </InputAdornment>
    );

    return <TextField InputProps={localInputProps} {...rest} />;
};

export default TextFieldPassword;
