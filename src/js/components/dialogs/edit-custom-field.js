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
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SelectFieldCustomFieldType from "../select-field/custom-field-type";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
}));

const DialogEditCustomField = (props) => {
    const { open, onClose, customField } = props;
    const { t } = useTranslation();
    const classes = useStyles();

    const [newCustomField, setNewCustomField] = useState(customField);

    return (
        <Dialog
            fullWidth
            maxWidth={"sm"}
            open={open}
            onClose={() => {
                onClose(null);
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{t("EDIT_CUSTOM_FIELD")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="name"
                            label={t("NAME")}
                            name="name"
                            autoComplete="off"
                            value={newCustomField.name}
                            required
                            onChange={(event) => {
                                setNewCustomField({
                                    ...newCustomField,
                                    'name': event.target.value,
                                });
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <SelectFieldCustomFieldType
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="customFieldType"
                            name="customFieldType"
                            autoComplete="off"
                            value={newCustomField.type}
                            required
                            onChange={(value) => {
                                setNewCustomField({
                                    ...newCustomField,
                                    'type': value,
                                });
                            }}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        onClose(null);
                    }}
                >
                    {t("CLOSE")}
                </Button>
                <Button
                    onClick={() => {
                        onClose(newCustomField);
                    }}
                    variant="contained"
                    color="primary"
                    disabled={!newCustomField.name}
                >
                    {t("SAVE")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

DialogEditCustomField.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    customField: PropTypes.object.isRequired,
};

export default DialogEditCustomField;
