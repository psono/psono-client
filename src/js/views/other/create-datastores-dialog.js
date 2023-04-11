import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import { Checkbox, Grid } from "@material-ui/core";
import TextField from "@material-ui/core/TextField";

import GridContainerErrors from "../../components/grid-container-errors";
import { Check } from "@material-ui/icons";
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

const CreateDatastoresDialog = (props) => {
    const { open, onClose, datastoreId } = props;
    const { t } = useTranslation();
    const [existingDatastoreDescriptions, setExistingDatastoreDescriptions] = React.useState([]);
    const classes = useStyles();
    const [description, setDescription] = useState("");
    const [isDefault, setIsDefault] = useState(false);
    const [errors, setErrors] = useState([]);

    React.useEffect(() => {
        loadDatastores();
    }, []);

    const loadDatastores = () => {
        return datastore.getDatastoreOverview(true).then(
            function (overview) {
                setExistingDatastoreDescriptions(
                    overview.datastores
                        .filter((datastore) => datastore["type"] === "password")
                        .map((datastore, index) => {
                            return datastore.description;
                        })
                );
            },
            function (error) {
                console.log(error);
            }
        );
    };
    const create = () => {
        const onError = function (result) {
            // pass
        };

        const onSuccess = function (result) {
            onClose();
        };

        return datastore.createDatastore("password", description, isDefault).then(onSuccess, onError);
    };

    let descriptionAlreadyExists = existingDatastoreDescriptions.includes(description)

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
            <DialogTitle id="alert-dialog-title">{t("CREATE_DATASTORE")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="description"
                            label={t("DATASTORE_DESCRIPTION")}
                            name="description"
                            autoComplete="off"
                            value={description}
                            onChange={(event) => {
                                setDescription(event.target.value);
                                if (existingDatastoreDescriptions.includes(event.target.value)) {
                                    setErrors(["DATASTORE_DESCRIPTION_MUST_BE_UNIQUE"]);
                                } else {
                                    setErrors([]);
                                }
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
                        create();
                    }}
                    variant="contained"
                    color="primary"
                    disabled={!description || descriptionAlreadyExists}
                >
                    {t("CREATE")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

CreateDatastoresDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default CreateDatastoresDialog;
