import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import { Grid } from "@mui/material";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import { makeStyles } from '@mui/styles';

import user from "../../services/user";
import helperService from "../../services/helper";
import GridContainerErrors from "../../components/grid-container-errors";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
        [theme.breakpoints.up("md")]: {
            width: "440px",
        },
    },
}));

const AccountChangeEmailView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState([]);

    const save = (event) => {
        setErrors([]);
        return user.saveNewEmail(email, password).then(
            function (data) {
                setEmail("");
                setPassword("");
            },
            function (data) {
                setPassword("");
                setErrors(data.errors);
            }
        );
    };

    return (
        <>
            <Grid container>
                <Grid item xs={12} sm={12} md={12}>
                    <h2>{t("CHANGE_E_MAIL")}</h2>
                    <p>{t("CHANGE_E_MAIL_DESCRIPTION")}</p>
                    <Divider style={{ marginBottom: "20px" }} />
                </Grid>
            </Grid>
            <Grid container style={{ marginBottom: "8px" }}>
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="email"
                        type="email"
                        label={t("NEW_E_MAIL")}
                        name="email"
                        autoComplete="off"
                        value={email}
                        onChange={(event) => {
                            setEmail(event.target.value);
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="password"
                        label={t("CURRENT_PASSWORD")}
                        InputProps={{
                            type: "password",
                        }}
                        name="password"
                        autoComplete="off"
                        value={password}
                        onChange={(event) => {
                            setPassword(event.target.value);
                        }}
                    />
                </Grid>
            </Grid>
            <GridContainerErrors errors={errors} setErrors={setErrors} />
            <Grid container style={{ marginBottom: "8px" }}>
                <Grid item xs={12} sm={12} md={12}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={save}
                        disabled={!email || !password || !helperService.isValidEmail(email)}
                    >
                        {t("SAVE")}
                    </Button>
                </Grid>
            </Grid>
        </>
    );
};

export default AccountChangeEmailView;
