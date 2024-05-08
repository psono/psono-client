import React from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import Divider from "@material-ui/core/Divider";
import DialogTitle from "@material-ui/core/DialogTitle";
import { Grid } from "@material-ui/core";

import { getStore } from "../../services/store";
import browserClient from "../../services/browser-client";
import TextFieldQrCode from "../../components/text-field/qr";

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

const AccountOverviewView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();

    return (
        <Grid container>
            <Grid item xs={12} sm={12} md={12}>
                <h2>{t("SERVER_INFO")}</h2>
                <p>{t("SERVER_INFO_DESCRIPTION")}</p>
                <Divider style={{ marginBottom: "20px" }} />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <TextField
                    className={classes.textField}
                    variant="outlined"
                    margin="dense"
                    id="api"
                    label={t("SERVER_API_VERSION")}
                    name="api"
                    autoComplete="off"
                    value={getStore().getState().server.api}
                    readOnly
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
                    id="version"
                    label={t("SERVER_VERSION")}
                    name="version"
                    autoComplete="off"
                    value={getStore().getState().server.version}
                    readOnly
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
                    id="verifyKey"
                    label={t("SERVER_SIGNATURE")}
                    name="verifyKey"
                    autoComplete="off"
                    value={getStore().getState().server.verifyKey}
                    readOnly
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
                    id="logAudit"
                    label={t("SERVER_AUDIT_LOGGING")}
                    name="logAudit"
                    autoComplete="off"
                    value={getStore().getState().server.logAudit}
                    readOnly
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
                    id="publicKey"
                    label={t("SERVER_PUBLIC_KEY")}
                    name="publicKey"
                    autoComplete="off"
                    value={getStore().getState().server.publicKey}
                    readOnly
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
                    id="type"
                    label={t("SERVER_LICENSE_TYPE")}
                    name="type"
                    autoComplete="off"
                    value={getStore().getState().server.type}
                    readOnly
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
                    id="licenseMaxUsers"
                    label={t("SERVER_MAX_USERS")}
                    name="licenseMaxUsers"
                    autoComplete="off"
                    value={getStore().getState().server.licenseMaxUsers}
                    readOnly
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
                    id="licenseValidFrom"
                    label={t("SERVER_LICENSE_VALID_FROM")}
                    name="licenseValidFrom"
                    autoComplete="off"
                    value={
                        getStore().getState().server.licenseValidFrom
                            ? new Date(getStore().getState().server.licenseValidFrom * 1000)
                            : "N/A"
                    }
                    readOnly
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
                    id="licenseValidTill"
                    label={t("SERVER_LICENSE_VALID_TILL")}
                    name="licenseValidTill"
                    autoComplete="off"
                    value={
                        getStore().getState().server.licenseValidTill
                            ? new Date(getStore().getState().server.licenseValidTill * 1000)
                            : "N/A"
                    }
                    readOnly
                    InputProps={{
                        classes: {
                            input: classes.passwordField,
                        },
                    }}
                />
            </Grid>

        </Grid>
    );
};

export default AccountOverviewView;
