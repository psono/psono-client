import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from '@mui/material/Autocomplete';
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { makeStyles } from '@mui/styles';
import fileTransferService from "../../services/file-transfer";
import fileRepositoryService from "../../services/file-repository";
import MuiAlert from '@mui/material/Alert'

const useStyles = makeStyles((theme) => ({
    option: {
        fontSize: 15,
        "& > span": {
            marginRight: 10,
            fontSize: 18,
        },
    },
}));

const SelectFieldFileDestination = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const [options, setOptions] = useState([]);
    const [optionsLoaded, setOptionsLoaded] = useState(false);
    let isSubscribed = true;

    const { fullWidth, variant, margin, size, helperText, error, required, onChange, value, className, label } = props;
    React.useEffect(() => {
        loadFileDestinations();
        // cancel subscription to useEffect
        return () => (isSubscribed = false);
    }, []);

    const loadFileDestinations = () => {
        const promises = [];
        promises.push(
            fileTransferService.readShards().then(function (shards) {
                shards = fileTransferService.filterShards(shards, null, true);

                for (let i = 0; i < shards.length; i++) {
                    shards[i]["name"] = shards[i]["shard_title"];
                    shards[i]["destination_type"] = "shard";
                }
                return shards;
            })
        );
        promises.push(
            fileRepositoryService.readFileRepositories().then(function (fileRepositories) {
                fileRepositories = fileRepositoryService.filterFileRepositories(
                    fileRepositories,
                    null,
                    null,
                    true,
                    true
                );

                for (let i = 0; i < fileRepositories.length; i++) {
                    fileRepositories[i]["name"] = fileRepositories[i]["title"];
                    fileRepositories[i]["destination_type"] = "file_repository";
                }

                return fileRepositories;
            })
        );

        Promise.all(promises).then(function (data) {
            const _shards = data[0];
            const _fileRepositories = data[1];
            const shardCount = _shards.length;
            const fileRepositoryCount = _fileRepositories.length;
            const allPossibilitiesCount = shardCount + fileRepositoryCount;

            if (!isSubscribed) return;
            setOptions(_shards.concat(_fileRepositories));
            setOptionsLoaded(true);

            if (allPossibilitiesCount === 0) {
                // no possiblity, the user will get an error anyway when he wants to create the file
                return;
            }

            if (shardCount > 0) {
                // only shards are available, so lets pick the first shard as default shard
                onChange(_shards[0]);
            } else if (fileRepositoryCount > 0) {
                // only repositories are available, so lets pick the first repository as default repository
                onChange(_fileRepositories[0]);
            }
        });
    };

    // hide the input field if there is only 1 destination and no option to choose from
    if (options.length === 1) {
        return null;
    }

    if (optionsLoaded && options.length === 0) {
        return <MuiAlert severity="error">{t("NO_FILESERVER_AVAILABLE")}</MuiAlert>;
    }

    return (
        <Autocomplete
            options={options}
            classes={{
                option: classes.option,
            }}
            autoHighlight
            getOptionLabel={(option) => {
                return option ? option.name : "";
            }}
            onChange={(event, newValue) => {
                if (newValue) {
                    onChange(newValue);
                } else {
                    onChange(null);
                }
            }}
            isOptionEqualToValue={(option, value) => {
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
                    label={t(label)}
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

SelectFieldFileDestination.defaultProps = {
    error: false,
    label: "TARGET_STORAGE",
};

SelectFieldFileDestination.propTypes = {
    value: PropTypes.object,
    fullWidth: PropTypes.bool,
    error: PropTypes.bool,
    required: PropTypes.bool,
    helperText: PropTypes.string,
    label: PropTypes.string,
    variant: PropTypes.string,
    margin: PropTypes.string,
    size: PropTypes.string,
    onChange: PropTypes.func,
    className: PropTypes.string,
};

export default SelectFieldFileDestination;
