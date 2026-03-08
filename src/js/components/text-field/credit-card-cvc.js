import TextField from "@mui/material/TextField";
import PropTypes from "prop-types";
import * as React from "react";
import NumberFormat from "react-number-format";

const InputComponent = React.forwardRef(function InputComponent(props, ref) {
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
});

InputComponent.propTypes = {
	name: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
};

const TextFieldCreditCardCVC = (props) => {
	return (
		<TextField
			{...props}
			InputProps={{
				...props.InputProps,
				inputComponent: InputComponent,
			}}
		/>
	);
};

TextFieldCreditCardCVC.propTypes = {
	value: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
};

export default TextFieldCreditCardCVC;
