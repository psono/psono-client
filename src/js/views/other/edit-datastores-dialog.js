import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { Checkbox, Grid } from "@mui/material";
import TextField from "@mui/material/TextField";

import GridContainerErrors from "../../components/grid-container-errors";
import { Check } from "@mui/icons-material";
import datastore from "../../services/datastore";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
    checked: {
        color: "#9c27b0",
    },
    checkedIcon: {
        width: "20px",
        height: "20px",
        border: "1px solid #666",
        borderRadius: "3px",
    },
    uncheckedIcon: {
        width: "0px",
        height: "0px",
        padding: "9px",
        border: "1px solid #666",
        borderRadius: "3px",
    },
}));

const EditDatastoresDialog = (props) => {
    const { open, onClose, datastoreId } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [description, setDescription] = useState(props.description);
    const [isDefault, setIsDefault] = useState(props.isDefault);
    const [errors, setErrors] = useState([]);

    const edit = () => {
        const onError = function (result) {
            // pass
        };

        const onSuccess = function (result) {
            onClose();
        };

        return datastore.saveDatastoreMeta(datastoreId, description, isDefault).then(onSuccess, onError);
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
            <DialogTitle id="alert-dialog-title">{t("EDIT_DATASTORE")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="description"
                            label={t("DATASTORE_DESCRIPTION")}
                            name="description"
                            autoComplete="off"
                            value={description}
                            onChange={(event) => {
                                setDescription(event.target.value);
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Checkbox
                            tabIndex={1}
                            checked={isDefault}
                            onChange={(event) => {
                                setIsDefault(event.target.checked);
                            }}
                            checkedIcon={<Check className={classes.checkedIcon} />}
                            icon={<Check className={classes.uncheckedIcon} />}
                            disabled={isDefault}
                            classes={{
                                checked: classes.checked,
                            }}
                        />{" "}
                        {t("SET_AS_DEFAULT_DATASTORE")}
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        onClose();
                    }}
                >
                    {t("CLOSE")}
                </Button>
                <Button
                    onClick={() => {
                        edit();
                    }}
                    variant="contained"
                    color="primary"
                    disabled={!description}
                >
                    {t("EDIT")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

EditDatastoresDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    datastoreId: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    isDefault: PropTypes.bool.isRequired,
};

export default EditDatastoresDialog;
