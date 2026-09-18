import MuiAlert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import fileRepositoryService from "../../services/file-repository";
import fileTransferService from "../../services/file-transfer";
import type {
	FileDestination,
	SelectFieldProps,
} from "../../../types/components";
import type { Shard } from "../../../types/files";

const useStyles = makeStyles((theme) => ({
	option: {
		fontSize: 15,
		"& > span": {
			marginRight: 10,
			fontSize: 18,
		},
	},
}));

export type SelectFieldFileDestinationProps =
	SelectFieldProps<FileDestination | null> & {
		label?: string;
	};

const SelectFieldFileDestination = (props: SelectFieldFileDestinationProps) => {
	const classes = useStyles();
	const { t } = useTranslation();
	const [options, setOptions] = useState<FileDestination[]>([]);
	const [optionsLoaded, setOptionsLoaded] = useState(false);
	let isSubscribed = true;

	const {
		fullWidth,
		variant,
		margin,
		size,
		helperText,
		error,
		required,
		onChange,
		value,
		className,
		label = "TARGET_STORAGE",
	} = props;
	React.useEffect(() => {
		loadFileDestinations();
		// cancel subscription to useEffect
		return () => {
			isSubscribed = false;
		};
	}, []);

	const loadFileDestinations = () => {
		const promises: Promise<FileDestination[]>[] = [];
		promises.push(
			fileTransferService.readShards().then((shards) => {
				shards = fileTransferService.filterShards(shards, null, true);
				// Shard responses include a title; the shared service type omits it.
				return (shards as (Shard & { shard_title: string })[]).map((shard) =>
					Object.assign(shard, {
						name: shard.shard_title,
						destination_type: "shard" as const,
					}),
				);
			}),
		);
		promises.push(
			fileRepositoryService.readFileRepositories().then((fileRepositories) => {
				fileRepositories = fileRepositoryService.filterFileRepositories(
					fileRepositories!,
					null,
					null,
					true,
					true,
				);

				return fileRepositories.map((repository) =>
					Object.assign(repository, {
						name: repository.title,
						destination_type: "file_repository" as const,
					}),
				);
			}),
		);

		Promise.all(promises).then((data) => {
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
				return option ? option.name! : "";
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
					return false;
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
