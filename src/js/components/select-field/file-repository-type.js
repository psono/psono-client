import React from "react";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import fileRepository from "../../services/file-repository";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
    option: {
        fontSize: 15,
        "& > span": {
            marginRight: 10,
            fontSize: 18,
        },
    },
}));

const SelectFieldFileRepositoryType = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();

    const fileRepositoryTypes = fileRepository.getPossibleTypes();

    const { fullWidth, variant, margin, helperText, error, required, onChange, value, className } = props;

    let defaulValue = null;
    if (value && fileRepositoryTypes && fileRepositoryTypes.length) {
        defaulValue = fileRepositoryTypes.find(function (country) {
            return country.value === value;
        });
    }

    return (
        <Autocomplete
            options={fileRepositoryTypes}
            classes={{
                option: classes.option,
            }}
            autoHighlight
            getOptionLabel={(option) => {
                return option ? option.title : "";
            }}
            renderOption={(option) => <>{option ? option.title : ""}</>}
            onChange={(event, newValue) => {
                if (newValue) {
                    onChange(newValue.value);
                } else {
                    onChange("");
                }
            }}
            getOptionSelected={(option, value) => {
                if (option) {
                    return option.value === value.value;
                } else {
                    return "";
                }
            }}
            value={defaulValue}
            renderInput={(params) => (
                <TextField
                    className={className}
                    {...params}
                    label={t("TYPE")}
                    required={required}
                    margin={margin}
                    variant={variant}
                    helperText={helperText}
                    error={error}
                    fullWidth={fullWidth}
                    inputProps={{
                        ...params.inputProps,
                        autoComplete: "new-password", // disable autocomplete and autofill
                    }}
                />
            )}
        />
    );
};

SelectFieldFileRepositoryType.defaultProps = {
    error: false,
};

SelectFieldFileRepositoryType.propTypes = {
    value: PropTypes.string,
    fullWidth: PropTypes.bool,
    error: PropTypes.bool,
    required: PropTypes.bool,
    helperText: PropTypes.string,
    variant: PropTypes.string,
    margin: PropTypes.string,
    onChange: PropTypes.func,
    className: PropTypes.string,
};

export default SelectFieldFileRepositoryType;
