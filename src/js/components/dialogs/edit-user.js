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

import GridContainerErrors from "../grid-container-errors";

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

const DialogEditUser = (props) => {
    const { open, onClose, item } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [errors, setErrors] = useState([]);
    const [visualUsername, setVisualUsername] = useState(item.data.user_name || "");
    const [username, setUsername] = useState(item.data.user_username);
    const [userId, setFoundUserId] = useState(item.data.user_id);
    const [publicKey, setFoundPublicKey] = useState(item.data.user_public_key);

    const onSave = (event) => {
        if (item.data.user_name) {
            delete item.data.user_name;
        }
        if (visualUsername) {
            item.data.user_name = visualUsername;
        }

        item.name = "";
        if (item.data.user_name) {
            item.name += item.data.user_name;
        } else {
            item.name += item.data.user_username;
        }
        item.name += " (" + item.data.user_public_key + ")";

        props.onSave(item);
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
            <DialogTitle id="alert-dialog-title">{t("EDIT_USER")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="visualUsername"
                            label={t("NAME_OPTIONAL")}
                            name="visualUsername"
                            autoComplete="off"
                            value={visualUsername}
                            onChange={(event) => {
                                setVisualUsername(event.target.value);
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="username"
                            label={t("USERNAME")}
                            name="username"
                            autoComplete="off"
                            value={username}
                            disabled
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="publicKey"
                            label={t("PUBLIC_KEY")}
                            name="publicKey"
                            autoComplete="off"
                            helperText={t("TO_VERIFY_PUBLIC_KEY")}
                            value={publicKey}
                            disabled
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
                        onSave(visualUsername, userId, username, publicKey);
                    }}
                    variant="contained"
                    color="primary"
                    disabled={!userId || !username || !publicKey}
                >
                    {t("SAVE")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

DialogEditUser.propTypes = {
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    item: PropTypes.object.isRequired,
};

export default DialogEditUser;
