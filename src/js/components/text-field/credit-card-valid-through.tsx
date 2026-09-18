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
				format="## / ##"
				onValueChange={(values) => {
					onChange({
						target: {
							name: props.name,
							value:
								values.value.startsWith("0") || values.value.startsWith("1")
									? values.value
									: "0" + values.value,
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

export type TextFieldCreditCardValidThroughProps = FormattedTextFieldProps;

const TextFieldCreditCardValidThrough = (
	props: TextFieldCreditCardValidThroughProps,
) => {
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

TextFieldCreditCardValidThrough.propTypes = {
	value: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
};

export default TextFieldCreditCardValidThrough;
