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
import { Checkbox, Grid } from "@material-ui/core";
import { Check } from "@material-ui/icons";
import MuiAlert from "@material-ui/lab/Alert";

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

const DialogGenerateNewGpgKey = (props) => {
    const classes = useStyles();
    const { open, onClose } = props;
    const { t } = useTranslation();
    const [title, setTitle] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [publishPublicKey, setPublishPublicKey] = useState(true);
    const [publicKey, setPublicKey] = useState("");
    const [privateKey, setPrivateKey] = useState("");
    const [errors, setErrors] = useState([]);

    const generateGpgKey = async () => {
        // TODO
    };

    return (
        <Dialog fullWidth maxWidth={"sm"} open={open} onClose={onClose} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
            <DialogTitle id="alert-dialog-title">{t("IMPORT_GPG_KEY")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <GridContainerErrors errors={errors} setErrors={setErrors} />
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="title"
                            label={t("TITLE")}
                            helperText={t("TITLE_TO_IDENTIFY_THIS_KEY")}
                            name="title"
                            autoComplete="title"
                            value={title}
                            onChange={(event) => {
                                setTitle(event.target.value);
                            }}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="name"
                            label={t("NAME")}
                            helperText={t("YOUR_REQUIRED_NAME")}
                            name="name"
                            autoComplete="name"
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value);
                            }}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="email"
                            label={t("NAME")}
                            helperText={t("YOUR_REQUIRED_NAME")}
                            name="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value);
                            }}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Checkbox
                            checked={publishPublicKey}
                            onChange={(event) => {
                                setPublishPublicKey(event.target.checked);
                            }}
                            checkedIcon={<Check className={classes.checkedIcon} />}
                            icon={<Check className={classes.uncheckedIcon} />}
                            classes={{
                                checked: classes.checked,
                            }}
                        />{" "}
                        {t("PUBLISH_PUBLIC_KEY")}
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <MuiAlert
                            severity="info"
                            style={{
                                marginBottom: "5px",
                                marginTop: "5px",
                            }}
                        >
                            {t("NAME_AND_EMAIL_ADDRESS_WILL_BE_PUBLICLY_AVAILABLE")}
                        </MuiAlert>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t("CLOSE")}</Button>
                <Button onClick={generateGpgKey} variant="contained" color="primary" disabled={!title || !name || !email}>
                    <span>{t("GENERATE")}</span>
                </Button>
            </DialogActions>
        </Dialog>
    );
};

DialogGenerateNewGpgKey.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    secretId: PropTypes.string,
};

export default DialogGenerateNewGpgKey;
