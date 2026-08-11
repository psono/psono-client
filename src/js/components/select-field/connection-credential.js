import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import storage from "../../services/storage";

const SelectFieldConnectionCredential = ({
	allowedType,
	disabled,
	error,
	helperText,
	label,
	onChange,
	value,
}) => {
	const { t } = useTranslation();
	const [options, setOptions] = useState([]);
	const [loaded, setLoaded] = useState(false);
	useEffect(() => {
		let active = true;
		setLoaded(false);
		storage
			.where(
				"datastore-password-leafs",
				(credential) => credential.type === allowedType,
			)
			.then((credentials) => {
				if (!active) {
					return;
				}
				setOptions(
					credentials.map((credential) => ({
						label: credential.name,
						secret_id: credential.secret_id,
						secret_key: credential.secret_key,
						type: credential.type,
					})),
				);
				setLoaded(true);
			});
		return () => {
			active = false;
		};
	}, [allowedType]);

	const selectedValue =
		options.find((option) => option.secret_id === value?.secret_id) || value;
	const missingReference =
		loaded && Boolean(value?.secret_id) && selectedValue === value;

	return (
		<Autocomplete
			disabled={disabled}
			getOptionLabel={(option) => option?.label || option?.secret_id || ""}
			isOptionEqualToValue={(option, selected) =>
				option.secret_id === selected?.secret_id
			}
			onChange={(_event, selected) => onChange(selected)}
			options={options}
			value={selectedValue}
			renderInput={(params) => (
				<TextField
					{...params}
					error={error || missingReference}
					fullWidth
					helperText={missingReference ? t("BROKEN_REFERENCE") : helperText}
					label={t(label)}
					margin="dense"
					variant="outlined"
				/>
			)}
		/>
	);
};

SelectFieldConnectionCredential.propTypes = {
	allowedType: PropTypes.string.isRequired,
	disabled: PropTypes.bool,
	error: PropTypes.bool,
	helperText: PropTypes.string,
	label: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
	value: PropTypes.object,
};

export default SelectFieldConnectionCredential;
