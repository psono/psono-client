import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { makeStyles } from '@mui/styles';
import { Grid } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";

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
        window.location.href = 'logout-success.html';
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
                            <TextFieldColored
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
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
                                        input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                                    },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                size="large">
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
