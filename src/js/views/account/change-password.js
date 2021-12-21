import React, { useState } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { useTranslation } from "react-i18next";
import Button from "@material-ui/core/Button";
import { Grid } from "@material-ui/core";
import Divider from "@material-ui/core/Divider";
import TextField from "@material-ui/core/TextField";
import { makeStyles } from "@material-ui/core/styles";

import actionCreators from "../../actions/action-creators";
import user from "../../services/user";
import helper from "../../services/helper";
import GridContainerErrors from "../../components/grid-container-errors";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
        [theme.breakpoints.up("md")]: {
            width: "440px",
        },
    },
}));

const AccountChangePasswordView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const [password, setPassword] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");
    const [errors, setErrors] = useState([]);

    const save = (event) => {
        setErrors([]);
        return user.saveNewPassword(password, passwordRepeat, oldPassword).then(
            function (data) {
                setPassword("");
                setOldPassword("");
                setPasswordRepeat("");
            },
            function (data) {
                setOldPassword("");
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
                        margin="dense"
                        id="oldPassword"
                        label={t("OLD_PASSWORD")}
                        InputProps={{
                            type: "password",
                        }}
                        name="oldPassword"
                        autoComplete="oldPassword"
                        value={oldPassword}
                        onChange={(event) => {
                            setOldPassword(event.target.value);
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense"
                        id="password"
                        label={t("NEW_PASSWORD")}
                        InputProps={{
                            type: "password",
                        }}
                        name="password"
                        autoComplete="password"
                        value={password}
                        onChange={(event) => {
                            setPassword(event.target.value);
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense"
                        id="passwordRepeat"
                        label={t("NEW_PASSWORD_REPEAT")}
                        InputProps={{
                            type: "password",
                        }}
                        name="passwordRepeat"
                        autoComplete="passwordRepeat"
                        value={passwordRepeat}
                        onChange={(event) => {
                            setPasswordRepeat(event.target.value);
                        }}
                    />
                </Grid>
            </Grid>
            <GridContainerErrors errors={errors} setErrors={setErrors} />
            <Grid container style={{ marginBottom: "8px" }}>
                <Grid item xs={12} sm={12} md={12}>
                    <Button variant="contained" color="primary" onClick={save} disabled={!passwordRepeat || !password || !oldPassword}>
                        {t("SAVE")}
                    </Button>
                </Grid>
            </Grid>
        </>
    );
};

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default connect(mapStateToProps, mapDispatchToProps)(AccountChangePasswordView);