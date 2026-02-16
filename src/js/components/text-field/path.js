import * as React from "react";
import PropTypes from "prop-types";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputAdornment from "@mui/material/InputAdornment";
import { useTranslation } from "react-i18next";
import OutlinedInput from "@mui/material/OutlinedInput";
import IconButton from "@mui/material/IconButton";
import ClearIcon from "@mui/icons-material/Clear";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

const TextFieldPath = (props) => {
    const { value, setPath, onOpenFolderSelect, helperText, required, ...other } = props;
    const { t } = useTranslation();

    return (
        <FormControl {...other}>
            <InputLabel shrink required={required} htmlFor="component-simple">
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
                    (onOpenFolderSelect || value.length > 0) && (
                        <InputAdornment position="end">
                            {onOpenFolderSelect && (
                                <IconButton
                                    aria-label="select folder"
                                    onClick={onOpenFolderSelect}
                                    edge="end"
                                    size="large">
                                    <FolderOpenIcon fontSize="small" />
                                </IconButton>
                            )}
                            {value.length > 0 && (
                                <IconButton
                                    aria-label="clear path"
                                    onClick={() => setPath([])}
                                    edge="end"
                                    size="large">
                                    <ClearIcon fontSize="small" />
                                </IconButton>
                            )}
                        </InputAdornment>
                    )
                }
            />
            {helperText && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
    );
};

TextFieldPath.propTypes = {
    value: PropTypes.array.isRequired,
    setPath: PropTypes.func.isRequired,
    onOpenFolderSelect: PropTypes.func,
    helperText: PropTypes.string,
    required: PropTypes.bool,
};

export default TextFieldPath;
