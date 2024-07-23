import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import { useSelector } from "react-redux";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import { Grid } from "@mui/material";
import Button from "@mui/material/Button";
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
    const [passwordLettersUppercase, setPasswordLettersUppercase] = useState(
        settingsDatastore.passwordLettersUppercase
    );
    const [passwordLettersLowercase, setPasswordLettersLowercase] = useState(
        settingsDatastore.passwordLettersLowercase
    );
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
        action().setPasswordConfig(
            passwordLength,
            passwordLettersUppercase,
            passwordLettersLowercase,
            passwordNumbers,
            passwordSpecialChars
        );
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
                    margin="dense" size="small"
                    id="passwordLength"
                    label={t("PASSWORD_LENGTH")}
                    name="passwordLength"
                    autoComplete="off"
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
                    margin="dense" size="small"
                    id="passwordLettersUppercase"
                    label={t("LETTERS_UPPERCASE")}
                    name="passwordLettersUppercase"
                    autoComplete="off"
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
                    margin="dense" size="small"
                    id="passwordLettersLowercase"
                    label={t("LETTERS_LOWERCASE")}
                    name="passwordLettersLowercase"
                    autoComplete="off"
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
                    margin="dense" size="small"
                    id="passwordNumbers"
                    label={t("NUMBERS")}
                    name="passwordNumbers"
                    autoComplete="off"
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
                    margin="dense" size="small"
                    id="passwordSpecialChars"
                    label={t("SPECIAL_CHARS")}
                    name="passwordSpecialChars"
                    autoComplete="off"
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
            <Grid container style={{ marginBottom: "8px",  marginTop: "8px" }}>
                <Grid item xs={12} sm={12} md={12}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={save}
                        disabled={
                            passwordLength <= 0 ||
                            (
                                passwordLettersUppercase +
                                passwordLettersLowercase +
                                passwordNumbers +
                                passwordSpecialChars
                            ).length === 0
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
