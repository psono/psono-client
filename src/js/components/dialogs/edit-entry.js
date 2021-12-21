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

import itemBlueprintService from "../../services/item-blueprint";
import secretService from "../../services/secret";
import helperService from "../../services/helper";
import offlineCache from "../../services/offline-cache";
import ContentCopy from "../icons/ContentCopy";
import datastorePasswordService from "../../services/datastore-password";
import browserClientService from "../../services/browser-client";
import TotpCircle from "../totp-circle";
import DialogDecryptGpgMessage from "./decrypt-gpg-message";

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

const DialogEditEntry = (props) => {
    const { open, onClose, item } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const offline = offlineCache.isActive();

    const [decryptMessageDialogOpen, setDecryptMessageDialogOpen] = useState(false);

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

    const [anchorEl, setAnchorEl] = React.useState(null);

    const [callbackUrl, setCallbackUrl] = useState("");
    const [callbackPass, setCallbackPass] = useState("");
    const [callbackUser, setCallbackUser] = useState("");

    const [createDate, setCreateDate] = useState(new Date());
    const [writeDate, setWriteDate] = useState(new Date());

    const [showPassword, setShowPassword] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const itemBlueprint = itemBlueprintService.getEntryTypes().find((entryType) => entryType.value === item.type);
    const hasHistory = ["file"].indexOf(item.type) === -1; // only files have no history
    const hasCallback = ["file"].indexOf(item.type) === -1; // only files have no callbacks

    const isValidWebsitePassword = Boolean(websitePasswordTitle);
    const isValidApplicationPassword = Boolean(applicationPasswordTitle);
    const isValidBookmark = Boolean(bookmarkTitle);
    const isValidNote = Boolean(noteTitle);
    const isValidTotp = Boolean(totpTitle) && Boolean(totpCode);
    const isValidEnvironmentVariables = Boolean(environmentVariablesTitle);
    const isValidFile = Boolean(fileTitle);
    const canSave =
        (item.type === "website_password" && isValidWebsitePassword) ||
        (item.type === "application_password" && isValidApplicationPassword) ||
        (item.type === "bookmark" && isValidBookmark) ||
        (item.type === "note" && isValidNote) ||
        (item.type === "totp" && isValidTotp) ||
        (item.type === "environment_variables" && isValidEnvironmentVariables) ||
        (item.type === "file" && isValidFile);

    React.useEffect(() => {
        const onError = function (result) {
            console.log(result);
            // pass
        };

        const onSuccess = function (data) {
            // general infos
            if (data.hasOwnProperty("create_date")) {
                setCreateDate(new Date(data["create_date"]));
            }
            if (data.hasOwnProperty("write_date")) {
                setWriteDate(new Date(data["write_date"]));
            }

            // callback infos
            if (data.hasOwnProperty("callback_pass")) {
                setCallbackPass(data["callback_pass"]);
            }
            if (data.hasOwnProperty("callback_url")) {
                setCallbackUrl(data["callback_url"]);
            }
            if (data.hasOwnProperty("callback_user")) {
                setCallbackUser(data["callback_user"]);
            }

            // website passwords
            if (data.hasOwnProperty("website_password_title")) {
                setWebsitePasswordTitle(data["website_password_title"]);
            }
            if (data.hasOwnProperty("website_password_url")) {
                setWebsitePasswordUrl(data["website_password_url"]);
            }
            if (data.hasOwnProperty("website_password_username")) {
                setWebsitePasswordUsername(data["website_password_username"]);
            }
            if (data.hasOwnProperty("website_password_password")) {
                setWebsitePasswordPassword(data["website_password_password"]);
            }
            if (data.hasOwnProperty("website_password_notes")) {
                setWebsitePasswordNotes(data["website_password_notes"]);
            }
            if (data.hasOwnProperty("website_password_auto_submit")) {
                setWebsitePasswordAutoSubmit(data["website_password_auto_submit"]);
            }
            if (data.hasOwnProperty("website_password_url_filter")) {
                setWebsitePasswordUrlFilter(data["website_password_url_filter"]);
            }

            // application passwords
            if (data.hasOwnProperty("application_password_title")) {
                setApplicationPasswordTitle(data["application_password_title"]);
            }
            if (data.hasOwnProperty("application_password_username")) {
                setApplicationPasswordUsername(data["application_password_username"]);
            }
            if (data.hasOwnProperty("application_password_password")) {
                setApplicationPasswordPassword(data["application_password_password"]);
            }
            if (data.hasOwnProperty("application_password_notes")) {
                setApplicationPasswordNotes(data["application_password_notes"]);
            }

            // bookmarks
            if (data.hasOwnProperty("bookmark_title")) {
                setBookmarkTitle(data["bookmark_title"]);
            }
            if (data.hasOwnProperty("bookmark_url")) {
                setBookmarkUrl(data["bookmark_url"]);
            }
            if (data.hasOwnProperty("bookmark_notes")) {
                setBookmarkNotes(data["bookmark_notes"]);
            }
            if (data.hasOwnProperty("bookmark_url_filter")) {
                setBookmarkUrlFilter(data["bookmark_url_filter"]);
            }

            // notes
            if (data.hasOwnProperty("note_title")) {
                setNoteTitle(data["note_title"]);
            }
            if (data.hasOwnProperty("note_notes")) {
                setNoteNotes(data["note_notes"]);
            }

            // totp
            if (data.hasOwnProperty("totp_title")) {
                setTotpTitle(data["totp_title"]);
            }
            if (data.hasOwnProperty("totp_period")) {
                setTotpPeriod(data["totp_period"]);
            }
            if (data.hasOwnProperty("totp_algorithm")) {
                setTotpAlgorithm(data["totp_algorithm"]);
            }
            if (data.hasOwnProperty("totp_digits")) {
                setTotpDigits(data["totp_digits"]);
            }
            if (data.hasOwnProperty("totp_code")) {
                setTotpCode(data["totp_code"]);
            }
            if (data.hasOwnProperty("totp_notes")) {
                setTotpNotes(data["totp_notes"]);
            }

            // environment variables
            if (data.hasOwnProperty("environment_variables_title")) {
                setEnvironmentVariablesTitle(data["environment_variables_title"]);
            }
            if (data.hasOwnProperty("environment_variables_variables")) {
                setEnvironmentVariablesVariables(data["environment_variables_variables"]);
            }
            if (data.hasOwnProperty("environment_variables_notes")) {
                setEnvironmentVariablesNotes(data["environment_variables_notes"]);
            }

            // file
            if (data.hasOwnProperty("file_title")) {
                setFileTitle(data["file_title"]);
            }

            // mail_gpg_own_key
            if (data.hasOwnProperty("mail_gpg_own_key_title")) {
                setMailGpgOwnKeyTitle(data["mail_gpg_own_key_title"]);
            }
            if (data.hasOwnProperty("mail_gpg_own_key_email")) {
                setMailGpgOwnKeyEmail(data["mail_gpg_own_key_email"]);
            }
            if (data.hasOwnProperty("mail_gpg_own_key_name")) {
                setMailGpgOwnKeyName(data["mail_gpg_own_key_name"]);
            }
            if (data.hasOwnProperty("mail_gpg_own_key_public")) {
                setMailGpgOwnKeyPublic(data["mail_gpg_own_key_public"]);
            }

            console.log(data);

            // function onSave(new_content) {
            //     // update visual representation
            //     const secret_object = {};
            //     for (let i = new_content.fields.length - 1; i >= 0; i--) {
            //         if (!new_content.fields[i].hasOwnProperty("value")) {
            //             continue;
            //         }
            //         if (new_content.title_field === new_content.fields[i].name) {
            //             node.name = new_content.fields[i].value;
            //         }
            //         if (new_content.hasOwnProperty("urlfilter_field") && new_content.urlfilter_field === new_content.fields[i].name) {
            //             node.urlfilter = new_content.fields[i].value;
            //         }
            //         if (new_content.hasOwnProperty("autosubmit_field") && new_content.autosubmit_field === new_content.fields[i].name) {
            //             node.autosubmit = new_content.fields[i].value;
            //         }
            //         secret_object[new_content.fields[i].name] = new_content.fields[i].value;
            //     }
            //
            //     const onError = function (result) {
            //         // pass
            //     };
            //
            //     const onSuccess = function (e) {
            //         let onSuccess, onError;
            //
            //         const closest_share_info = shareService.getClosestParentShare(path.slice(), datastore, datastore, 0);
            //
            //         const closest_share = closest_share_info["closest_share"];
            //
            //         if (closest_share.hasOwnProperty("share_id")) {
            //             // refresh share content before updating the share
            //             onSuccess = function (content) {
            //                 const search = datastorePasswordService.findInDatastore(closest_share_info["relative_path"], content.data);
            //                 node = search[0][search[1]];
            //
            //                 for (let i = new_content.fields.length - 1; i >= 0; i--) {
            //                     if (!new_content.fields[i].hasOwnProperty("value")) {
            //                         continue;
            //                     }
            //                     if (new_content.title_field === new_content.fields[i].name) {
            //                         node.name = new_content.fields[i].value;
            //                     }
            //                     if (new_content.hasOwnProperty("urlfilter_field") && new_content.urlfilter_field === new_content.fields[i].name) {
            //                         node.urlfilter = new_content.fields[i].value;
            //                     }
            //                     if (new_content.hasOwnProperty("autosubmit_field") && new_content.autosubmit_field === new_content.fields[i].name) {
            //                         node.autosubmit = new_content.fields[i].value;
            //                     }
            //                 }
            //
            //                 shareService.writeShare(closest_share["share_id"], content.data, closest_share["share_secret_key"]);
            //                 manager.handleDatastoreContentChanged(datastore);
            //             };
            //
            //             onError = function (e) {
            //                 // pass
            //             };
            //             shareService.readShare(closest_share["share_id"], closest_share["share_secret_key"]).then(onSuccess, onError);
            //         } else {
            //             // refresh datastore content before updating it
            //             onError = function (result) {
            //                 // pass
            //             };
            //
            //             onSuccess = function (datastore) {
            //                 const search = datastorePasswordService.findInDatastore(closest_share_info["relative_path"], datastore);
            //                 const node = search[0][search[1]];
            //
            //                 for (let i = new_content.fields.length - 1; i >= 0; i--) {
            //                     if (!new_content.fields[i].hasOwnProperty("value")) {
            //                         continue;
            //                     }
            //                     if (new_content.title_field === new_content.fields[i].name) {
            //                         node.name = new_content.fields[i].value;
            //                     }
            //                     if (new_content.hasOwnProperty("urlfilter_field") && new_content.urlfilter_field === new_content.fields[i].name) {
            //                         node.urlfilter = new_content.fields[i].value;
            //                     }
            //                     if (new_content.hasOwnProperty("autosubmit_field") && new_content.autosubmit_field === new_content.fields[i].name) {
            //                         node.autosubmit = new_content.fields[i].value;
            //                     }
            //                 }
            //
            //                 datastorePasswordService.saveDatastoreContent(datastore, [path]);
            //                 manager.handleDatastoreContentChanged(datastore);
            //             };
            //
            //             return manager.getDatastoreWithId(closest_share["datastore_id"]).then(onSuccess, onError);
            //         }
            //
            //         //datastorePasswordService.saveDatastoreContent(datastore, [path]);
            //     };
            //
            //     const bp = itemBlueprint.get_blueprint(node.type);
            //
            //     if (bp.hasOwnProperty("preUpdate")) {
            //         bp.preUpdate(node, secret_object).then(onSuccess, onError);
            //     } else {
            //         secretService
            //             .writeSecret(
            //                 node.secret_id,
            //                 node.secret_key,
            //                 secret_object,
            //                 new_content["callback_data"]["callback_url"],
            //                 new_content["callback_data"]["callback_user"],
            //                 new_content["callback_data"]["callback_pass"]
            //             )
            //             .then(onSuccess, onError);
            //     }
            // }

            // if (window.innerWidth > 1199) {
            //     $rootScope.$broadcast("show-entry-big", {
            //         node: node,
            //         path: path,
            //         data: data,
            //         onClose: function () {},
            //         onSave: onSave,
            //     });
            // } else {
            //     const modalInstance = $uibModal.open({
            //         templateUrl: "view/modal/edit-entry.html",
            //         controller: "ModalEditEntryCtrl",
            //         backdrop: "static",
            //         size: size,
            //         resolve: {
            //             node: function () {
            //                 return node;
            //             },
            //             path: function () {
            //                 return path;
            //             },
            //             data: function () {
            //                 return data;
            //             },
            //         },
            //     });
            //
            //     modalInstance.result.then(onSave, function () {
            //         // cancel triggered
            //     });
            // }
        };

        if (typeof item.secret_id === "undefined") {
            if (item.hasOwnProperty("type")) {
                if (item.type === "file") {
                    const secret = helperService.duplicateObject(item);
                    secret["file_title"] = item.name;
                    onSuccess(secret);
                    return;
                }
            }
            onSuccess(item);
        } else {
            secretService.readSecret(item.secret_id, item.secret_key).then(onSuccess, onError);
        }
    }, []);

    const onSave = (event) => {
        console.log(event);
        // TODO
    };

    const showHistory = (event) => {
        console.log(event);
        // TODO
    };

    const onShowHidePassword = (event) => {
        handleClose();
        setShowPassword(!showPassword);
    };

    const onCopyPassword = (event) => {
        handleClose();
        if (item.type === "website_password") {
            browserClientService.copyToClipboard(websitePasswordPassword);
        }
        if (item.type === "application_password") {
            browserClientService.copyToClipboard(applicationPasswordPassword);
        }
    };
    const onGeneratePassword = (event) => {
        handleClose();
        const password = datastorePasswordService.generate();
        if (item.type === "website_password") {
            setWebsitePasswordPassword(password);
        }
        if (item.type === "application_password") {
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
            <DialogTitle id="alert-dialog-title">{t(itemBlueprint.edit_title)}</DialogTitle>
            <DialogContent>
                <Grid container>
                    {item.type === "website_password" && (
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
                    {item.type === "website_password" && (
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
                    {item.type === "website_password" && (
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
                    {item.type === "website_password" && (
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
                    {item.type === "website_password" && (
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

                    {item.type === "application_password" && (
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
                    {item.type === "application_password" && (
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
                    {item.type === "application_password" && (
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
                    {item.type === "application_password" && (
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

                    {item.type === "bookmark" && (
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
                    {item.type === "bookmark" && (
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
                    {item.type === "bookmark" && (
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

                    {item.type === "note" && (
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
                    {item.type === "note" && (
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

                    {item.type === "totp" && (
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

                    {item.type === "totp" && (
                        <Grid item xs={12} sm={12} md={12} className={classes.totpCircleGridItem}>
                            <TotpCircle period={totpPeriod} algorithm={totpAlgorithm} digits={totpDigits} code={totpCode} className={classes.totpCircle} />
                        </Grid>
                    )}
                    {item.type === "totp" && (
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

                    {item.type === "environment_variables" && (
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

                    {item.type === "environment_variables" && (
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
                                                id={"environmentVariablesVariables-key-" + index}
                                                label={t("VALUE")}
                                                name={"environmentVariablesVariables-key-" + index}
                                                autoComplete={"environmentVariablesVariables-key-" + index}
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
                    {item.type === "environment_variables" && (
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
                    {item.type === "environment_variables" && (
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

                    {item.type === "file" && (
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

                    {item.type === "mail_gpg_own_key" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="mailGpgOwnKeyTitle"
                                label={t("TITLE")}
                                name="mailGpgOwnKeyTitle"
                                autoComplete="mailGpgOwnKeyTitle"
                                value={mailGpgOwnKeyTitle}
                                required
                                onChange={(event) => {
                                    setMailGpgOwnKeyTitle(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {item.type === "mail_gpg_own_key" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="mailGpgOwnKeyEmail"
                                label={t("TITLE")}
                                name="mailGpgOwnKeyEmail"
                                autoComplete="mailGpgOwnKeyEmail"
                                value={mailGpgOwnKeyEmail}
                                required
                                onChange={(event) => {
                                    setMailGpgOwnKeyEmail(event.target.value);
                                }}
                                disabled
                            />
                        </Grid>
                    )}
                    {item.type === "mail_gpg_own_key" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="mailGpgOwnKeyName"
                                label={t("TITLE")}
                                name="mailGpgOwnKeyName"
                                autoComplete="mailGpgOwnKeyName"
                                value={mailGpgOwnKeyName}
                                required
                                onChange={(event) => {
                                    setMailGpgOwnKeyName(event.target.value);
                                }}
                                disabled
                            />
                        </Grid>
                    )}
                    {item.type === "mail_gpg_own_key" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="mailGpgOwnKeyPublic"
                                label={t("TITLE")}
                                name="mailGpgOwnKeyPublic"
                                autoComplete="mailGpgOwnKeyPublic"
                                value={mailGpgOwnKeyPublic}
                                required
                                onChange={(event) => {
                                    setMailGpgOwnKeyPublic(event.target.value);
                                }}
                                disabled
                                multiline
                                minRows={3}
                                maxRows={15}
                            />
                        </Grid>
                    )}
                    {item.type === "mail_gpg_own_key" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <Button
                                onClick={() => {
                                    // TODO
                                    //setEncryptMessageDialogOpen(true);
                                }}
                            >
                                {t("ENCRYPT_MESSAGE")}
                            </Button>
                            <Button
                                onClick={() => {
                                    setDecryptMessageDialogOpen(true);
                                }}
                            >
                                {t("DECRYPT_MESSAGE")}
                            </Button>
                        </Grid>
                    )}

                    <Grid item xs={12} sm={12} md={12} className={classes.right}>
                        <Button aria-label="settings" onClick={() => setShowAdvanced(!showAdvanced)}>
                            {t("ADVANCED")}
                        </Button>
                        {hasHistory && !offline && (
                            <Button aria-label="settings" onClick={showHistory}>
                                {t("SHOW_HISTORY")}
                            </Button>
                        )}
                    </Grid>

                    {item.type === "website_password" && showAdvanced && (
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
                    {item.type === "website_password" && showAdvanced && (
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
                    {item.type === "bookmark" && showAdvanced && (
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

                    {showAdvanced && (
                        <Grid item xs={12} sm={12} md={12}>
                            {t("ENTRY_LINK")}: <a href={"index.html#!/datastore/search/" + item.id}>{item.id}</a>
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
                {item.share_rights.write && !offline && (
                    <Button onClick={onSave} variant="contained" color="primary" disabled={!canSave}>
                        {t("SAVE")}
                    </Button>
                )}
            </DialogActions>
            {decryptMessageDialogOpen && <DialogDecryptGpgMessage open={decryptMessageDialogOpen} onClose={() => setDecryptMessageDialogOpen(false)} />}
        </Dialog>
    );
};

DialogEditEntry.propTypes = {
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    item: PropTypes.object.isRequired,
};

export default DialogEditEntry;
