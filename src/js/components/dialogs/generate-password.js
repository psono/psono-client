import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import {Checkbox, Divider, Grid} from "@mui/material";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {Check} from "@mui/icons-material";
import {useSelector} from "react-redux";
import datastorePassword from "../../services/datastore-password";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
    checked: {
        color: theme.palette.checked.main,
    },
    checkedIcon: {
        width: "20px",
        height: "20px",
        border: `1px solid ${theme.palette.greyText.main}`,
        borderRadius: "3px",
    },
    uncheckedIcon: {
        width: "0px",
        height: "0px",
        padding: "9px",
        border: `1px solid ${theme.palette.greyText.main}`,
        borderRadius: "3px",
    },
    passwordField: {
        fontFamily: "'Fira Code', monospace",
    },
    regularButtonText: {
        color: theme.palette.lightGreyText.main,
    },
}));

const DialogGeneratePassword = (props) => {
    const { open, onClose, onConfirm } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [includeLettersLowercase, setIncludeLettersLowercase] = useState(true);
    const [includeLettersUppercase, setIncludeLettersUppercase] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSpecialChars, setIncludeSpecialChars] = useState(true);
    const settingsDatastore = useSelector((state) => state.settingsDatastore);
    const [passwordLength, setPasswordLength] = useState(settingsDatastore.passwordLength);
    const [passwordLettersUppercase, setPasswordLettersUppercase] = useState(
        settingsDatastore.passwordLettersUppercase
    );
    const [passwordLettersLowercase, setPasswordLettersLowercase] = useState(
        settingsDatastore.passwordLettersLowercase
    );
    const [passwordNumbers, setPasswordNumbers] = useState(settingsDatastore.passwordNumbers);
    const [passwordSpecialChars, setPasswordSpecialChars] = useState(settingsDatastore.passwordSpecialChars);
    const [password, setPassword] = useState(datastorePassword.generate(passwordLength, passwordLettersUppercase, passwordLettersLowercase, passwordNumbers, passwordSpecialChars));


    const generatePassword = (passwordLength, passwordLettersUppercase, passwordLettersLowercase, passwordNumbers, passwordSpecialChars) => {
        let password = datastorePassword.generate(passwordLength, passwordLettersUppercase, passwordLettersLowercase, passwordNumbers, passwordSpecialChars);
        setPassword(password);
    };

    return (
        <Dialog
            fullWidth
            maxWidth={"sm"}
            open={open}
            onClose={() => {
                onClose();
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{t("GENERATE_PASSWORD")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            size="small"
                            id="password"
                            label={t("PASSWORD")}
                            name="password"
                            autoComplete="off"
                            value={password}
                            required
                            onChange={(event) => {
                                setPassword(event.target.value);
                            }}
                            InputProps={{
                                classes: {
                                    input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                                },
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="generate"
                                            onClick={() => generatePassword(
                                                passwordLength,
                                                includeLettersUppercase ? passwordLettersUppercase : '',
                                                includeLettersLowercase ? passwordLettersLowercase : '',
                                                includeNumbers ? passwordNumbers : '',
                                                includeSpecialChars ? passwordSpecialChars : '',
                                            )}
                                            edge="end"
                                            className={classes.regularButtonText}
                                            size="large">
                                            <ReplayRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                </Grid>

                <Grid item xs={12} sm={12} md={12}>
                    <Divider classes={{ root: classes.divider }} />
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="passwordLength"
                        label={t("PASSWORD_LENGTH")}
                        name="passwordLength"
                        autoComplete="off"
                        value={passwordLength}
                        onChange={(event) => {
                            generatePassword(
                                event.target.value,
                                includeLettersUppercase ? passwordLettersUppercase : '',
                                includeLettersLowercase ? passwordLettersLowercase : '',
                                includeNumbers ? passwordNumbers : '',
                                includeSpecialChars ? passwordSpecialChars : '',
                            )
                            setPasswordLength(event.target.value);
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <Checkbox
                        checked={includeLettersUppercase}
                        onChange={(event) => {
                            generatePassword(
                                passwordLength,
                                event.target.checked ? passwordLettersUppercase : '',
                                includeLettersLowercase ? passwordLettersLowercase : '',
                                includeNumbers ? passwordNumbers : '',
                                includeSpecialChars ? passwordSpecialChars : '',
                            )
                            setIncludeLettersUppercase(event.target.checked);
                        }}
                        checkedIcon={<Check className={classes.checkedIcon} />}
                        icon={<Check className={classes.uncheckedIcon} />}
                        classes={{
                            checked: classes.checked,
                        }}
                    />{" "}
                    {t("LETTERS_UPPERCASE")}
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <Checkbox
                        checked={includeLettersLowercase}
                        onChange={(event) => {
                            generatePassword(
                                passwordLength,
                                includeLettersUppercase ? passwordLettersUppercase : '',
                                event.target.checked ? passwordLettersLowercase : '',
                                includeNumbers ? passwordNumbers : '',
                                includeSpecialChars ? passwordSpecialChars : '',
                            )
                            setIncludeLettersLowercase(event.target.checked);
                        }}
                        checkedIcon={<Check className={classes.checkedIcon} />}
                        icon={<Check className={classes.uncheckedIcon} />}
                        classes={{
                            checked: classes.checked,
                        }}
                    />{" "}
                    {t("LETTERS_LOWERCASE")}
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <Checkbox
                        checked={includeNumbers}
                        onChange={(event) => {
                            generatePassword(
                                passwordLength,
                                includeLettersUppercase ? passwordLettersUppercase : '',
                                includeLettersLowercase ? passwordLettersLowercase : '',
                                event.target.checked ? passwordNumbers : '',
                                includeSpecialChars ? passwordSpecialChars : '',
                            )
                            setIncludeNumbers(event.target.checked);
                        }}
                        checkedIcon={<Check className={classes.checkedIcon} />}
                        icon={<Check className={classes.uncheckedIcon} />}
                        classes={{
                            checked: classes.checked,
                        }}
                    />{" "}
                    {t("NUMBERS")}
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <Checkbox
                        checked={includeSpecialChars}
                        onChange={(event) => {
                            generatePassword(
                                passwordLength,
                                includeLettersUppercase ? passwordLettersUppercase : '',
                                includeLettersLowercase ? passwordLettersLowercase : '',
                                includeNumbers ? passwordNumbers : '',
                                event.target.checked ? passwordSpecialChars : '',
                            )
                            setIncludeSpecialChars(event.target.checked);
                        }}
                        checkedIcon={<Check className={classes.checkedIcon} />}
                        icon={<Check className={classes.uncheckedIcon} />}
                        classes={{
                            checked: classes.checked,
                        }}
                    />{" "}
                    {t("SPECIAL_CHARS")}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        onClose();
                    }}
                >
                    {t("CLOSE")}
                </Button>
                <Button
                    onClick={() => {
                        onConfirm(password);
                    }}
                    variant="contained"
                    color="primary"
                >
                    {t("CONFIRM")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

DialogGeneratePassword.propTypes = {
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default DialogGeneratePassword;
