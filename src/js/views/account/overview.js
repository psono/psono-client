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

import store from "../../services/store";
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
    const [qrModalOpen, setQrModalOpen] = React.useState(false);
    const [qrContent, setQrContent] = React.useState('');

    const closeQrModal = () => {
        setQrModalOpen(false);
    };

    const onClickShowQRClientConfig = (event) => {
        setQrModalOpen(true);
        browserClient.loadConfig().then(function (config) {
            setQrContent(JSON.stringify({
                ConfigJson: config,
            }))
        });
    };

    return (
        <Grid container>
            <Grid item xs={12} sm={12} md={12}>
                <h2>{t("OVERVIEW")}</h2>
                <p>{t("OVERVIEW_DESCRIPTION")}</p>
                <Divider style={{ marginBottom: "20px" }} />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <h4>{t("CLIENT_INFO")}</h4>
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <TextField
                    className={classes.textField}
                    variant="outlined"
                    margin="dense"
                    id="userId"
                    label={t("USER_ID")}
                    name="userId"
                    autoComplete="off"
                    value={store.getState().user.userId}
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
                    id="username"
                    label={t("USERNAME")}
                    name="username"
                    autoComplete="off"
                    value={store.getState().user.username}
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
                    id="userEmail"
                    label={t("E_MAIL")}
                    name="userEmail"
                    autoComplete="off"
                    value={store.getState().user.userEmail}
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
                    id="userPublicKey"
                    label={t("PUBLIC_KEY")}
                    name="userPublicKey"
                    autoComplete="off"
                    value={store.getState().user.userPublicKey}
                    readOnly
                    InputProps={{
                        classes: {
                            input: classes.passwordField,
                        },
                    }}
                />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <Button variant="contained" color="primary" onClick={onClickShowQRClientConfig}>
                    {t("QR_CLIENT_CONFIG")}
                </Button>
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <h4>{t("SERVER_INFO")}</h4>
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
                    value={store.getState().server.api}
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
                    value={store.getState().server.version}
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
                    value={store.getState().server.verifyKey}
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
                    value={store.getState().server.logAudit}
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
                    value={store.getState().server.publicKey}
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
                    value={store.getState().server.type}
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
                    value={store.getState().server.licenseMaxUsers}
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
                        store.getState().server.licenseValidFrom
                            ? new Date(store.getState().server.licenseValidFrom * 1000)
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
                        store.getState().server.licenseValidTill
                            ? new Date(store.getState().server.licenseValidTill * 1000)
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
            <Dialog
                open={qrModalOpen}
                onClose={closeQrModal}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{t("QR_CLIENT_CONFIG")}</DialogTitle>
                <DialogContent>
                    <TextFieldQrCode
                        className={classes.textField}
                        variant="outlined"
                        margin="dense"
                        value={qrContent}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeQrModal} autoFocus>
                        {t("CLOSE")}
                    </Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
};

export default AccountOverviewView;
