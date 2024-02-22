import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import { makeStyles } from "@material-ui/core/styles";
import { Grid } from "@material-ui/core";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import InputAdornment from "@material-ui/core/InputAdornment";
import IconButton from "@material-ui/core/IconButton";

import GridContainerErrors from "../grid-container-errors";
import offlineCacheService from "../../services/offline-cache";
import userService from "../../services/user";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
    passwordField: {
        fontFamily: "'Fira Code', monospace",
    },
}));

const DialogUnlockOfflineCache = (props) => {
    const classes = useStyles();
    const { open, onClose } = props;
    const { t } = useTranslation();
    const [passphrase, setPassphrase] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState([]);

    const logout = async () => {
        const logoutResponse = await userService.logout(undefined, window.location.origin);
        if (logoutResponse.hasOwnProperty('redirect_url')) {
            window.location.href = logoutResponse['redirect_url'];
        } else {
            window.location.href = 'logout-success.html';
        }
    };

    const unlock = async () => {
        setErrors([]);
        if (offlineCacheService.unlock(passphrase)) {
            onClose();
        } else {
            setErrors(["PASSPHRASE_INCORRECT"]);
        }
    };

    return (
        <Dialog
            fullWidth
            maxWidth={"sm"}
            open={open}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                }}
                name="unlockOfflineCache"
                autoComplete="off"
            >
                <DialogTitle id="alert-dialog-title">{t("UNLOCK_OFFLINE_CACHE")}</DialogTitle>
                <DialogContent>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="passphrase"
                                label={t("PASSPHRASE")}
                                name="passphrase"
                                autoComplete="off"
                                value={passphrase}
                                onChange={(event) => {
                                    setPassphrase(event.target.value);
                                }}
                                InputProps={{
                                    type: showPassword ? "text" : "password",
                                    classes: {
                                        input: classes.passwordField,
                                    },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <GridContainerErrors errors={errors} setErrors={setErrors} />
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={logout}>{t("LOGOUT")}</Button>
                    <Button onClick={unlock} variant="contained" color="primary" disabled={!passphrase} type="submit">
                        <span>{t("UNLOCK")}</span>
                    </Button>
                </DialogActions>

            </form>
        </Dialog>
    );
};

DialogUnlockOfflineCache.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default DialogUnlockOfflineCache;
