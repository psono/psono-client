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
import { Check } from "@material-ui/icons";
import TextField from "@material-ui/core/TextField";
import { KeyboardDateTimePicker } from "@material-ui/pickers";

import GridContainerErrors from "../../components/grid-container-errors";
import linkShareService from "../../services/link-share";
import TextFieldPassword from "../../components/text-field-password";

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

const EditActiveLinksShareDialog = (props) => {
    const { open, onClose, linkShare } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [publicTitle, setPublicTitle] = useState(linkShare.public_title);
    const [allowedReads, setAllowedReads] = useState(linkShare.allowed_reads);
    const [passphrase, setPassphrase] = useState("");
    const [passphraseRepeat, setPassphraseRepeat] = useState("");
    const [changePassphrase, setChangePassphrase] = useState(false);
    const [validTill, setValidTill] = useState(linkShare.valid_till ? new Date(linkShare.valid_till) : null);
    const [errors, setErrors] = useState([]);

    const onEdit = () => {
        setErrors([]);
        if (changePassphrase && passphrase && passphrase !== passphraseRepeat) {
            setErrors(["PASSPHRASE_MISSMATCH"]);
            return;
        }

        let newPassphrase = null;
        if (changePassphrase) {
            newPassphrase = passphrase;
        }

        let newValidTill = null;
        if (validTill !== null) {
            newValidTill = validTill.toISOString();
        }

        const onError = function (data) {
            if (data.hasOwnProperty("non_field_errors")) {
                setErrors(data.non_field_errors);
            } else {
                console.log(data);
                alert("Error, should not happen.");
            }
        };

        const onSuccess = function (result) {
            onClose();
        };
        linkShareService.updateLinkShare(linkShare.id, publicTitle, allowedReads, newPassphrase, newValidTill).then(onSuccess, onError);
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
            <DialogTitle id="alert-dialog-title">{t("EDIT_LINK_SHARE")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="publicTitle"
                            label={t("PUBLIC_TITLE")}
                            helperText={t("INFO_PUBLIC_TITLE_WILL_BE_VISIBLE")}
                            name="publicTitle"
                            autoComplete="publicTitle"
                            required
                            value={publicTitle}
                            onChange={(event) => {
                                setPublicTitle(event.target.value);
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="allowedReads"
                            label={t("ALLOWED_USAGE")}
                            helperText={t("INFO_HOW_OFTEN_CAN_LINK_SHARE_BE_USED")}
                            name="allowedReads"
                            autoComplete="allowedReads"
                            InputProps={{
                                inputProps: {
                                    min: 0,
                                },
                            }}
                            value={allowedReads}
                            type="number"
                            onChange={(event) => {
                                setAllowedReads(event.target.value);
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <KeyboardDateTimePicker
                            className={classes.textField}
                            variant="dialog"
                            inputVariant="outlined"
                            margin="dense"
                            ampm={false}
                            label={t("VALID_TILL")}
                            helperText={t("INFO_HOW_LONG_CAN_LINK_SHARE_BE_USED")}
                            value={validTill}
                            onChange={(newValidTill) => {
                                setValidTill(newValidTill);
                            }}
                            format={t("DATE_TIME_YYYY_MM_DD_HH_MM")}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Checkbox
                            tabIndex={1}
                            checked={changePassphrase}
                            onChange={(event) => {
                                setChangePassphrase(event.target.checked);
                            }}
                            checkedIcon={<Check className={classes.checkedIcon} />}
                            icon={<Check className={classes.uncheckedIcon} />}
                            classes={{
                                checked: classes.checked,
                            }}
                        />{" "}
                        {t("CHANGE_PASSPHRASE")}
                    </Grid>
                    {changePassphrase && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextFieldPassword
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="passphrase"
                                label={t("PASSPHRASE")}
                                helperText={t("SHARE_LINK_PASSPHRASE_INFO")}
                                name="passphrase"
                                autoComplete="passphrase"
                                value={passphrase}
                                onChange={(event) => {
                                    setPassphrase(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {changePassphrase && Boolean(passphrase) && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextFieldPassword
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="passphraseRepeat"
                                label={t("PASSPHRASE_REPEAT")}
                                name="passphraseRepeat"
                                autoComplete="passphraseRepeat"
                                error={Boolean(passphrase) && Boolean(passphraseRepeat) && passphrase !== passphraseRepeat}
                                value={passphraseRepeat}
                                required
                                onChange={(event) => {
                                    setPassphraseRepeat(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
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
                        onEdit();
                    }}
                    variant="contained"
                    color="primary"
                    disabled={!publicTitle}
                >
                    {t("EDIT")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

EditActiveLinksShareDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    linkShare: PropTypes.object.isRequired,
};

export default EditActiveLinksShareDialog;
