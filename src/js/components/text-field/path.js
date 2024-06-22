import * as React from "react";
import PropTypes from "prop-types";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import { useTranslation } from "react-i18next";
import OutlinedInput from "@mui/material/OutlinedInput";
import IconButton from "@mui/material/IconButton";
import ClearIcon from "@mui/icons-material/Clear";

const TextFieldPath = (props) => {
    const { value, setPath, ...other } = props;
    const { t } = useTranslation();

    return (
        <FormControl {...other}>
            <InputLabel shrink htmlFor="component-simple">
                {t("PATH")}
            </InputLabel>
            <OutlinedInput
                id="component-simple"
                margin="dense" size="small"
                inputComponent="div"
                notched
                value
                label={t("PATH")}
                inputProps={{
                    children: (
                        <>
                            \
                            {value.map((path, index) => {
                                return (
                                    <span
                                        key={index}
                                        onClick={() => {
                                            setPath(value.slice(0, index + 1));
                                        }}
                                    >
                                        {path.name + "\\"}
                                    </span>
                                );
                            })}
                        </>
                    ),
                }}
                endAdornment={
                    value.length > 0 && (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="clear path"
                                onClick={() => setPath([])}
                                edge="end"
                                size="large">
                                <ClearIcon fontSize="small" />
                            </IconButton>
                        </InputAdornment>
                    )
                }
            />
        </FormControl>
    );
};

TextFieldPath.propTypes = {
    value: PropTypes.array.isRequired,
    setPath: PropTypes.func.isRequired,
};

export default TextFieldPath;
