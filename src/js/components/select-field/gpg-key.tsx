import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import datastoreService from "../../services/datastore";
import datastorePasswordService from "../../services/datastore-password";
import type { GpgKeyOption, SelectFieldProps } from "../../../types/components";

const useStyles = makeStyles((theme) => ({
	option: {
		fontSize: 15,
		"& > span": {
			marginRight: 10,
			fontSize: 18,
		},
	},
}));

export type SelectFieldGpgKeyProps = SelectFieldProps<GpgKeyOption | null> & {
	label?: string;
	secretId?: string;
};

const SelectFieldGpgKey = (props: SelectFieldGpgKeyProps) => {
	const classes = useStyles();
	const { t } = useTranslation();
	const gpgDefaultKey = useSelector(
		(state) => state.settingsDatastore.gpgDefaultKey,
	);
	const [options, setOptions] = useState<GpgKeyOption[]>([]);
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
		secretId,
		label = "YOUR_KEY",
	} = props;
	React.useEffect(() => {
		loadGpgKeys();
		// cancel subscription to useEffect
		return () => {
			isSubscribed = false;
		};
	}, []);

	const loadGpgKeys = () => {
		datastorePasswordService.getPasswordDatastore().then((datastore) => {
			if (!isSubscribed) {
				return;
			}

			const ownPgpSecrets: GpgKeyOption[] = [];

			let default_secret: GpgKeyOption | undefined;

			datastoreService.filter(datastore, (item) => {
				if (
					!Object.hasOwn(item, "type") ||
					item["type"] !== "mail_gpg_own_key"
				) {
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
				if (
					!default_secret &&
					gpgDefaultKey &&
					Object.hasOwn(gpgDefaultKey, "id") &&
					gpgDefaultKey.id === item.id
				) {
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
				return option ? option.label! : "";
			}}
			onChange={(event, newValue) => {
				if (newValue) {
					onChange(newValue);
				} else {
					onChange(null);
				}
			}}
			isOptionEqualToValue={(option, value) => {
				if (value !== null && option) {
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
	size: PropTypes.string,
	onChange: PropTypes.func,
	className: PropTypes.string,
	secretId: PropTypes.string,
};

export default SelectFieldGpgKey;
