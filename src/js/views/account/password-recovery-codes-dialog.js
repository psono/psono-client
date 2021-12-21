import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { bindActionCreators } from "redux";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import { Grid } from "@material-ui/core";

import actionCreators from "../../actions/action-creators";
import passwordRecoveryCode from "../../services/password-recovery-code";
import MuiAlert from "@material-ui/lab/Alert";

const useStyles = makeStyles((theme) => ({
    code: {
        fontFamily: "'Fira Code', monospace",
        textAlign: "center",
    },
}));

const PasswordRecoveryCodesDialog = (props) => {
    const { open, onClose } = props;
    const classes = useStyles();
    const { t } = useTranslation();
    const [newPasswordRecoveryCode, setNewPasswordRecoveryCode] = React.useState({});

    React.useEffect(() => {
        passwordRecoveryCode.recoveryGenerateInformation().then(
            function (createdPasswordRecoveryCode) {
                setNewPasswordRecoveryCode(createdPasswordRecoveryCode);
            },
            function (error) {
                console.log(error);
            }
        );
    }, []);

    return (
        <Dialog fullWidth maxWidth={"sm"} open={open} onClose={onClose} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
            <DialogTitle id="alert-dialog-title">{t("RECOVERY_INFORMATION")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <strong>{t("USERNAME")}</strong>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} className={classes.code}>
                        <p>{newPasswordRecoveryCode.username}</p>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <strong>{t("CODE")}</strong>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} className={classes.code}>
                        <p>{newPasswordRecoveryCode.recovery_password}</p>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <strong>{t("OR")}</strong>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} className={classes.code}>
                        <p>{newPasswordRecoveryCode.recovery_words}</p>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <strong>{t("SAVE_INFORMATION_TO_RECOVER")}</strong>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <MuiAlert
                            severity="warning"
                            style={{
                                marginBottom: "5px",
                                marginTop: "5px",
                            }}
                        >
                            {t("EARLIER_GENERATED_RECOVERY_CODES")}
                        </MuiAlert>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} autoFocus>
                    {t("CLOSE")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

PasswordRecoveryCodesDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default connect(mapStateToProps, mapDispatchToProps)(PasswordRecoveryCodesDialog);
