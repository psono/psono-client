import React from 'react';
import TextField from '@mui/material/TextField';
import TextFieldColored from './colored';

const CustomField = (props) => {
  const { fieldType, ...rest } = props;

  if (fieldType === 'password') {
    return <TextFieldColored {...rest} />;
  }

  return <TextField {...rest} />;
};

export default CustomField;