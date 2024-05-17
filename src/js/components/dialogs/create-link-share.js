import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import { Grid } from "@material-ui/core";
import TextField from "@material-ui/core/TextField";
import { KeyboardDateTimePicker } from "@material-ui/pickers";
import InputAdornment from "@material-ui/core/InputAdornment";
import IconButton from "@material-ui/core/IconButton";
import add from "date-fns/add";
import cryptoLibraryService from "../../services/crypto-library";
import linkShareService from "../../services/link-share";
import { getStore } from "../../services/store";
import hostService from "../../services/host";
import converter from "../../services/converter";
import ContentCopy from "../icons/ContentCopy";
import browserClient from "../../services/browser-client";
import MenuOpenIcon from "@material-ui/icons/MenuOpen";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import Typography from "@material-ui/core/Typography";
import PhonelinkSetupIcon from "@material-ui/icons/PhonelinkSetup";
import browserClientService from "../../services/browser-client";
import notification from "../../services/notification";
import datastorePasswordService from "../../services/datastore-password";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
}));

const DialogCreateLinkShare = (props) => {
    const { open, onClose } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [publicTitle, setPublicTitle] = useState(props.item.name);
    const [allowedReads, setAllowedReads] = useState(1);
    const [validTill, setValidTill] = useState(add(new Date(), { days: 1 }));
    const [showPassphrase, setShowPassphrase] = useState(false);
    const [passphrase, setPassphrase] = useState("");
    const [linkShareAccessUrl, setLinkShareAccessUrl] = useState("");
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

    const copyToClipbard = (event) => {
        browserClient.copyToClipboard(() => Promise.resolve(linkShareAccessUrl));
    };
    const onCreate = (event) => {
        const linkShareSecret = cryptoLibraryService.generateSecretKey();

        const content = {
            secret_id: props.item.secret_id,
            secret_key: props.item.secret_key,
            type: props.item.type,
        };
        if (props.item.hasOwnProperty("file_chunks")) {
            content["file_chunks"] = props.item["file_chunks"];
        }
        if (props.item.hasOwnProperty("file_id")) {
            content["file_id"] = props.item["file_id"];
        }
        if (props.item.hasOwnProperty("file_secret_key")) {
            content["file_secret_key"] = props.item["file_secret_key"];
        }
        if (props.item.hasOwnProperty("file_shard_id")) {
            content["file_shard_id"] = props.item["file_shard_id"];
        }
        if (props.item.hasOwnProperty("file_title")) {
            content["file_title"] = props.item["file_title"];
        }

        const itemEncrypted = cryptoLibraryService.encryptData(JSON.stringify(content), linkShareSecret);

        let validTillStr = null;
        if (validTill !== null) {
            validTillStr = validTill.toISOString();
        }

        let allowedReadsValidated = null;
        if (allowedReads === 0 || allowedReads) {
            allowedReadsValidated = allowedReads;
        }

        let fileId = undefined;
        let secretId = undefined;

        if (props.item.hasOwnProperty("file_id")) {
            fileId = props.item.file_id;
        } else {
            secretId = props.item.secret_id;
        }

        const onError = function (result) {
            // pass
            console.log(result);
        };

        const onSuccess = function (result) {
            hostService.info().then(function (info) {
                const encodedServerUrl = converter.toBase58(converter.encodeUtf8(getStore().getState().server.url));
                setLinkShareAccessUrl(
                    info["data"]["decoded_info"]["web_client"] +
                        "/link-share-access.html#!/link-share-access/" +
                        result.link_share_id +
                        "/" +
                        linkShareSecret +
                        "/" +
                        encodedServerUrl +
                        "/" +
                        getStore().getState().server.verifyKey
                );
            });
        };

        linkShareService
            .createLinkShare(
                secretId,
                fileId,
                itemEncrypted.text,
                itemEncrypted.nonce,
                publicTitle,
                allowedReadsValidated,
                passphrase,
                validTillStr
            )
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
            <DialogTitle id="alert-dialog-title">{t("CREATE_LINK_SHARE")}</DialogTitle>
            {Boolean(linkShareAccessUrl) && (
                <DialogContent>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="linkShareAccessUrl"
                                label={t("URL")}
                                name="linkShareAccessUrl"
                                autoComplete="off"
                                value={linkShareAccessUrl}
                                readOnly
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="copy to clipboard"
                                                onClick={copyToClipbard}
                                                edge="end"
                                            >
                                                <ContentCopy fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
            )}
            {!Boolean(linkShareAccessUrl) && (
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
                                value={publicTitle}
                                required
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
                    </Grid>
                </DialogContent>
            )}
            <DialogActions>
                <Button
                    onClick={() => {
                        onClose();
                    }}
                >
                    {t("CLOSE")}
                </Button>
                {!linkShareAccessUrl && (
                    <Button
                        onClick={onCreate}
                        variant="contained"
                        color="primary"
                        disabled={!publicTitle}
                    >
                        {t("CREATE")}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

DialogCreateLinkShare.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    item: PropTypes.object.isRequired,
};

export default DialogCreateLinkShare;
