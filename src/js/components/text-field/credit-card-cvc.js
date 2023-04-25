import * as React from "react";
import PropTypes from "prop-types";
import NumberFormat from 'react-number-format'

import TextField from '@material-ui/core/TextField';


function InputComponent(props) {
    const { inputRef, onChange, ...other } = props;

    return (
        <NumberFormat
            {...other}
            format="####"
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

InputComponent.propTypes = {
    inputRef: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};

const TextFieldCreditCardCVC = (props) => {
    return (
        <TextField
            {...props}
            InputProps={{
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
