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
import InputAdornment from "@material-ui/core/InputAdornment";
import IconButton from "@material-ui/core/IconButton";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import MenuOpenIcon from "@material-ui/icons/MenuOpen";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Typography from "@material-ui/core/Typography";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import PhonelinkSetupIcon from "@material-ui/icons/PhonelinkSetup";
import DeleteIcon from "@material-ui/icons/Delete";
import PlaylistAddIcon from "@material-ui/icons/PlaylistAdd";

import helperService from "../../services/helper";
import offlineCache from "../../services/offline-cache";
import ContentCopy from "../icons/ContentCopy";
import datastorePasswordService from "../../services/datastore-password";
import browserClientService from "../../services/browser-client";
import TotpCircle from "../totp-circle";
import DialogDecryptGpgMessage from "./decrypt-gpg-message";
import DialogEncryptGpgMessage from "./encrypt-gpg-message";
import notification from "../../services/notification";
import SelectFieldEntryType from "../select-field/entry-type";
import SelectFieldTotpAlgorithm from "../select-field/totp-algorithm";
import DialogGenerateNewGpgKey from "./generate-new-gpg-key";
import DialogImportAsText from "./import-gpg-key-as-text";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
    textField5: {
        width: "100%",
        marginRight: theme.spacing(2),
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
    passwordField: {
        fontFamily: "'Fira Code', monospace",
    },
    right: {
        textAlign: "right",
    },
    icon: {
        fontSize: "18px",
    },
    listItemIcon: {
        minWidth: theme.spacing(4),
    },
    totpCircleGridItem: {
        textAlign: "center",
    },
    totpCircle: {
        width: "200px",
        height: "200px",
        padding: "10px",
    },
    iconButton: {
        padding: 10,
    },
    iconButton2: {
        padding: 14,
    },
}));

const DialogNewEntry = (props) => {
    const { open, onClose } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const offline = offlineCache.isActive();

    const [importAsTextDialogOpen, setImportAsTextDialogOpen] = useState(false);
    const [generateNewGpgKeyDialogOpen, setGenerateNewGpgKeyDialogOpen] = useState(false);

    const [decryptMessageDialogOpen, setDecryptMessageDialogOpen] = useState(false);
    const [encryptMessageDialogOpen, setEncryptMessageDialogOpen] = useState(false);
    const [encryptSecretId, setEncryptSecretId] = useState("");

    const [originalFullData, setOriginalFullData] = useState({});
    const [websitePasswordTitle, setWebsitePasswordTitle] = useState("");
    const [websitePasswordUrl, setWebsitePasswordUrl] = useState("");
    const [websitePasswordUsername, setWebsitePasswordUsername] = useState("");
    const [websitePasswordPassword, setWebsitePasswordPassword] = useState("");
    const [websitePasswordNotes, setWebsitePasswordNotes] = useState("");
    const [websitePasswordAutoSubmit, setWebsitePasswordAutoSubmit] = useState(false);
    const [websitePasswordUrlFilter, setWebsitePasswordUrlFilter] = useState("");

    const [applicationPasswordTitle, setApplicationPasswordTitle] = useState("");
    const [applicationPasswordUsername, setApplicationPasswordUsername] = useState("");
    const [applicationPasswordPassword, setApplicationPasswordPassword] = useState("");
    const [applicationPasswordNotes, setApplicationPasswordNotes] = useState("");

    const [bookmarkTitle, setBookmarkTitle] = useState("");
    const [bookmarkUrl, setBookmarkUrl] = useState("");
    const [bookmarkNotes, setBookmarkNotes] = useState("");
    const [bookmarkUrlFilter, setBookmarkUrlFilter] = useState("");

    const [noteTitle, setNoteTitle] = useState("");
    const [noteNotes, setNoteNotes] = useState("");

    const [totpTitle, setTotpTitle] = useState("");
    const [totpPeriod, setTotpPeriod] = useState(30);
    const [totpAlgorithm, setTotpAlgorithm] = useState("SHA1");
    const [totpDigits, setTotpDigits] = useState(6);
    const [totpCode, setTotpCode] = useState("");
    const [totpNotes, setTotpNotes] = useState("");

    const [environmentVariablesTitle, setEnvironmentVariablesTitle] = useState("");
    const [environmentVariablesVariables, setEnvironmentVariablesVariables] = useState([]);
    const [environmentVariablesNotes, setEnvironmentVariablesNotes] = useState("");

    const [fileTitle, setFileTitle] = useState("");

    const [mailGpgOwnKeyTitle, setMailGpgOwnKeyTitle] = useState("");
    const [mailGpgOwnKeyEmail, setMailGpgOwnKeyEmail] = useState("");
    const [mailGpgOwnKeyName, setMailGpgOwnKeyName] = useState("");
    const [mailGpgOwnKeyPublic, setMailGpgOwnKeyPublic] = useState("");
    const [mailGpgOwnKeyPrivate, setMailGpgOwnKeyPrivate] = useState("");

    const [anchorEl, setAnchorEl] = React.useState(null);

    const [callbackUrl, setCallbackUrl] = useState("");
    const [callbackPass, setCallbackPass] = useState("");
    const [callbackUser, setCallbackUser] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [type, setType] = useState("website_password");

    const hasCallback = ["file"].indexOf(type) === -1; // only files have no callbacks

    const isValidWebsitePassword = Boolean(websitePasswordTitle);
    const isValidApplicationPassword = Boolean(applicationPasswordTitle);
    const isValidBookmark = Boolean(bookmarkTitle);
    const isValidNote = Boolean(noteTitle);
    const isValidTotp = Boolean(totpTitle) && Boolean(totpCode);
    const isValidEnvironmentVariables = Boolean(environmentVariablesTitle);
    const isValidFile = Boolean(fileTitle);
    const canSave =
        (type === "website_password" && isValidWebsitePassword) ||
        (type === "application_password" && isValidApplicationPassword) ||
        (type === "bookmark" && isValidBookmark) ||
        (type === "note" && isValidNote) ||
        (type === "totp" && isValidTotp) ||
        (type === "environment_variables" && isValidEnvironmentVariables) ||
        (type === "file" && isValidFile);

    const onCreate = (event) => {
        // TODO implement create
        const secretObject = {};

        if (type === "website_password") {
            item["name"] = websitePasswordTitle;
            secretObject["website_password_title"] = websitePasswordTitle;
            if (websitePasswordUrl) {
                secretObject["website_password_url"] = websitePasswordUrl;
            }
            if (websitePasswordUsername) {
                secretObject["website_password_username"] = websitePasswordUsername;
            }
            if (websitePasswordPassword) {
                secretObject["website_password_password"] = websitePasswordPassword;
            }
            if (websitePasswordNotes) {
                secretObject["website_password_notes"] = websitePasswordNotes;
            }
            secretObject["website_password_auto_submit"] = websitePasswordAutoSubmit;
            item["autosubmit"] = websitePasswordAutoSubmit;
            if (websitePasswordUrlFilter) {
                item["urlfilter"] = websitePasswordUrlFilter;
                secretObject["website_password_url_filter"] = websitePasswordUrlFilter;
            } else {
                delete item["urlfilter"];
            }
        }

        if (type === "application_password") {
            item["name"] = applicationPasswordTitle;
            secretObject["application_password_title"] = applicationPasswordTitle;
            if (applicationPasswordUsername) {
                secretObject["application_password_username"] = applicationPasswordUsername;
            }
            if (applicationPasswordPassword) {
                secretObject["application_password_password"] = applicationPasswordPassword;
            }
            if (applicationPasswordNotes) {
                secretObject["application_password_notes"] = applicationPasswordNotes;
            }
        }

        if (type === "bookmark") {
            item["name"] = bookmarkTitle;
            secretObject["bookmark_title"] = bookmarkTitle;
            if (bookmarkUrl) {
                secretObject["bookmark_url"] = bookmarkUrl;
            }
            if (bookmarkNotes) {
                secretObject["bookmark_notes"] = bookmarkNotes;
            }
            if (bookmarkUrlFilter) {
                item["urlfilter"] = bookmarkUrlFilter;
                secretObject["bookmark_url_filter"] = bookmarkUrlFilter;
            } else {
                delete item["urlfilter"];
            }
        }

        if (type === "note") {
            item["name"] = noteTitle;
            secretObject["note_title"] = noteTitle;
            if (noteNotes) {
                secretObject["note_notes"] = noteNotes;
            }
        }

        if (type === "totp") {
            item["name"] = totpTitle;
            secretObject["totp_title"] = totpTitle;
            if (totpPeriod) {
                secretObject["totp_period"] = totpPeriod;
            }
            if (totpAlgorithm) {
                secretObject["totp_algorithm"] = totpAlgorithm;
            }
            if (totpDigits) {
                secretObject["totp_digits"] = totpDigits;
            }
            if (totpCode) {
                secretObject["totp_code"] = totpCode;
            }
            if (totpNotes) {
                secretObject["totp_notes"] = totpNotes;
            }
        }

        if (type === "environment_variables") {
            item["name"] = environmentVariablesTitle;
            secretObject["environment_variables_title"] = environmentVariablesTitle;
            if (environmentVariablesVariables) {
                secretObject["environment_variables_variables"] = environmentVariablesVariables;
            }
            if (environmentVariablesNotes) {
                secretObject["environment_variables_notes"] = environmentVariablesNotes;
            }
        }

        if (type === "file") {
            item["name"] = fileTitle;
            item["file_title"] = fileTitle;
            secretObject["file_title"] = fileTitle;
        }

        if (type === "mail_gpg_own_key") {
            item["name"] = mailGpgOwnKeyTitle;
            secretObject["mail_gpg_own_key_title"] = mailGpgOwnKeyTitle;
            if (mailGpgOwnKeyEmail) {
                secretObject["mail_gpg_own_key_email"] = mailGpgOwnKeyEmail;
            }
            if (mailGpgOwnKeyName) {
                secretObject["mail_gpg_own_key_name"] = mailGpgOwnKeyName;
            }
            if (mailGpgOwnKeyPublic) {
                secretObject["mail_gpg_own_key_public"] = mailGpgOwnKeyPublic;
            }
            secretObject["mail_gpg_own_key_private"] = mailGpgOwnKeyPrivate;
        }
        // if (typeof item.secret_id === "undefined") {
        //     // e.g. files
        //     props.onCreate(item);
        // } else if (props.data) {
        //     const onError = function (result) {
        //         // pass
        //     };
        //
        //     const onSuccess = function (e) {
        //         props.onCreate(item);
        //     };
        //     secretService.writeSecret(item.secret_id, item.secret_key, secretObject, callbackUrl, callbackUser, callbackPass).then(onSuccess, onError);
        // }
    };

    const onShowHidePassword = (event) => {
        handleClose();
        setShowPassword(!showPassword);
    };

    const onCopyPassword = (event) => {
        handleClose();
        if (type === "website_password") {
            browserClientService.copyToClipboard(websitePasswordPassword);
        }
        if (type === "application_password") {
            browserClientService.copyToClipboard(applicationPasswordPassword);
        }
        notification.push("password_copy", t("PASSWORD_COPY_NOTIFICATION"));
    };
    const onGeneratePassword = (event) => {
        handleClose();
        const password = datastorePasswordService.generate();
        if (type === "website_password") {
            setWebsitePasswordPassword(password);
        }
        if (type === "application_password") {
            setApplicationPasswordPassword(password);
        }
    };
    const openMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
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
            <DialogTitle id="alert-dialog-title">{t("NEW_ENTRY")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <SelectFieldEntryType
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="itemBlueprint"
                            name="itemBlueprint"
                            autoComplete="itemBlueprint"
                            value={type}
                            required
                            onChange={(newType) => {
                                setType(newType);
                            }}
                        />
                    </Grid>
                    {type === "website_password" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="websitePasswordTitle"
                                label={t("TITLE")}
                                name="websitePasswordTitle"
                                autoComplete="websitePasswordTitle"
                                value={websitePasswordTitle}
                                required
                                onChange={(event) => {
                                    setWebsitePasswordTitle(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "website_password" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="websitePasswordUrl"
                                label={t("URL")}
                                name="websitePasswordUrl"
                                autoComplete="websitePasswordUrl"
                                value={websitePasswordUrl}
                                onChange={(event) => {
                                    // get only toplevel domain
                                    const parsedUrl = helperService.parseUrl(event.target.value);
                                    if (!event.target.value) {
                                        setWebsitePasswordUrlFilter("");
                                    } else if (typeof parsedUrl.authority === "undefined") {
                                        setWebsitePasswordUrlFilter("");
                                    } else {
                                        setWebsitePasswordUrlFilter(parsedUrl.authority);
                                    }
                                    setWebsitePasswordUrl(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "website_password" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="websitePasswordUsername"
                                label={t("USERNAME")}
                                name="websitePasswordUsername"
                                autoComplete="websitePasswordUsername"
                                value={websitePasswordUsername}
                                onChange={(event) => {
                                    setWebsitePasswordUsername(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "website_password" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="websitePasswordPassword"
                                label={t("PASSWORD")}
                                name="websitePasswordPassword"
                                autoComplete="websitePasswordPassword"
                                value={websitePasswordPassword}
                                onChange={(event) => {
                                    setWebsitePasswordPassword(event.target.value);
                                }}
                                InputProps={{
                                    type: showPassword ? "text" : "password",
                                    classes: {
                                        input: classes.passwordField,
                                    },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton className={classes.iconButton} aria-label="menu" onClick={openMenu}>
                                                <MenuOpenIcon />
                                            </IconButton>
                                            <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
                                                <MenuItem onClick={onShowHidePassword}>
                                                    <ListItemIcon className={classes.listItemIcon}>
                                                        <VisibilityOffIcon className={classes.icon} fontSize="small" />
                                                    </ListItemIcon>
                                                    <Typography variant="body2" noWrap>
                                                        {t("SHOW_OR_HIDE_PASSWORD")}
                                                    </Typography>
                                                </MenuItem>
                                                <MenuItem onClick={onCopyPassword}>
                                                    <ListItemIcon className={classes.listItemIcon}>
                                                        <ContentCopy className={classes.icon} fontSize="small" />
                                                    </ListItemIcon>
                                                    <Typography variant="body2" noWrap>
                                                        {t("COPY_PASSWORD")}
                                                    </Typography>
                                                </MenuItem>
                                                <MenuItem onClick={onGeneratePassword}>
                                                    <ListItemIcon className={classes.listItemIcon}>
                                                        <PhonelinkSetupIcon className={classes.icon} fontSize="small" />
                                                    </ListItemIcon>
                                                    <Typography variant="body2" noWrap>
                                                        {t("GENERATE_PASSWORD")}
                                                    </Typography>
                                                </MenuItem>
                                            </Menu>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    )}
                    {type === "website_password" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="websitePasswordNotes"
                                label={t("NOTES")}
                                name="websitePasswordNotes"
                                autoComplete="websitePasswordNotes"
                                value={websitePasswordNotes}
                                onChange={(event) => {
                                    setWebsitePasswordNotes(event.target.value);
                                }}
                                multiline
                                minRows={3}
                            />
                        </Grid>
                    )}

                    {type === "application_password" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="applicationPasswordTitle"
                                label={t("TITLE")}
                                name="applicationPasswordTitle"
                                autoComplete="applicationPasswordTitle"
                                value={applicationPasswordTitle}
                                required
                                onChange={(event) => {
                                    setApplicationPasswordTitle(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "application_password" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="applicationPasswordUsername"
                                label={t("USERNAME")}
                                name="applicationPasswordUsername"
                                autoComplete="applicationPasswordUsername"
                                value={applicationPasswordUsername}
                                onChange={(event) => {
                                    setApplicationPasswordUsername(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "application_password" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="applicationPasswordPassword"
                                label={t("PASSWORD")}
                                name="applicationPasswordPassword"
                                autoComplete="applicationPasswordPassword"
                                value={applicationPasswordPassword}
                                onChange={(event) => {
                                    setApplicationPasswordPassword(event.target.value);
                                }}
                                InputProps={{
                                    type: showPassword ? "text" : "password",
                                    classes: {
                                        input: classes.passwordField,
                                    },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton className={classes.iconButton} aria-label="menu" onClick={openMenu}>
                                                <MenuOpenIcon />
                                            </IconButton>
                                            <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
                                                <MenuItem onClick={onShowHidePassword}>
                                                    <ListItemIcon className={classes.listItemIcon}>
                                                        <VisibilityOffIcon className={classes.icon} fontSize="small" />
                                                    </ListItemIcon>
                                                    <Typography variant="body2" noWrap>
                                                        {t("SHOW_OR_HIDE_PASSWORD")}
                                                    </Typography>
                                                </MenuItem>
                                                <MenuItem onClick={onCopyPassword}>
                                                    <ListItemIcon className={classes.listItemIcon}>
                                                        <ContentCopy className={classes.icon} fontSize="small" />
                                                    </ListItemIcon>
                                                    <Typography variant="body2" noWrap>
                                                        {t("COPY_PASSWORD")}
                                                    </Typography>
                                                </MenuItem>
                                                <MenuItem onClick={onGeneratePassword}>
                                                    <ListItemIcon className={classes.listItemIcon}>
                                                        <PhonelinkSetupIcon className={classes.icon} fontSize="small" />
                                                    </ListItemIcon>
                                                    <Typography variant="body2" noWrap>
                                                        {t("GENERATE_PASSWORD")}
                                                    </Typography>
                                                </MenuItem>
                                            </Menu>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    )}
                    {type === "application_password" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="applicationPasswordNotes"
                                label={t("NOTES")}
                                name="applicationPasswordNotes"
                                autoComplete="applicationPasswordNotes"
                                value={applicationPasswordNotes}
                                onChange={(event) => {
                                    setApplicationPasswordNotes(event.target.value);
                                }}
                                multiline
                                minRows={3}
                            />
                        </Grid>
                    )}

                    {type === "bookmark" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="bookmarkTitle"
                                label={t("TITLE")}
                                name="bookmarkTitle"
                                autoComplete="bookmarkTitle"
                                value={bookmarkTitle}
                                required
                                onChange={(event) => {
                                    setBookmarkTitle(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "bookmark" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="bookmarkUrl"
                                label={t("URL")}
                                name="bookmarkUrl"
                                autoComplete="bookmarkUrl"
                                value={bookmarkUrl}
                                onChange={(event) => {
                                    // get only toplevel domain
                                    const parsedUrl = helperService.parseUrl(event.target.value);
                                    if (!event.target.value) {
                                        setBookmarkUrlFilter("");
                                    } else if (typeof parsedUrl.authority === "undefined") {
                                        setBookmarkUrlFilter("");
                                    } else {
                                        setBookmarkUrlFilter(parsedUrl.authority);
                                    }
                                    setBookmarkUrl(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "bookmark" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="bookmarkNotes"
                                label={t("NOTES")}
                                name="bookmarkNotes"
                                autoComplete="bookmarkNotes"
                                value={bookmarkNotes}
                                onChange={(event) => {
                                    setBookmarkNotes(event.target.value);
                                }}
                                multiline
                                minRows={3}
                            />
                        </Grid>
                    )}

                    {type === "note" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="noteTitle"
                                label={t("TITLE")}
                                name="noteTitle"
                                autoComplete="noteTitle"
                                value={noteTitle}
                                required
                                onChange={(event) => {
                                    setNoteTitle(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "note" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="noteNotes"
                                label={t("NOTES")}
                                name="noteNotes"
                                autoComplete="noteNotes"
                                value={noteNotes}
                                onChange={(event) => {
                                    setNoteNotes(event.target.value);
                                }}
                                multiline
                                minRows={3}
                            />
                        </Grid>
                    )}

                    {type === "totp" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="totpTitle"
                                label={t("TITLE")}
                                name="totpTitle"
                                autoComplete="totpTitle"
                                value={totpTitle}
                                required
                                onChange={(event) => {
                                    setTotpTitle(event.target.value);
                                }}
                            />
                        </Grid>
                    )}

                    {type === "totp" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="totpPeriod"
                                label={t("PERIOD_EG_30")}
                                name="totpPeriod"
                                autoComplete="totpPeriod"
                                value={totpPeriod}
                                required
                                InputProps={{
                                    inputProps: {
                                        min: 0,
                                        step: 1,
                                    },
                                }}
                                type="number"
                                onChange={(event) => {
                                    setTotpPeriod(parseInt(event.target.value) || 30);
                                }}
                            />
                        </Grid>
                    )}

                    {type === "totp" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <SelectFieldTotpAlgorithm
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="totpAlgorithm"
                                name="totpAlgorithm"
                                autoComplete="totpAlgorithm"
                                value={totpAlgorithm}
                                required
                                onChange={(value) => {
                                    setTotpAlgorithm(value);
                                }}
                            />
                        </Grid>
                    )}

                    {type === "totp" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="totpDigits"
                                label={t("DIGITS_EG_6")}
                                name="totpDigits"
                                autoComplete="totpDigits"
                                value={totpDigits}
                                required
                                InputProps={{
                                    inputProps: {
                                        min: 0,
                                        step: 1,
                                    },
                                }}
                                type="number"
                                onChange={(event) => {
                                    setTotpDigits(parseInt(event.target.value) || 6);
                                }}
                            />
                        </Grid>
                    )}

                    {type === "totp" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="totpCode"
                                label={t("SECRET")}
                                name="totpCode"
                                autoComplete="totpCode"
                                value={totpCode}
                                required
                                onChange={(event) => {
                                    setTotpCode(event.target.value);
                                }}
                                InputProps={{
                                    type: showPassword ? "text" : "password",
                                    classes: {
                                        input: classes.passwordField,
                                    },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton className={classes.iconButton} aria-label="menu" onClick={onShowHidePassword}>
                                                <VisibilityOffIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    )}

                    {type === "totp" && (
                        <Grid item xs={12} sm={12} md={12} className={classes.totpCircleGridItem}>
                            <TotpCircle period={totpPeriod} algorithm={totpAlgorithm} digits={totpDigits} code={totpCode} className={classes.totpCircle} />
                        </Grid>
                    )}
                    {type === "totp" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="totpNotes"
                                label={t("NOTES")}
                                name="totpNotes"
                                autoComplete="totpNotes"
                                value={totpNotes}
                                onChange={(event) => {
                                    setTotpNotes(event.target.value);
                                }}
                                multiline
                                minRows={3}
                            />
                        </Grid>
                    )}

                    {type === "environment_variables" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="environmentVariablesTitle"
                                label={t("TITLE")}
                                name="environmentVariablesTitle"
                                autoComplete="environmentVariablesTitle"
                                value={environmentVariablesTitle}
                                required
                                onChange={(event) => {
                                    setEnvironmentVariablesTitle(event.target.value);
                                }}
                            />
                        </Grid>
                    )}

                    {type === "environment_variables" && (
                        <React.Fragment>
                            {environmentVariablesVariables.map((variable, index) => {
                                return (
                                    <React.Fragment key={index}>
                                        <Grid item xs={5} sm={5} md={5}>
                                            <TextField
                                                className={classes.textField5}
                                                variant="outlined"
                                                margin="dense"
                                                id={"environmentVariablesVariables-key-" + index}
                                                label={t("KEY")}
                                                name={"environmentVariablesVariables-key-" + index}
                                                autoComplete={"environmentVariablesVariables-key-" + index}
                                                value={variable.key}
                                                required
                                                onChange={(event) => {
                                                    const newEnvs = helperService.duplicateObject(environmentVariablesVariables);
                                                    newEnvs[index]["key"] = event.target.value;
                                                    setEnvironmentVariablesVariables(newEnvs);
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={5} sm={5} md={5}>
                                            <TextField
                                                className={classes.textField5}
                                                variant="outlined"
                                                margin="dense"
                                                id={"environmentVariablesVariables-value-" + index}
                                                label={t("VALUE")}
                                                name={"environmentVariablesVariables-value-" + index}
                                                autoComplete={"environmentVariablesVariables-value-" + index}
                                                value={variable.value}
                                                required
                                                onChange={(event) => {
                                                    const newEnvs = helperService.duplicateObject(environmentVariablesVariables);
                                                    newEnvs[index]["value"] = event.target.value;
                                                    setEnvironmentVariablesVariables(newEnvs);
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={1} sm={1} md={1}>
                                            <IconButton
                                                className={classes.iconButton2}
                                                aria-label="menu"
                                                onClick={() => {
                                                    const newEnvs = helperService.duplicateObject(environmentVariablesVariables);
                                                    newEnvs.splice(index, 1);
                                                    setEnvironmentVariablesVariables(newEnvs);
                                                }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Grid>
                                    </React.Fragment>
                                );
                            })}
                        </React.Fragment>
                    )}
                    {type === "environment_variables" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <Button
                                startIcon={<PlaylistAddIcon />}
                                onClick={() => {
                                    const newEnvs = helperService.duplicateObject(environmentVariablesVariables);
                                    newEnvs.push({
                                        key: "",
                                        value: "",
                                    });
                                    setEnvironmentVariablesVariables(newEnvs);
                                }}
                            >
                                {t("ADD_ENTRY")}
                            </Button>
                        </Grid>
                    )}
                    {type === "environment_variables" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="environmentVariablesNotes"
                                label={t("NOTES")}
                                name="environmentVariablesNotes"
                                autoComplete="environmentVariablesNotes"
                                value={environmentVariablesNotes}
                                onChange={(event) => {
                                    setEnvironmentVariablesNotes(event.target.value);
                                }}
                                multiline
                                minRows={3}
                            />
                        </Grid>
                    )}

                    {type === "file" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="fileTitle"
                                label={t("TITLE")}
                                name="fileTitle"
                                autoComplete="fileTitle"
                                value={fileTitle}
                                required
                                onChange={(event) => {
                                    setFileTitle(event.target.value);
                                }}
                            />
                        </Grid>
                    )}

                    {type === "mail_gpg_own_key" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <Button
                                onClick={() => {
                                    setGenerateNewGpgKeyDialogOpen(true);
                                }}
                            >
                                {t("GENERATE_NEW_GPG_KEY")}
                            </Button>
                            <Button onClick={() => setImportAsTextDialogOpen(true)}>{t("IMPORT_AS_TEXT")}</Button>
                        </Grid>
                    )}

                    {/*{type === "mail_gpg_own_key" && (*/}
                    {/*    <Grid item xs={12} sm={12} md={12}>*/}
                    {/*        <TextField*/}
                    {/*            className={classes.textField}*/}
                    {/*            variant="outlined"*/}
                    {/*            margin="dense"*/}
                    {/*            id="mailGpgOwnKeyTitle"*/}
                    {/*            label={t("TITLE")}*/}
                    {/*            name="mailGpgOwnKeyTitle"*/}
                    {/*            autoComplete="mailGpgOwnKeyTitle"*/}
                    {/*            value={mailGpgOwnKeyTitle}*/}
                    {/*            required*/}
                    {/*            onChange={(event) => {*/}
                    {/*                setMailGpgOwnKeyTitle(event.target.value);*/}
                    {/*            }}*/}
                    {/*        />*/}
                    {/*    </Grid>*/}
                    {/*)}*/}
                    {/*{type === "mail_gpg_own_key" && (*/}
                    {/*    <Grid item xs={12} sm={12} md={12}>*/}
                    {/*        <TextField*/}
                    {/*            className={classes.textField}*/}
                    {/*            variant="outlined"*/}
                    {/*            margin="dense"*/}
                    {/*            id="mailGpgOwnKeyEmail"*/}
                    {/*            label={t("TITLE")}*/}
                    {/*            name="mailGpgOwnKeyEmail"*/}
                    {/*            autoComplete="mailGpgOwnKeyEmail"*/}
                    {/*            value={mailGpgOwnKeyEmail}*/}
                    {/*            required*/}
                    {/*            onChange={(event) => {*/}
                    {/*                setMailGpgOwnKeyEmail(event.target.value);*/}
                    {/*            }}*/}
                    {/*            disabled*/}
                    {/*        />*/}
                    {/*    </Grid>*/}
                    {/*)}*/}
                    {/*{type === "mail_gpg_own_key" && (*/}
                    {/*    <Grid item xs={12} sm={12} md={12}>*/}
                    {/*        <TextField*/}
                    {/*            className={classes.textField}*/}
                    {/*            variant="outlined"*/}
                    {/*            margin="dense"*/}
                    {/*            id="mailGpgOwnKeyName"*/}
                    {/*            label={t("TITLE")}*/}
                    {/*            name="mailGpgOwnKeyName"*/}
                    {/*            autoComplete="mailGpgOwnKeyName"*/}
                    {/*            value={mailGpgOwnKeyName}*/}
                    {/*            required*/}
                    {/*            onChange={(event) => {*/}
                    {/*                setMailGpgOwnKeyName(event.target.value);*/}
                    {/*            }}*/}
                    {/*            disabled*/}
                    {/*        />*/}
                    {/*    </Grid>*/}
                    {/*)}*/}
                    {/*{type === "mail_gpg_own_key" && (*/}
                    {/*    <Grid item xs={12} sm={12} md={12}>*/}
                    {/*        <TextField*/}
                    {/*            className={classes.textField}*/}
                    {/*            variant="outlined"*/}
                    {/*            margin="dense"*/}
                    {/*            id="mailGpgOwnKeyPublic"*/}
                    {/*            label={t("TITLE")}*/}
                    {/*            name="mailGpgOwnKeyPublic"*/}
                    {/*            autoComplete="mailGpgOwnKeyPublic"*/}
                    {/*            value={mailGpgOwnKeyPublic}*/}
                    {/*            required*/}
                    {/*            onChange={(event) => {*/}
                    {/*                setMailGpgOwnKeyPublic(event.target.value);*/}
                    {/*            }}*/}
                    {/*            disabled*/}
                    {/*            multiline*/}
                    {/*            minRows={3}*/}
                    {/*            maxRows={15}*/}
                    {/*        />*/}
                    {/*    </Grid>*/}
                    {/*)}*/}
                    {/*{type === "mail_gpg_own_key" && (*/}
                    {/*    <Grid item xs={12} sm={12} md={12}>*/}
                    {/*        <Button*/}
                    {/*            onClick={() => {*/}
                    {/*                setEncryptMessageDialogOpen(true);*/}
                    {/*            }}*/}
                    {/*        >*/}
                    {/*            {t("ENCRYPT_MESSAGE")}*/}
                    {/*        </Button>*/}
                    {/*        <Button onClick={() => setDecryptMessageDialogOpen(true)}>{t("DECRYPT_MESSAGE")}</Button>*/}
                    {/*    </Grid>*/}
                    {/*)}*/}

                    <Grid item xs={12} sm={12} md={12} className={classes.right}>
                        <Button aria-label="settings" onClick={() => setShowAdvanced(!showAdvanced)}>
                            {t("ADVANCED")}
                        </Button>
                    </Grid>

                    {type === "website_password" && showAdvanced && (
                        <Grid item xs={12} sm={12} md={12}>
                            <Checkbox
                                checked={websitePasswordAutoSubmit}
                                onChange={(event) => {
                                    setWebsitePasswordAutoSubmit(event.target.checked);
                                }}
                                checkedIcon={<Check className={classes.checkedIcon} />}
                                icon={<Check className={classes.uncheckedIcon} />}
                                classes={{
                                    checked: classes.checked,
                                }}
                            />{" "}
                            {t("AUTOMATIC_SUBMIT")}
                        </Grid>
                    )}
                    {type === "website_password" && showAdvanced && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="websitePasswordUrlFilter"
                                label={t("DOMAIN_FILTER")}
                                helperText={t("URL_FILTER_EG")}
                                name="websitePasswordUrlFilter"
                                autoComplete="websitePasswordUrlFilter"
                                value={websitePasswordUrlFilter}
                                onChange={(event) => {
                                    setWebsitePasswordUrlFilter(event.target.value);
                                }}
                            />
                        </Grid>
                    )}

                    {type === "bookmark" && showAdvanced && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="bookmarkUrlFilter"
                                label={t("DOMAIN_FILTER")}
                                helperText={t("URL_FILTER_EG")}
                                name="bookmarkUrlFilter"
                                autoComplete="bookmarkUrlFilter"
                                value={bookmarkUrlFilter}
                                onChange={(event) => {
                                    setBookmarkUrlFilter(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {hasCallback && showAdvanced && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="callbackUrl"
                                label={t("CALLBACK_URL")}
                                helperText={t("CALLBACK_URL_PLACEHOLDER")}
                                name="callbackUrl"
                                autoComplete="callbackUrl"
                                value={callbackUrl}
                                onChange={(event) => {
                                    setCallbackUrl(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {hasCallback && showAdvanced && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="callbackUser"
                                label={t("CALLBACK_USER")}
                                name="callbackUser"
                                autoComplete="callbackUser"
                                value={callbackUser}
                                onChange={(event) => {
                                    setCallbackUser(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {hasCallback && showAdvanced && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="callbackPass"
                                label={t("CALLBACK_PASS")}
                                name="callbackPass"
                                autoComplete="callbackPass"
                                value={callbackPass}
                                onChange={(event) => {
                                    setCallbackPass(event.target.value);
                                }}
                                InputProps={{
                                    type: showPassword ? "text" : "password",
                                    classes: {
                                        input: classes.passwordField,
                                    },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton aria-label="toggle password visibility" onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <Visibility /> : <VisibilityOff />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        onClose();
                    }}
                >
                    {t("CLOSE")}
                </Button>
                {!offline && props.onCreate && (
                    <Button onClick={onCreate} variant="contained" color="primary" disabled={!canSave}>
                        {t("SAVE")}
                    </Button>
                )}
            </DialogActions>
            {decryptMessageDialogOpen && <DialogDecryptGpgMessage open={decryptMessageDialogOpen} onClose={() => setDecryptMessageDialogOpen(false)} />}
            {encryptMessageDialogOpen && (
                <DialogEncryptGpgMessage open={encryptMessageDialogOpen} onClose={() => setEncryptMessageDialogOpen(false)} secretId={encryptSecretId} />
            )}
            {importAsTextDialogOpen && <DialogImportAsText open={importAsTextDialogOpen} onClose={() => setImportAsTextDialogOpen(false)} />}
            {generateNewGpgKeyDialogOpen && (
                <DialogGenerateNewGpgKey open={generateNewGpgKeyDialogOpen} onClose={() => setGenerateNewGpgKeyDialogOpen(false)} />
            )}
        </Dialog>
    );
};

DialogNewEntry.propTypes = {
    onClose: PropTypes.func.isRequired,
    onCreate: PropTypes.func,
    open: PropTypes.bool.isRequired,
};

export default DialogNewEntry;
