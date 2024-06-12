import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { Grid } from "@mui/material";
import TextField from "@mui/material/TextField";

import { getStore } from "../../services/store";
import user from "../../services/user";
import MuiAlert from '@mui/material/Alert'
import ButtonDanger from "../../components/button-danger";
import GridContainerErrors from "../../components/grid-container-errors";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
}));

const DeleteAccountDialog = (props) => {
    const { open, onClose } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState([]);

    const showPassword = ["LDAP", "AUTHKEY"].indexOf(getStore().getState().user.authentication) !== -1;

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
                                margin="dense" size="small"
                                id="password"
                                label={t("PASSWORD")}
                                helperText={t("YOUR_PASSWORD_AS_CONFIRMATION")}
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
                )}
                <GridContainerErrors errors={errors} setErrors={setErrors} />

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

export default DeleteAccountDialog;
