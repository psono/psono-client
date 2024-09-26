import * as React from "react";
import PropTypes from "prop-types";
import NumberFormat from 'react-number-format'

import TextField from '@mui/material/TextField';

const CreditCardFormat = React.forwardRef(function CreditCardFormat(props, ref) {
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
            getInputRef={ref}  // Pass the ref to NumberFormat
        />
    );
});

CreditCardFormat.propTypes = {
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};

const TextFieldCreditCardNumber = (props) => {
    return (
        <TextField
            {...props}
            InputProps={{
                ...props.InputProps,
                inputComponent: CreditCardFormat,
            }}
        />
    );
};

TextFieldCreditCardNumber.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};

export default TextFieldCreditCardNumber;
