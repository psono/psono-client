import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import { makeStyles } from "@mui/styles";
import * as React from "react";

const useStyles = makeStyles((theme) => ({
	root: {
		backgroundColor: theme.palette.error.main,
		color: theme.palette.error.contrastText,
		"&:hover": {
			backgroundColor: theme.palette.error.dark,
		},
		"&:disabled": {
			backgroundColor: theme.palette.error.light,
		},
	},
}));

export type ButtonDangerProps = ButtonProps;

const ButtonDanger = (props: ButtonDangerProps) => {
	const classes = useStyles();
	const { className, ...rest } = props;

	return (
		<Button
			{...props}
			className={`${className} ${classes.root}`}
			variant="contained"
		/>
	);
};

export default ButtonDanger;
