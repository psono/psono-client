import React from "react";
import PropTypes from "prop-types";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import { makeStyles } from '@mui/styles';
import { useTranslation } from "react-i18next";
import OutlinedInput from "@mui/material/OutlinedInput";

const useStyles = makeStyles((theme) => ({
    qrField: {
        '& .MuiInputBase-input': {
            height: "auto",
            textAlign: "center",
        },
    },
}));

const TextFieldQrCode = (props) => {
    const classes = useStyles();
    const {value , className, ...other } = props;
    const { t } = useTranslation();

    React.useEffect(() => {
        const canvas = document.getElementById("canvas");
        if (!value || canvas === null) {
            return;
        }
        const QRCode = require("qrcode");
        QRCode.toCanvas(canvas, value, {
                margin: 0,
                width: 380,
                height: 380,
            },
            function (error) {
                if (error) {
                    console.error(error);
                }
            });
    });

    return (
        <FormControl
            className={`${className} ${classes.qrField}`}
            {...other}
        >
            <InputLabel shrink htmlFor="qr-code">
                {t("QR_CODE")}
            </InputLabel>
            <OutlinedInput
                id="qr-code"
                margin="dense" size="small"
                inputComponent="div"
                notched
                label={t("QR_CODE")}
                inputProps={{
                    children: (
                        <canvas id="canvas" />
                    ),
                    height: 'auto'
                }}
            />
        </FormControl>
    );
};

TextFieldQrCode.propTypes = {
    value: PropTypes.string.isRequired,
};

export default TextFieldQrCode;
