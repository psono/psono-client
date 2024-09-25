import * as React from "react";
import PropTypes from "prop-types";
import NumberFormat from 'react-number-format';

import TextField from '@mui/material/TextField';

const InputComponent = React.forwardRef(function InputComponent(props, ref) {
    const { onChange, ...other } = props;

    return (
        <NumberFormat
            {...other}
            format="## / ##"
            onValueChange={(values) => {
                onChange({
                    target: {
                        name: props.name,
                        value: values.value.startsWith("0") || values.value.startsWith("1") ? values.value : "0" + values.value,
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

const TextFieldCreditCardValidThrough = (props) => {
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

TextFieldCreditCardValidThrough.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};

export default TextFieldCreditCardValidThrough;
