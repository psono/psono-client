import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";
import PropTypes from "prop-types";
import React from "react";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles((theme) => ({
	option: {
		fontSize: 15,
		"& > span": {
			marginRight: 10,
			fontSize: 18,
		},
	},
}));

const SelectFieldCustomFieldType = (props) => {
	const classes = useStyles();
	const { t } = useTranslation();

	const customFieldTypes = [
		{ title: "TEXT", value: "text" },
		{ title: "PASSWORD", value: "password" },
	];

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
	} = props;

	let defaulValue = null;
	if (value && customFieldTypes && customFieldTypes.length) {
		defaulValue = customFieldTypes.find((country) => country.value === value);
	}

	return (
		<Autocomplete
			options={customFieldTypes}
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
			value={defaulValue}
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

SelectFieldCustomFieldType.defaultProps = {
	error: false,
};

SelectFieldCustomFieldType.propTypes = {
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

export default SelectFieldCustomFieldType;
