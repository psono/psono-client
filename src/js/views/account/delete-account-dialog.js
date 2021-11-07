import React, { useState } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { bindActionCreators } from "redux";
import { compose } from "redux";
import { withTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Box from "@material-ui/core/Box";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import { Grid } from "@material-ui/core";
import TextField from "@material-ui/core/TextField";

import actionCreators from "../../actions/action-creators";
import store from "../../services/store";
import user from "../../services/user";
import MuiAlert from "@material-ui/lab/Alert";
import ButtonDanger from "../../components/button-danger";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
}));

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
            {value === index && <Box p={3}>{children}</Box>}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};

const DeleteAccountDialog = (props) => {
    const { t, open, onClose } = props;
    const classes = useStyles();
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState([]);

    const showPassword = ["LDAP", "AUTHKEY"].indexOf(store.getState().user.authentication) !== -1;

    const deleteAccount = () => {
        setErrors([]);

        const onError = function (data) {
            if (data.hasOwnProperty("non_field_errors")) {
                setErrors(data.non_field_errors);
            } else {
                console.log(data);
                alert("Error, should not happen.");
            }
        };

        const onSuccess = function () {
            // should never reach this point due to logout
        };

        user.deleteAccount(password).then(onSuccess, onError);
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
            <DialogTitle id="alert-dialog-title">{t("DELETE_ACCOUNT")}</DialogTitle>
            <DialogContent>
                {showPassword && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="password"
                                label={t("PASSWORD")}
                                helperText={t("YOUR_PASSWORD_AS_CONFIRMATION")}
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
                    </Grid>
                )}
                <Grid container>
                    {errors && (
                        <Grid item xs={12} sm={12} md={12}>
                            <>
                                {errors.map((prop, index) => {
                                    return (
                                        <MuiAlert
                                            onClose={() => {
                                                setErrors([]);
                                            }}
                                            key={index}
                                            severity="error"
                                            style={{ marginBottom: "5px" }}
                                        >
                                            {t(prop)}
                                        </MuiAlert>
                                    );
                                })}
                            </>
                        </Grid>
                    )}
                </Grid>

                <MuiAlert
                    onClose={() => {
                        setErrors([]);
                    }}
                    severity="error"
                    style={{ marginBottom: "5px" }}
                >
                    {t("YOU_ARE_ABOUT_TO_DELETE_YOUR_ACCOUNT")}
                </MuiAlert>
            </DialogContent>
            <DialogActions>
                <ButtonDanger
                    onClick={() => {
                        deleteAccount();
                    }}
                    autoFocus
                    disabled={showPassword && !password}
                >
                    {t("DELETE")}
                </ButtonDanger>
                <Button
                    onClick={() => {
                        onClose();
                    }}
                >
                    {t("CLOSE")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

DeleteAccountDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default compose(withTranslation(), connect(mapStateToProps, mapDispatchToProps))(DeleteAccountDialog);
