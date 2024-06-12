import React from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from '@mui/material/Autocomplete';
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import fileRepository from "../../services/file-repository";
import { makeStyles } from '@mui/styles';

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

    const { fullWidth, variant, size, margin, helperText, error, required, onChange, value, className } = props;

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
            onChange={(event, newValue) => {
                if (newValue) {
                    onChange(newValue.value);
                } else {
                    onChange("");
                }
            }}
            isOptionEqualToValue={(option, value) => {
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
                    size={size}
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
    size: PropTypes.string,
    margin: PropTypes.string,
    onChange: PropTypes.func,
    className: PropTypes.string,
};

export default SelectFieldFileRepositoryType;
