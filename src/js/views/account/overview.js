import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
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

import actionCreators from "../../actions/action-creators";
import store from "../../services/store";
import browserClient from "../../services/browser-client";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
        [theme.breakpoints.up("md")]: {
            width: "440px",
        },
    },
}));

const AccountOverviewView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const [qrModalOpen, setQrModalOpen] = React.useState(false);

    const closeQrModal = () => {
        setQrModalOpen(false);
    };

    const onClickShowQRClientConfig = (event) => {
        setQrModalOpen(true);
        browserClient.loadConfig().then(function (config) {
            const QRCode = require("qrcode");
            const canvas = document.getElementById("canvas");

            QRCode.toCanvas(
                canvas,
                JSON.stringify({
                    ConfigJson: config,
                }),
                function (error) {
                    if (error) {
                        console.error(error);
                    }
                }
            );
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
                    autoComplete="userId"
                    value={store.getState().user.userId}
                    InputProps={{
                        readOnly: true,
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
                    autoComplete="username"
                    value={store.getState().user.username}
                    InputProps={{
                        readOnly: true,
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
                    autoComplete="userEmail"
                    value={store.getState().user.userEmail}
                    InputProps={{
                        readOnly: true,
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
                    autoComplete="userPublicKey"
                    value={store.getState().user.userPublicKey}
                    InputProps={{
                        readOnly: true,
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
                    autoComplete="api"
                    value={store.getState().server.api}
                    InputProps={{
                        readOnly: true,
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
                    autoComplete="version"
                    value={store.getState().server.version}
                    InputProps={{
                        readOnly: true,
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
                    autoComplete="verifyKey"
                    value={store.getState().server.verifyKey}
                    InputProps={{
                        readOnly: true,
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
                    autoComplete="logAudit"
                    value={store.getState().server.logAudit}
                    InputProps={{
                        readOnly: true,
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
                    autoComplete="publicKey"
                    value={store.getState().server.publicKey}
                    InputProps={{
                        readOnly: true,
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
                    autoComplete="type"
                    value={store.getState().server.type}
                    InputProps={{
                        readOnly: true,
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
                    autoComplete="licenseMaxUsers"
                    value={store.getState().server.licenseMaxUsers}
                    InputProps={{
                        readOnly: true,
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
                    autoComplete="licenseValidFrom"
                    value={store.getState().server.licenseValidFrom ? new Date(store.getState().server.licenseValidFrom * 1000) : "N/A"}
                    InputProps={{
                        readOnly: true,
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
                    autoComplete="licenseValidTill"
                    value={store.getState().server.licenseValidTill ? new Date(store.getState().server.licenseValidTill * 1000) : "N/A"}
                    InputProps={{
                        readOnly: true,
                    }}
                />
            </Grid>
            <Dialog open={qrModalOpen} onClose={closeQrModal} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
                <DialogTitle id="alert-dialog-title">{t("QR_CLIENT_CONFIG")}</DialogTitle>
                <DialogContent>
                    <canvas id="canvas" />
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

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default connect(mapStateToProps, mapDispatchToProps)(AccountOverviewView);
