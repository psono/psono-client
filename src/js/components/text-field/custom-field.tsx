import TextField from "@mui/material/TextField";
import React from "react";
import TextFieldColored from "./colored";
import type { TextFieldColoredProps } from "./colored";

export type CustomFieldProps = TextFieldColoredProps & { fieldType?: string };

const CustomField = (props: CustomFieldProps) => {
	const { fieldType, ...rest } = props;

	if (fieldType === "password") {
		return <TextFieldColored {...rest} />;
	}

	return <TextField {...rest} />;
};

export default CustomField;
