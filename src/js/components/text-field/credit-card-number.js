import * as React from "react";
import PropTypes from "prop-types";
import NumberFormat from 'react-number-format'

import TextField from '@material-ui/core/TextField';


function CreditCardFormat(props) {
    const { inputRef, onChange, ...other } = props;

    return (
        <NumberFormat
            {...other}
            format="#### #### #### #### ####"
            getInputRef={inputRef}
            onValueChange={(values) => {
                onChange({
                    target: {
                        name: props.name,
                        value: values.value,
                    },
                });
            }}
            isNumericString
        />
    );
}

CreditCardFormat.propTypes = {
    inputRef: PropTypes.func.isRequired,
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
