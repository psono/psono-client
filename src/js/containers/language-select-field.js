import React from "react";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";

import { languages } from "../i18n";

const useStyles = makeStyles((theme) => ({
    option: {
        fontSize: 15,
        "& > span": {
            marginRight: 10,
            fontSize: 18,
        },
    },
}));

const LanguageSelectField = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();

    //const lngs = fileRepository.getPossibleTypes();

    const lngs = [];

    Object.entries(languages).forEach(([key, value]) => {
        if (value.active) {
            lngs.push({ value: value.code, title: value.lng_title_native });
        }
    });

    const { fullWidth, variant, margin, helperText, error, required, onChange, value, className } = props;

    let defaulValue = null;
    if (value && lngs && lngs.length) {
        defaulValue = lngs.find(function (country) {
            return country.value === value;
        });
    }

    return (
        <Autocomplete
            options={lngs}
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
                    label={t("LANGUAGE")}
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

LanguageSelectField.defaultProps = {
    error: false,
};

LanguageSelectField.propTypes = {
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

export default LanguageSelectField;
