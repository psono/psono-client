import * as React from "react";
import PropTypes from "prop-types";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import InputAdornment from "@material-ui/core/InputAdornment";
import { useTranslation } from "react-i18next";
import OutlinedInput from "@material-ui/core/OutlinedInput";
import IconButton from "@material-ui/core/IconButton";
import ClearIcon from "@material-ui/icons/Clear";

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
                margin="dense"
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
                            <IconButton aria-label="clear path" onClick={() => setPath([])} edge="end">
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
