import TextField from "@mui/material/TextField";
import type { InputBaseComponentProps } from "@mui/material/InputBase";
import PropTypes from "prop-types";
import * as React from "react";
import NumberFormat from "react-number-format";
import type {
	FormattedInputProps,
	FormattedTextFieldProps,
} from "../../../types/components";

const InputComponent = React.forwardRef<HTMLInputElement, FormattedInputProps>(
	function InputComponent(props, ref) {
		const { onChange, ...other } = props;

		return (
			<NumberFormat
				{...other}
				format="####"
				onValueChange={(values) => {
					onChange({
						target: {
							name: props.name,
							value: values.value,
						},
					});
				}}
				isNumericString
				getInputRef={ref}
			/>
		);
	},
);

InputComponent.propTypes = {
	name: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
};

export type TextFieldCreditCardCVCProps = FormattedTextFieldProps;

const TextFieldCreditCardCVC = (props: TextFieldCreditCardCVCProps) => {
	return (
		<TextField
			{...props}
			InputProps={{
				...props.InputProps,
				// MUI forwards input props; NumberFormat supplies the public target-only event.
				inputComponent:
					InputComponent as unknown as React.ElementType<InputBaseComponentProps>,
			}}
		/>
	);
};

TextFieldCreditCardCVC.propTypes = {
	value: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
};

export default TextFieldCreditCardCVC;
