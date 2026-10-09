import FormControl from "@mui/material/FormControl";
import type { FormControlProps } from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import type { InputBaseComponentProps } from "@mui/material/InputBase";
import { makeStyles } from "@mui/styles";
import PropTypes from "prop-types";
import React from "react";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles((theme) => ({
	qrField: {
		"& .MuiInputBase-input": {
			height: "auto",
			textAlign: "center",
		},
	},
}));

export type TextFieldQrCodeProps = FormControlProps & { value: string };

const TextFieldQrCode = (props: TextFieldQrCodeProps) => {
	const classes = useStyles();
	const { value, className, ...other } = props;
	const { t } = useTranslation();

	React.useEffect(() => {
		const canvas = document.getElementById("canvas");
		if (!value || canvas === null) {
			return;
		}
		const QRCode: typeof import("qrcode") = require("qrcode");
		const options = {
			margin: 0,
			width: 200,
			height: 200,
		};
		QRCode.toCanvas(canvas, value, options, (error) => {
			if (error) {
				console.error(error);
			}
		});
	});

	return (
		<FormControl className={`${className} ${classes.qrField}`} {...other}>
			<InputLabel shrink htmlFor="qr-code">
				{t("QR_CODE")}
			</InputLabel>
			<OutlinedInput
				id="qr-code"
				margin="dense"
				size="small"
				inputComponent={"div" as React.ElementType<InputBaseComponentProps>}
				notched
				label={t("QR_CODE")}
				inputProps={{
					children: <canvas id="canvas" />,
					height: "auto",
				}}
			/>
		</FormControl>
	);
};

TextFieldQrCode.propTypes = {
	value: PropTypes.string.isRequired,
};

export default TextFieldQrCode;
