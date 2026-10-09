import TextField from "@mui/material/TextField";
import type { InputBaseComponentProps } from "@mui/material/InputBase";
import PropTypes from "prop-types";
import * as React from "react";
import NumberFormat from "react-number-format";
import type {
	FormattedInputProps,
	FormattedTextFieldProps,
} from "../../../types/components";

const CreditCardFormat = React.forwardRef<
	HTMLInputElement,
	FormattedInputProps
>(function CreditCardFormat(props, ref) {
	const { onChange, ...other } = props;
	return (
		<NumberFormat
			{...other}
			format="#### #### #### #### ####"
			onValueChange={(values) => {
				onChange({
					target: {
						name: props.name,
						value: values.value,
					},
				});
			}}
			isNumericString
			getInputRef={ref} // Pass the ref to NumberFormat
		/>
	);
});

CreditCardFormat.propTypes = {
	name: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
};

export type TextFieldCreditCardNumberProps = FormattedTextFieldProps;

const TextFieldCreditCardNumber = (props: TextFieldCreditCardNumberProps) => {
	return (
		<TextField
			{...props}
			InputProps={{
				...props.InputProps,
				// MUI forwards input props; NumberFormat supplies the public target-only event.
				inputComponent:
					CreditCardFormat as unknown as React.ElementType<InputBaseComponentProps>,
			}}
		/>
	);
};

TextFieldCreditCardNumber.propTypes = {
	value: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
};

export default TextFieldCreditCardNumber;
