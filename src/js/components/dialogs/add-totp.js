import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { Grid } from "@mui/material";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SelectFieldTotpAlgorithm from "../select-field/totp-algorithm";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
}));

const DialogAddTotp = (props) => {
    const { open, onClose } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [totpPeriod, setTotpPeriod] = useState(30);
    const [totpAlgorithm, setTotpAlgorithm] = useState("SHA1");
    const [totpDigits, setTotpDigits] = useState(6);
    const [totpCode, setTotpCode] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const onShowHidePassword = (event) => {
        setShowPassword(!showPassword);
    };
    const onSave = (event) => {
        onClose(
            totpPeriod,
            totpAlgorithm,
            totpDigits,
            totpCode,
        )
    };

    return (
        <Dialog
            fullWidth
            maxWidth={"sm"}
            open={open}
            onClose={() => {
                onClose(
                    30,
                    "SHA1",
                    6,
                    "",
                );
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{t("ADD_TOTP")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="totpPeriod"
                            label={t("PERIOD_EG_30")}
                            name="totpPeriod"
                            autoComplete="off"
                            value={totpPeriod}
                            required
                            InputProps={{
                                inputProps: {
                                    min: 0,
                                    step: 1,
                                },
                            }}
                            type="number"
                            onChange={(event) => {
                                setTotpPeriod(parseInt(event.target.value) || 30);
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <SelectFieldTotpAlgorithm
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="totpAlgorithm"
                            name="totpAlgorithm"
                            autoComplete="off"
                            value={totpAlgorithm}
                            required
                            onChange={(value) => {
                                setTotpAlgorithm(value);
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="totpDigits"
                            label={t("DIGITS_EG_6")}
                            name="totpDigits"
                            autoComplete="off"
                            value={totpDigits}
                            required
                            InputProps={{
                                inputProps: {
                                    min: 0,
                                    step: 1,
                                },
                            }}
                            type="number"
                            onChange={(event) => {
                                setTotpDigits(parseInt(event.target.value) || 6);
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="totpCode"
                            label={t("SECRET")}
                            name="totpCode"
                            autoComplete="off"
                            value={totpCode}
                            required
                            onChange={(event) => {
                                setTotpCode(event.target.value);
                            }}
                            InputProps={{
                                type: showPassword ? "text" : "password",
                                classes: {
                                    input: classes.passwordField,
                                },
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            className={classes.iconButton}
                                            aria-label="menu"
                                            onClick={onShowHidePassword}
                                            size="large">
                                            <VisibilityOffIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        onClose(
                            30,
                            "SHA1",
                            6,
                            "",
                        );
                    }}
                >
                    {t("CLOSE")}
                </Button>
                <Button
                    onClick={onSave}
                    variant="contained"
                    color="primary"
                    disabled={!totpCode}
                >
                    {t("SAVE")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

DialogAddTotp.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default DialogAddTotp;
