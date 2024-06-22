import React from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from '@mui/material/Autocomplete';
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { makeStyles } from '@mui/styles';

import itemBlueprintService from "../../services/item-blueprint";

const useStyles = makeStyles((theme) => ({
    option: {
        fontSize: 15,
        "& > span": {
            marginRight: 10,
            fontSize: 18,
        },
    },
}));

const SelectFieldEntryType = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();

    const { fullWidth, variant, margin, size, helperText, error, required, onChange, value, className } = props;

    const entryTypes = itemBlueprintService.getEntryTypes(true);

    let defaultValue = null;
    if (value) {
        defaultValue = entryTypes.find(function (entryType) {
            return entryType.value === value;
        });
    }

    return (
        <Autocomplete
            options={entryTypes.sort((a, b) => t(a.title).localeCompare(t(b.title)))}
            classes={{
                option: classes.option,
            }}
            autoHighlight
            getOptionLabel={(option) => {
                return option ? t(option.title) : "";
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
            value={defaultValue}
            renderInput={(params) => (
                <TextField
                    className={className}
                    {...params}
                    label={t("TYPE")}
                    required={required}
                    margin={margin}
                    size={size}
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

SelectFieldEntryType.defaultProps = {
    error: false,
};

SelectFieldEntryType.propTypes = {
    value: PropTypes.string,
    fullWidth: PropTypes.bool,
    error: PropTypes.bool,
    required: PropTypes.bool,
    helperText: PropTypes.string,
    variant: PropTypes.string,
    margin: PropTypes.string,
    size: PropTypes.string,
    onChange: PropTypes.func,
    className: PropTypes.string,
};

export default SelectFieldEntryType;
