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
import InputAdornment from "@material-ui/core/InputAdornment";
import IconButton from "@material-ui/core/IconButton";
import MenuOpenIcon from "@material-ui/icons/MenuOpen";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import Typography from "@material-ui/core/Typography";
import ContentCopy from "../../components/icons/ContentCopy";
import PhonelinkSetupIcon from "@material-ui/icons/PhonelinkSetup";
import browserClientService from "../../services/browser-client";
import notification from "../../services/notification";
import datastorePasswordService from "../../services/datastore-password";

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
    const [changePassphrase, setChangePassphrase] = useState(false);
    const [validTill, setValidTill] = useState(linkShare.valid_till ? new Date(linkShare.valid_till) : null);
    const [errors, setErrors] = useState([]);
    const [showPassphrase, setShowPassphrase] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleClose = () => {
        setAnchorEl(null);
    };

    const onShowHidePassphrase = (event) => {
        handleClose();
        setShowPassphrase(!showPassphrase);
    };

    const onCopyPassphrase = (event) => {
        handleClose();
        browserClientService.copyToClipboard(() => Promise.resolve(passphrase));
        notification.push("password_copy", t("PASSPHRASE_COPY_NOTIFICATION"));
    };
    const onGeneratePassphrase = (event) => {
        handleClose();
        const generatedPassphrase = datastorePasswordService.generate();
        setPassphrase(generatedPassphrase);
    };

    const onEdit = () => {
        setErrors([]);

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
        linkShareService
            .updateLinkShare(linkShare.id, publicTitle, allowedReads, newPassphrase, newValidTill)
            .then(onSuccess, onError);
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
                            autoComplete="off"
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
                            autoComplete="off"
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
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="passphrase"
                                label={t("PASSPHRASE")}
                                helperText={t("SHARE_LINK_PASSPHRASE_INFO")}
                                name="passphrase"
                                autoComplete="off"
                                value={passphrase}
                                onChange={(event) => {
                                    setPassphrase(event.target.value);
                                }}
                                InputProps={{
                                    type: showPassphrase ? "text" : "password",
                                    classes: {
                                        input: classes.passwordField,
                                    },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                className={classes.iconButton}
                                                aria-label="menu"
                                                onClick={(event) => {
                                                    setAnchorEl(event.currentTarget);
                                                }}
                                            >
                                                <MenuOpenIcon fontSize="small" />
                                            </IconButton>
                                            <Menu
                                                id="simple-menu"
                                                anchorEl={anchorEl}
                                                keepMounted
                                                open={Boolean(anchorEl)}
                                                onClose={handleClose}
                                            >
                                                <MenuItem onClick={onShowHidePassphrase}>
                                                    <ListItemIcon className={classes.listItemIcon}>
                                                        <VisibilityOffIcon className={classes.icon} fontSize="small" />
                                                    </ListItemIcon>
                                                    <Typography variant="body2" noWrap>
                                                        {t("SHOW_OR_HIDE_PASSPHRASE")}
                                                    </Typography>
                                                </MenuItem>
                                                <MenuItem onClick={onCopyPassphrase}>
                                                    <ListItemIcon className={classes.listItemIcon}>
                                                        <ContentCopy className={classes.icon} fontSize="small" />
                                                    </ListItemIcon>
                                                    <Typography variant="body2" noWrap>
                                                        {t("COPY_PASSPHRASE")}
                                                    </Typography>
                                                </MenuItem>
                                                <MenuItem onClick={onGeneratePassphrase}>
                                                    <ListItemIcon className={classes.listItemIcon}>
                                                        <PhonelinkSetupIcon className={classes.icon} fontSize="small" />
                                                    </ListItemIcon>
                                                    <Typography variant="body2" noWrap>
                                                        {t("GENERATE_PASSPHRASE")}
                                                    </Typography>
                                                </MenuItem>
                                            </Menu>
                                        </InputAdornment>
                                    ),
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
