import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import { useSelector } from "react-redux";
import Divider from "@material-ui/core/Divider";
import TextField from "@material-ui/core/TextField";
import { Grid } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import action from "../../actions/bound-action-creators";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
        [theme.breakpoints.up("md")]: {
            width: "440px",
        },
    },
    passwordField: {
        fontFamily: "'Fira Code', monospace",
    },
}));

const SettingsPasswordGeneratorView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const settingsDatastore = useSelector((state) => state.settingsDatastore);
    const [passwordLength, setPasswordLength] = useState(settingsDatastore.passwordLength);
    const [passwordLettersUppercase, setPasswordLettersUppercase] = useState(settingsDatastore.passwordLettersUppercase);
    const [passwordLettersLowercase, setPasswordLettersLowercase] = useState(settingsDatastore.passwordLettersLowercase);
    const [passwordNumbers, setPasswordNumbers] = useState(settingsDatastore.passwordNumbers);
    const [passwordSpecialChars, setPasswordSpecialChars] = useState(settingsDatastore.passwordSpecialChars);

    React.useEffect(() => {
        setPasswordLength(settingsDatastore.passwordLength);
        setPasswordLettersUppercase(settingsDatastore.passwordLettersUppercase);
        setPasswordLettersLowercase(settingsDatastore.passwordLettersLowercase);
        setPasswordNumbers(settingsDatastore.passwordNumbers);
        setPasswordSpecialChars(settingsDatastore.passwordSpecialChars);
    }, [settingsDatastore]);

    const save = (event) => {
        action.setPasswordConfig(passwordLength, passwordLettersUppercase, passwordLettersLowercase, passwordNumbers, passwordSpecialChars);
    };

    return (
        <Grid container>
            <Grid item xs={12} sm={12} md={12}>
                <h2>{t("PASSWORD_GENERATOR")}</h2>
                <p>{t("PASSWORD_GENERATOR_DESCRIPTION")}</p>
                <Divider style={{ marginBottom: "20px" }} />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <TextField
                    className={classes.textField}
                    variant="outlined"
                    margin="dense"
                    id="passwordLength"
                    label={t("PASSWORD_LENGTH")}
                    name="passwordLength"
                    autoComplete="passwordLength"
                    value={passwordLength}
                    onChange={(event) => {
                        setPasswordLength(event.target.value);
                    }}
                    InputProps={{
                        classes: {
                            input: classes.passwordField,
                        },
                    }}
                />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <TextField
                    className={classes.textField}
                    variant="outlined"
                    margin="dense"
                    id="passwordLettersUppercase"
                    label={t("LETTERS_UPPERCASE")}
                    name="passwordLettersUppercase"
                    autoComplete="passwordLettersUppercase"
                    value={passwordLettersUppercase}
                    onChange={(event) => {
                        setPasswordLettersUppercase(event.target.value);
                    }}
                    InputProps={{
                        classes: {
                            input: classes.passwordField,
                        },
                    }}
                />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <TextField
                    className={classes.textField}
                    variant="outlined"
                    margin="dense"
                    id="passwordLettersLowercase"
                    label={t("LETTERS_LOWERCASE")}
                    name="passwordLettersLowercase"
                    autoComplete="passwordLettersLowercase"
                    value={passwordLettersLowercase}
                    onChange={(event) => {
                        setPasswordLettersLowercase(event.target.value);
                    }}
                    InputProps={{
                        classes: {
                            input: classes.passwordField,
                        },
                    }}
                />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <TextField
                    className={classes.textField}
                    variant="outlined"
                    margin="dense"
                    id="passwordNumbers"
                    label={t("NUMBERS")}
                    name="passwordNumbers"
                    autoComplete="passwordNumbers"
                    value={passwordNumbers}
                    onChange={(event) => {
                        setPasswordNumbers(event.target.value);
                    }}
                    InputProps={{
                        classes: {
                            input: classes.passwordField,
                        },
                    }}
                />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <TextField
                    className={classes.textField}
                    variant="outlined"
                    margin="dense"
                    id="passwordSpecialChars"
                    label={t("SPECIAL_CHARS")}
                    name="passwordSpecialChars"
                    autoComplete="passwordSpecialChars"
                    value={passwordSpecialChars}
                    onChange={(event) => {
                        setPasswordSpecialChars(event.target.value);
                    }}
                    InputProps={{
                        classes: {
                            input: classes.passwordField,
                        },
                    }}
                />
            </Grid>
            <Grid container style={{ marginBottom: "8px" }}>
                <Grid item xs={12} sm={12} md={12}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={save}
                        disabled={
                            passwordLength <= 0 || (passwordLettersUppercase + passwordLettersLowercase + passwordNumbers + passwordSpecialChars).length === 0
                        }
                    >
                        {t("SAVE")}
                    </Button>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default SettingsPasswordGeneratorView;
