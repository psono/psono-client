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
import MuiAlert from '@mui/material/Alert'
import ButtonDanger from "../../components/button-danger";
import GridContainerErrors from "../../components/grid-container-errors";
import datastore from "../../services/datastore";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
}));

const DeleteDatastoresDialog = (props) => {
    const { open, onClose } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState([]);

    const showPassword = ["LDAP", "AUTHKEY"].indexOf(getStore().getState().user.authentication) !== -1;

    const deleteDatastore = () => {
        setErrors([]);
        setPassword("");

        const onError = function (data) {
            console.log(data);

            if (data.hasOwnProperty("message")) {
                setErrors([data.message]);
            } else {
                alert("Error, should not happen.");
            }
        };

        const onSuccess = function () {
            onClose();
        };
        datastore.deleteDatastore(props.datastoreId, password).then(onSuccess, onError);
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
            <DialogTitle id="alert-dialog-title">{t("DELETE_DATASTORE")}</DialogTitle>
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
                    {t("IT_IS_IMPOSSIBLE_TO_REVERT_DELETE_DATASTORE")}
                </MuiAlert>
            </DialogContent>
            <DialogActions>
                <ButtonDanger
                    onClick={() => {
                        deleteDatastore();
                    }}
                    disabled={showPassword && !password}
                    autoFocus
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

DeleteDatastoresDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    datastoreId: PropTypes.string.isRequired,
};

export default DeleteDatastoresDialog;
