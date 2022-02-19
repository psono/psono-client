import React, { useState } from "react";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { makeStyles } from "@material-ui/core/styles";
import datastorePasswordService from "../../services/datastore-password";
import datastoreService from "../../services/datastore";

const useStyles = makeStyles((theme) => ({
    option: {
        fontSize: 15,
        "& > span": {
            marginRight: 10,
            fontSize: 18,
        },
    },
}));

const SelectFieldGpgKey = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const gpgDefaultKey = useSelector((state) => state.settingsDatastore.gpgDefaultKey);
    const [options, setOptions] = useState([]);
    let isSubscribed = true;

    const { fullWidth, variant, margin, helperText, error, required, onChange, value, className, secretId, label } = props;
    React.useEffect(() => {
        loadGpgKeys();
        // cancel subscription to useEffect
        return () => (isSubscribed = false);
    }, []);

    const loadGpgKeys = () => {
        datastorePasswordService.getPasswordDatastore().then(function (datastore) {
            if (!isSubscribed) {
                return;
            }

            const ownPgpSecrets = [];

            let default_secret;

            datastoreService.filter(datastore, function (item) {
                if (!item.hasOwnProperty("type") || item["type"] !== "mail_gpg_own_key") {
                    return;
                }

                const ownPgpSecret = {
                    id: item.id,
                    label: item.name,
                    secret_id: item.secret_id,
                    secret_key: item.secret_key,
                };

                if (secretId && item.secret_id === secretId) {
                    default_secret = ownPgpSecret;
                }
                if (!default_secret && gpgDefaultKey && gpgDefaultKey.hasOwnProperty("id") && gpgDefaultKey.id === item.id) {
                    default_secret = ownPgpSecret;
                }
                ownPgpSecrets.push(ownPgpSecret);
            });

            if (default_secret) {
                onChange(default_secret);
            }
            setOptions(ownPgpSecrets);
        });
    };

    return (
        <Autocomplete
            options={options}
            classes={{
                option: classes.option,
            }}
            autoHighlight
            getOptionLabel={(option) => {
                return option ? option.label : "";
            }}
            renderOption={(option) => <>{option ? option.label : ""}</>}
            onChange={(event, newValue) => {
                if (newValue) {
                    onChange(newValue);
                } else {
                    onChange(null);
                }
            }}
            getOptionSelected={(option, value) => {
                if (option) {
                    return option.id === value.id;
                } else {
                    return "";
                }
            }}
            value={value}
            renderInput={(params) => (
                <TextField
                    className={className}
                    {...params}
                    label={label}
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

SelectFieldGpgKey.defaultProps = {
    error: false,
    label: "YOUR_KEY",
};

SelectFieldGpgKey.propTypes = {
    value: PropTypes.object,
    fullWidth: PropTypes.bool,
    error: PropTypes.bool,
    required: PropTypes.bool,
    helperText: PropTypes.string,
    label: PropTypes.string,
    variant: PropTypes.string,
    margin: PropTypes.string,
    onChange: PropTypes.func,
    className: PropTypes.string,
    secretId: PropTypes.string,
};

export default SelectFieldGpgKey;
