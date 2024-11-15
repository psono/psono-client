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

import GridContainerErrors from "../../components/grid-container-errors";
import groupsService from "../../services/groups";
import helperService from "../../services/helper";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
    checked: {
        color: theme.palette.checked.main,
    },
    checkedIcon: {
        width: "20px",
        height: "20px",
        border: `1px solid ${theme.palette.greyText.main}`,
        borderRadius: "3px",
    },
    uncheckedIcon: {
        width: "0px",
        height: "0px",
        padding: "9px",
        border: `1px solid ${theme.palette.greyText.main}`,
        borderRadius: "3px",
    },
}));

const CreateGroupDialog = (props) => {
    const { open, onClose } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [name, setName] = useState("");
    const [isValidGroupName, setIsValidGroupName] = useState(false);
    const [errors, setErrors] = useState([]);

    const create = () => {
        const onError = function (result) {
            // pass
        };

        const onSuccess = function (result) {
            onClose();
        };

        return groupsService.createGroup(name).then(onSuccess, onError);
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
            <DialogTitle id="alert-dialog-title">{t("NEW_GROUP")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="name"
                            label={t("GROUP_NAME")}
                            name="name"
                            autoComplete="off"
                            required
                            value={name}
                            onChange={(event) => {
                                const test_result = helperService.isValidGroupName(event.target.value);
                                if (test_result !== true) {
                                    setErrors([test_result]);
                                } else {
                                    setErrors([]);
                                }
                                setIsValidGroupName(test_result === true);
                                setName(event.target.value);
                            }}
                        />
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
                    disabled={!name || !isValidGroupName}
                >
                    {t("CREATE")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

CreateGroupDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default CreateGroupDialog;
