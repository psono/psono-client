import React, {useState} from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import Dialog from "@mui/material/Dialog";
import MuiAlert from '@mui/material/Alert'
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import { Checkbox, Grid } from "@mui/material";
import { Check } from "@mui/icons-material";
import TextField from "@mui/material/TextField";
import CustomField from "../text-field/custom-field";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Typography from "@mui/material/Typography";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PhonelinkSetupIcon from "@mui/icons-material/PhonelinkSetup";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LinkIcon from "@mui/icons-material/Link";
import EditIcon from "@mui/icons-material/Edit";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import LinearProgress from "@mui/material/LinearProgress";
import { useHotkeys } from 'react-hotkeys-hook'
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";

import itemBlueprintService from "../../services/item-blueprint";
import secretService from "../../services/secret";
import helperService from "../../services/helper";
import offlineCache from "../../services/offline-cache";
import ContentCopy from "../icons/ContentCopy";
import browserClientService from "../../services/browser-client";
import TotpCircle from "../totp-circle";
import DialogDecryptGpgMessage from "./decrypt-gpg-message";
import DialogEncryptGpgMessage from "./encrypt-gpg-message";
import DialogHistory from "./history";
import notification from "../../services/notification";
import cryptoLibrary from "../../services/crypto-library";
import { getStore } from "../../services/store";
import TextFieldCreditCardNumber from "../text-field/credit-card-number";
import TextFieldCreditCardValidThrough from "../text-field/credit-card-valid-through";
import TextFieldCreditCardCVC from "../text-field/credit-card-cvc";
import TextFieldTotp from "../text-field/totp";
import converterService from "../../services/converter";
import DialogCreateLinkShare from "./create-link-share";
import DialogAddTotp from "./add-totp";
import DialogAddCustomField from "./add-custom-field";
import DialogAddTag from "./add-tag";
import DialogEditCustomField from "./edit-custom-field";
import DialogGeneratePassword from "./generate-password";
import TextFieldColored from "../text-field/colored";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        padding: "15px",
    },
    toolbarRoot: {
        backgroundColor: theme.palette.baseTitleBackground.main,
        display: "flex",
    },
    inlineEditPaper: {
        position: 'sticky',
        top: '8px',
        marginBottom: '30px',
    },
    textField: {
        width: "100%",
    },
    textField5: {
        width: "100%",
        marginRight: theme.spacing(2),
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
    divider: {
        marginTop: "8px",
        marginBottom: "8px",
    },
    chipContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: theme.spacing(1),
        marginTop: theme.spacing(1),
    },
}));

const DialogEditEntry = (props) => {
    const { open, onClose, item, hideLinkToEntry, hideShowHistory, hideMoreMenu, linkDirectly, hideAddTOTP, hideAddCustomField, hideAddTag, inline, setDirty } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const offline = offlineCache.isActive();

    const [createLinkShareOpen, setCreateLinkShareOpen] = useState(false);
    const [tags, setTags] = useState([]);
    const [triggerAutoSave, setTriggerAutoSave] = useState(0);
    const [addTotpOpen, setAddTotpOpen] = useState(false);
    const [addTagOpen, setAddTagOpen] = useState(false);
    const [addCustomFieldOpen, setAddCustomFieldOpen] = useState(false);
    const [editCustomFieldOpenIndex, setEditCustomFieldOpenIndex] = useState(null);
    const [generatePasswordDialogOpen, setGeneratePasswordDialogOpen] = useState(false);

    const [decryptMessageDialogOpen, setDecryptMessageDialogOpen] = useState(false);
    const [encryptMessageDialogOpen, setEncryptMessageDialogOpen] = useState(false);
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [encryptSecretId, setEncryptSecretId] = useState("");

    const [originalFullData, setOriginalFullData] = useState({});
    const [websitePasswordTitle, setWebsitePasswordTitle] = useState("");
    const [websitePasswordUrl, setWebsitePasswordUrl] = useState("");
    const [websitePasswordUsername, setWebsitePasswordUsername] = useState("");
    const [websitePasswordPassword, setWebsitePasswordPassword] = useState("");
    const [websitePasswordNotes, setWebsitePasswordNotes] = useState("");
    const [websitePasswordAutoSubmit, setWebsitePasswordAutoSubmit] = useState(false);
    const [websitePasswordAllowHttp, setWebsitePasswordAllowHttp] = useState(false);
    const [websitePasswordUrlFilter, setWebsitePasswordUrlFilter] = useState("");
    const [websitePasswordTotpPeriod, setWebsitePasswordTotpPeriod] = useState(30);
    const [websitePasswordTotpAlgorithm, setWebsitePasswordTotpAlgorithm] = useState("SHA1");
    const [websitePasswordTotpDigits, setWebsitePasswordTotpDigits] = useState(6);
    const [websitePasswordTotpCode, setWebsitePasswordTotpCode] = useState("");

    const [passkeyTitle, setPasskeyTitle] = useState("");
    const [passkeyRpId, setPasskeyRpId] = useState("");
    const [passkeyId, setPasskeyId] = useState("");
    const [passkeyPublicKey, setPasskeyPublicKey] = useState("");
    const [passkeyPrivateKey, setPasskeyPrivateKey] = useState("");
    const [passkeyUserHandle, setPasskeyUserHandle] = useState("");
    const [passkeyAlgorithm, setPasskeyAlgorithm] = useState(null);
    const [passkeyAutoSubmit, setPasskeyAutoSubmit] = useState(false);
    const [passkeyUrlFilter, setPasskeyUrlFilter] = useState("");

    const [applicationPasswordTitle, setApplicationPasswordTitle] = useState("");
    const [applicationPasswordUsername, setApplicationPasswordUsername] = useState("");
    const [applicationPasswordPassword, setApplicationPasswordPassword] = useState("");
    const [applicationPasswordNotes, setApplicationPasswordNotes] = useState("");

    const [bookmarkTitle, setBookmarkTitle] = useState("");
    const [bookmarkUrl, setBookmarkUrl] = useState("");
    const [bookmarkNotes, setBookmarkNotes] = useState("");
    const [bookmarkUrlFilter, setBookmarkUrlFilter] = useState("");

    const [identityTitle, setIdentityTitle] = useState("");
    const [identityFirstName, setIdentityFirstName] = useState("");
    const [identityLastName, setIdentityLastName] = useState("");
    const [identityCompany, setIdentityCompany] = useState("");
    const [identityAddress, setIdentityAddress] = useState("");
    const [identityPostalCode, setIdentityPostalCode] = useState("");
    const [identityCity, setIdentityCity] = useState("");
    const [identityState, setIdentityState] = useState("");
    const [identityCountry, setIdentityCountry] = useState("");
    const [identityPhoneNumber, setIdentityPhoneNumber] = useState("");
    const [identityEmail, setIdentityEmail] = useState("");
    const [identityNotes, setIdentityNotes] = useState("");

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

    const [elsterCertificateTitle, setElsterCertificateTitle] = useState("");
    const [elsterCertificateFileContent, setElsterCertificateFileContent] = useState(null);
    const [elsterCertificateFileName, setElsterCertificateFileName] = useState(null);
    const [elsterCertificatePassword, setElsterCertificatePassword] = useState("");
    const [elsterCertificateRetrievalCode, setElsterCertificateRetrievalCode] = useState("");
    const [elsterCertificateNotes, setElsterCertificateNotes] = useState("");

    const [sshOwnKeyTitle, setSshOwnKeyTitle] = useState("");
    const [sshOwnKeyPublic, setSshOwnKeyPublic] = useState("");
    const [sshOwnKeyPrivate, setSshOwnKeyPrivate] = useState("");
    const [sshOwnKeyNotes, setSshOwnKeyNotes] = useState("");

    const [creditCardTitle, setCreditCardTitle] = useState("");
    const [creditCardNumber, setCreditCardNumber] = useState("");
    const [creditCardCVC, setCreditCardCVC] = useState("");
    const [creditCardPIN, setCreditCardPIN] = useState("");
    const [creditCardName, setCreditCardName] = useState("");
    const [creditCardValidThrough, setCreditCardValidThrough] = useState("");
    const [creditCardNotes, setCreditCardNotes] = useState("");

    const [mailGpgOwnKeyTitle, setMailGpgOwnKeyTitle] = useState("");
    const [mailGpgOwnKeyEmail, setMailGpgOwnKeyEmail] = useState("");
    const [mailGpgOwnKeyName, setMailGpgOwnKeyName] = useState("");
    const [mailGpgOwnKeyPublic, setMailGpgOwnKeyPublic] = useState("");
    const [mailGpgOwnKeyPrivate, setMailGpgOwnKeyPrivate] = useState("");

    const [anchorEl, setAnchorEl] = React.useState(null);
    const [anchorEl2, setAnchorEl2] = React.useState(null);
    const [anchorEl3, setAnchorEl3] = React.useState(null);
    const [anchorElMoreMenu, setAnchorElMoreMenu] = React.useState(null);
    const [anchorEls, setAnchorEls] = React.useState({});
    const [anchorElsCustomFields, setAnchorElsCustomFields] = React.useState({});
    const [showPasswords, setShowPasswords] = React.useState({});

    const [callbackUrl, setCallbackUrl] = useState("");
    const [callbackPass, setCallbackPass] = useState("");
    const [callbackUser, setCallbackUser] = useState("");
    const [customFields, setCustomFields] = useState([]);

    const [createDate, setCreateDate] = useState(new Date());
    const [writeDate, setWriteDate] = useState(new Date());

    const [showPin, setShowPin] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const itemBlueprint = itemBlueprintService.getEntryTypes().find((entryType) => entryType.value === item.type);
    const hasHistory = !hideShowHistory && ["file"].indexOf(item.type) === -1; // only files have no history
    const hasCallback = ["file"].indexOf(item.type) === -1 &&  // files have no callbacks
        !getStore().getState().server.disableCallbacks;
    const showGeneratePassword = item.share_rights && item.share_rights.write;
    const readOnly = getStore().getState().settingsDatastore.noSaveMode || !item.share_rights || !item.share_rights.write;
    const isValidWebsitePassword = Boolean(websitePasswordTitle);
    const isValidPasskey = Boolean(passkeyTitle);
    const isValidApplicationPassword = Boolean(applicationPasswordTitle);
    const isValidBookmark = Boolean(bookmarkTitle) && (!bookmarkUrl || helperService.isValidUrl(bookmarkUrl));
    const isValidIdentity = Boolean(identityTitle);
    const isValidNote = Boolean(noteTitle);
    const isValidTotp = Boolean(totpTitle) && Boolean(totpCode);
    const isValidEnvironmentVariables = Boolean(environmentVariablesTitle);
    const isValidMailGpgOwnKey =
        Boolean(mailGpgOwnKeyTitle) &&
        Boolean(mailGpgOwnKeyEmail) &&
        Boolean(mailGpgOwnKeyName) &&
        Boolean(mailGpgOwnKeyPublic) &&
        Boolean(mailGpgOwnKeyPrivate);
    const isValidSshOwnKey =
        Boolean(sshOwnKeyTitle) &&
        Boolean(sshOwnKeyPublic) &&
        Boolean(sshOwnKeyPrivate);
    const isValidCreditCard =
        Boolean(creditCardTitle) &&
        Boolean(creditCardNumber) &&
        Boolean(creditCardCVC) &&
        Boolean(creditCardName) &&
        Boolean(creditCardValidThrough);
    const isValidFile = Boolean(fileTitle);
    const isValidElsterCertificate =
        Boolean(elsterCertificateTitle) &&
        Boolean(elsterCertificateFileContent) &&
        Boolean(elsterCertificatePassword);
    const canSave =  (item.type === "website_password" && isValidWebsitePassword) ||
        (item.type === "passkey" && isValidPasskey) ||
        (item.type === "application_password" && isValidApplicationPassword) ||
        (item.type === "bookmark" && isValidBookmark) ||
        (item.type === "identity" && isValidIdentity) ||
        (item.type === "note" && isValidNote) ||
        (item.type === "totp" && isValidTotp) ||
        (item.type === "environment_variables" && isValidEnvironmentVariables) ||
        (item.type === "ssh_own_key" && isValidSshOwnKey) ||
        (item.type === "credit_card" && isValidCreditCard) ||
        (item.type === "mail_gpg_own_key" && isValidMailGpgOwnKey) ||
        (item.type === "file" && isValidFile) ||
        (item.type === "elster_certificate" && isValidElsterCertificate)
    
    useHotkeys('alt+b', () => {
        // copy username
        onCopyUsername();
    })

    useHotkeys('alt+c', () => {
        // copy password
        onCopyPassword();
    })

    useHotkeys('alt+u', () => {
        // open url
        secretService.onItemClick(item);
    })

    useHotkeys('alt+shift+u', () => {
        // copy url
        onCopyUrl();
    })

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
            } else {
                setCallbackPass("");
            }
            if (data.hasOwnProperty("callback_url")) {
                setCallbackUrl(data["callback_url"]);
            } else {
                setCallbackUrl("");
            }
            if (data.hasOwnProperty("callback_user")) {
                setCallbackUser(data["callback_user"]);
            } else {
                setCallbackUser("");
            }
            if (data.hasOwnProperty("custom_fields")) {
                setCustomFields(data["custom_fields"]);
            } else {
                setCustomFields([]);
            }
            if (data.hasOwnProperty("tags")) {
                setTags(data["tags"]);
            } else {
                setTags([]);
            }

            // website passwords
            if (data.hasOwnProperty("website_password_title")) {
                setWebsitePasswordTitle(data["website_password_title"]);
            } else {
                setWebsitePasswordTitle("");
            }
            if (data.hasOwnProperty("website_password_url")) {
                setWebsitePasswordUrl(data["website_password_url"]);
            } else {
                setWebsitePasswordUrl("");
            }
            if (data.hasOwnProperty("website_password_username")) {
                setWebsitePasswordUsername(data["website_password_username"]);
            } else {
                setWebsitePasswordUsername("");
            }
            if (data.hasOwnProperty("website_password_password")) {
                setWebsitePasswordPassword(data["website_password_password"]);
            } else {
                setWebsitePasswordPassword("");
            }
            if (data.hasOwnProperty("website_password_totp_period")) {
                setWebsitePasswordTotpPeriod(data["website_password_totp_period"]);
            } else {
                setWebsitePasswordTotpPeriod(30);
            }
            if (data.hasOwnProperty("website_password_totp_algorithm")) {
                setWebsitePasswordTotpAlgorithm(data["website_password_totp_algorithm"]);
            } else {
                setWebsitePasswordTotpAlgorithm("SHA1");
            }
            if (data.hasOwnProperty("website_password_totp_digits")) {
                setWebsitePasswordTotpDigits(data["website_password_totp_digits"]);
            } else {
                setWebsitePasswordTotpDigits(6);
            }
            if (data.hasOwnProperty("website_password_totp_code")) {
                setWebsitePasswordTotpCode(data["website_password_totp_code"]);
            } else {
                setWebsitePasswordTotpCode("");
            }

            if (data.hasOwnProperty("website_password_notes")) {
                setWebsitePasswordNotes(data["website_password_notes"]);
            } else {
                setWebsitePasswordNotes("");
            }
            if (data.hasOwnProperty("website_password_auto_submit")) {
                setWebsitePasswordAutoSubmit(data["website_password_auto_submit"]);
            } else {
                setWebsitePasswordAutoSubmit(false);
            }
            if (data.hasOwnProperty("website_password_allow_http")) {
                setWebsitePasswordAllowHttp(data["website_password_allow_http"]);
            } else {
                setWebsitePasswordAllowHttp(false);
            }
            if (data.hasOwnProperty("website_password_url_filter")) {
                setWebsitePasswordUrlFilter(data["website_password_url_filter"]);
            } else {
                setWebsitePasswordUrlFilter("");
            }

            // passkey
            if (data.hasOwnProperty("passkey_title")) {
                setPasskeyTitle(data["passkey_title"]);
            } else {
                setPasskeyTitle("");
            }
            if (data.hasOwnProperty("passkey_rp_id")) {
                setPasskeyRpId(data["passkey_rp_id"]);
            } else {
                setPasskeyRpId("");
            }
            if (data.hasOwnProperty("passkey_id")) {
                setPasskeyId(data["passkey_id"]);
            } else {
                setPasskeyId("");
            }
            if (data.hasOwnProperty("passkey_public_key")) {
                setPasskeyPublicKey(data["passkey_public_key"]);
            } else {
                setPasskeyPublicKey("");
            }
            if (data.hasOwnProperty("passkey_private_key")) {
                setPasskeyPrivateKey(data["passkey_private_key"]);
            } else {
                setPasskeyPrivateKey("");
            }
            if (data.hasOwnProperty("passkey_user_handle")) {
                setPasskeyUserHandle(data["passkey_user_handle"]);
            } else {
                setPasskeyUserHandle("");
            }
            if (data.hasOwnProperty("passkey_algorithm")) {
                setPasskeyAlgorithm(data["passkey_algorithm"]);
            } else {
                setPasskeyAlgorithm(null);
            }
            if (data.hasOwnProperty("passkey_auto_submit")) {
                setPasskeyAutoSubmit(data["passkey_auto_submit"]);
            } else {
                setPasskeyAutoSubmit(false);
            }
            if (data.hasOwnProperty("passkey_url_filter")) {
                setPasskeyUrlFilter(data["passkey_url_filter"]);
            } else {
                setPasskeyUrlFilter("");
            }

            // application passwords
            if (data.hasOwnProperty("application_password_title")) {
                setApplicationPasswordTitle(data["application_password_title"]);
            } else {
                setApplicationPasswordTitle("");
            }
            if (data.hasOwnProperty("application_password_username")) {
                setApplicationPasswordUsername(data["application_password_username"]);
            } else {
                setApplicationPasswordUsername("");
            }
            if (data.hasOwnProperty("application_password_password")) {
                setApplicationPasswordPassword(data["application_password_password"]);
            } else {
                setApplicationPasswordPassword("");
            }
            if (data.hasOwnProperty("application_password_notes")) {
                setApplicationPasswordNotes(data["application_password_notes"]);
            } else {
                setApplicationPasswordNotes("");
            }

            // bookmarks
            if (data.hasOwnProperty("bookmark_title")) {
                setBookmarkTitle(data["bookmark_title"]);
            } else {
                setBookmarkTitle("");
            }
            if (data.hasOwnProperty("bookmark_url")) {
                setBookmarkUrl(data["bookmark_url"]);
            } else {
                setBookmarkUrl("");
            }
            if (data.hasOwnProperty("bookmark_notes")) {
                setBookmarkNotes(data["bookmark_notes"]);
            } else {
                setBookmarkNotes("");
            }
            if (data.hasOwnProperty("bookmark_url_filter")) {
                setBookmarkUrlFilter(data["bookmark_url_filter"]);
            } else {
                setBookmarkUrlFilter("");
            }

            // identity
            if (data.hasOwnProperty("identity_title")) {
                setIdentityTitle(data["identity_title"]);
            } else {
                setIdentityTitle("");
            }
            if (data.hasOwnProperty("identity_first_name")) {
                setIdentityFirstName(data["identity_first_name"]);
            } else {
                setIdentityFirstName("");
            }
            if (data.hasOwnProperty("identity_last_name")) {
                setIdentityLastName(data["identity_last_name"]);
            } else {
                setIdentityLastName("");
            }
            if (data.hasOwnProperty("identity_company")) {
                setIdentityCompany(data["identity_company"]);
            } else {
                setIdentityCompany("");
            }
            if (data.hasOwnProperty("identity_address")) {
                setIdentityAddress(data["identity_address"]);
            } else {
                setIdentityAddress("");
            }
            if (data.hasOwnProperty("identity_postal_code")) {
                setIdentityPostalCode(data["identity_postal_code"]);
            } else {
                setIdentityPostalCode("");
            }
            if (data.hasOwnProperty("identity_city")) {
                setIdentityCity(data["identity_city"]);
            } else {
                setIdentityCity("");
            }
            if (data.hasOwnProperty("identity_state")) {
                setIdentityState(data["identity_state"]);
            } else {
                setIdentityState("");
            }
            if (data.hasOwnProperty("identity_country")) {
                setIdentityCountry(data["identity_country"]);
            } else {
                setIdentityCountry("");
            }
            if (data.hasOwnProperty("identity_phone_number")) {
                setIdentityPhoneNumber(data["identity_phone_number"]);
            } else {
                setIdentityPhoneNumber("");
            }
            if (data.hasOwnProperty("identity_email")) {
                setIdentityEmail(data["identity_email"]);
            } else {
                setIdentityEmail("");
            }
            if (data.hasOwnProperty("identity_notes")) {
                setIdentityNotes(data["identity_notes"]);
            } else {
                setIdentityNotes("");
            }

            // notes
            if (data.hasOwnProperty("note_title")) {
                setNoteTitle(data["note_title"]);
            } else {
                setNoteTitle("");
            }
            if (data.hasOwnProperty("note_notes")) {
                setNoteNotes(data["note_notes"]);
            } else {
                setNoteNotes("");
            }

            // totp
            if (data.hasOwnProperty("totp_title")) {
                setTotpTitle(data["totp_title"]);
            } else {
                setTotpTitle("");
            }
            if (data.hasOwnProperty("totp_period")) {
                setTotpPeriod(data["totp_period"]);
            } else {
                setTotpPeriod(30);
            }
            if (data.hasOwnProperty("totp_algorithm")) {
                setTotpAlgorithm(data["totp_algorithm"]);
            } else {
                setTotpAlgorithm("SHA1");
            }
            if (data.hasOwnProperty("totp_digits")) {
                setTotpDigits(data["totp_digits"]);
            } else {
                setTotpDigits(6);
            }
            if (data.hasOwnProperty("totp_code")) {
                setTotpCode(data["totp_code"]);
            } else {
                setTotpCode("");
            }
            if (data.hasOwnProperty("totp_notes")) {
                setTotpNotes(data["totp_notes"]);
            } else {
                setTotpNotes("");
            }

            // environment variables
            if (data.hasOwnProperty("environment_variables_title")) {
                setEnvironmentVariablesTitle(data["environment_variables_title"]);
            } else {
                setEnvironmentVariablesTitle("");
            }
            if (data.hasOwnProperty("environment_variables_variables") && data["environment_variables_variables"]) {
                data["environment_variables_variables"].sort((a, b) => (a["key"].toLowerCase() > b["key"].toLowerCase()) ? 1 : -1)
                setEnvironmentVariablesVariables(data["environment_variables_variables"]);
            } else {
                setEnvironmentVariablesVariables([]);
            }
            if (data.hasOwnProperty("environment_variables_notes")) {
                setEnvironmentVariablesNotes(data["environment_variables_notes"]);
            } else {
                setEnvironmentVariablesNotes("");
            }

            // file
            if (data.hasOwnProperty("file_title")) {
                setFileTitle(data["file_title"]);
            } else {
                setFileTitle("");
            }

            // elster_certificate
            if (data.hasOwnProperty("elster_certificate_title")) {
                setElsterCertificateTitle(data["elster_certificate_title"]);
            } else {
                setElsterCertificateTitle("");
            }
            if (data.hasOwnProperty("elster_certificate_file_content")) {
                setElsterCertificateFileContent(data["elster_certificate_file_content"]);
            } else {
                setElsterCertificateFileContent(null);
            }
            setElsterCertificateFileName(null);
            if (data.hasOwnProperty("elster_certificate_password")) {
                setElsterCertificatePassword(data["elster_certificate_password"]);
            } else {
                setElsterCertificatePassword("");
            }
            if (data.hasOwnProperty("elster_certificate_retrieval_code")) {
                setElsterCertificateRetrievalCode(data["elster_certificate_retrieval_code"]);
            } else {
                setElsterCertificateRetrievalCode("");
            }
            if (data.hasOwnProperty("elster_certificate_notes")) {
                setElsterCertificateNotes(data["elster_certificate_notes"]);
            } else {
                setElsterCertificateNotes("");
            }

            // ssh_own_key
            if (data.hasOwnProperty("ssh_own_key_title")) {
                setSshOwnKeyTitle(data["ssh_own_key_title"]);
            } else {
                setSshOwnKeyTitle("");
            }
            if (data.hasOwnProperty("ssh_own_key_public")) {
                setSshOwnKeyPublic(data["ssh_own_key_public"]);
            } else {
                setSshOwnKeyPublic("");
            }
            if (data.hasOwnProperty("ssh_own_key_private")) {
                setSshOwnKeyPrivate(data["ssh_own_key_private"]);
            } else {
                setSshOwnKeyPrivate("");
            }
            if (data.hasOwnProperty("ssh_own_key_notes")) {
                setSshOwnKeyNotes(data["ssh_own_key_notes"]);
            } else {
                setSshOwnKeyNotes("");
            }

            // credit_card
            if (data.hasOwnProperty("credit_card_title")) {
                setCreditCardTitle(data["credit_card_title"]);
            } else {
                setCreditCardTitle("");
            }
            if (data.hasOwnProperty("credit_card_number")) {
                setCreditCardNumber(data["credit_card_number"]);
            } else {
                setCreditCardNumber("");
            }
            if (data.hasOwnProperty("credit_card_cvc")) {
                setCreditCardCVC(data["credit_card_cvc"]);
            } else {
                setCreditCardCVC("");
            }
            if (data.hasOwnProperty("credit_card_pin")) {
                setCreditCardPIN(data["credit_card_pin"]);
            } else {
                setCreditCardPIN("");
            }
            if (data.hasOwnProperty("credit_card_name")) {
                setCreditCardName(data["credit_card_name"]);
            } else {
                setCreditCardName("");
            }
            if (data.hasOwnProperty("credit_card_valid_through")) {
                setCreditCardValidThrough(data["credit_card_valid_through"]);
            } else {
                setCreditCardValidThrough("");
            }
            if (data.hasOwnProperty("credit_card_notes")) {
                setCreditCardNotes(data["credit_card_notes"]);
            } else {
                setCreditCardNotes("");
            }

            // mail_gpg_own_key
            if (data.hasOwnProperty("mail_gpg_own_key_title")) {
                setMailGpgOwnKeyTitle(data["mail_gpg_own_key_title"]);
            } else {
                setMailGpgOwnKeyTitle("");
            }
            if (data.hasOwnProperty("mail_gpg_own_key_email")) {
                setMailGpgOwnKeyEmail(data["mail_gpg_own_key_email"]);
            } else {
                setMailGpgOwnKeyEmail("");
            }
            if (data.hasOwnProperty("mail_gpg_own_key_name")) {
                setMailGpgOwnKeyName(data["mail_gpg_own_key_name"]);
            } else {
                setMailGpgOwnKeyName("");
            }
            if (data.hasOwnProperty("mail_gpg_own_key_public")) {
                setMailGpgOwnKeyPublic(data["mail_gpg_own_key_public"]);
            } else {
                setMailGpgOwnKeyPublic("");
            }
            if (data.hasOwnProperty("mail_gpg_own_key_private")) {
                setMailGpgOwnKeyPrivate(data["mail_gpg_own_key_private"]);
            } else {
                setMailGpgOwnKeyPrivate("");
            }
            setOriginalFullData(data);
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
        } else if (props.data) {
            onSuccess(props.data);
        } else {
            secretService.readSecret(item.secret_id, item.secret_key).then(onSuccess, onError);
        }
    }, [item]);

    React.useEffect(() => {
        if (triggerAutoSave > 0) {
            onEdit(false)
        }
    }, [triggerAutoSave])

    const onEdit = (closeEditView) => {
        let passwordSha1;
        const secretObject = {};

        if (item.type === "website_password") {
            item["name"] = websitePasswordTitle;
            secretObject["website_password_title"] = websitePasswordTitle;
            if (websitePasswordUrl) {
                secretObject["website_password_url"] = websitePasswordUrl;
            }
            if (websitePasswordUsername) {
                secretObject["website_password_username"] = websitePasswordUsername;
                item["description"]  = websitePasswordUsername;
            }
            if (websitePasswordPassword) {
                secretObject["website_password_password"] = websitePasswordPassword;
                passwordSha1 = cryptoLibrary.sha1(websitePasswordPassword);
                item["password_hash"]  = passwordSha1.substring(0, 5).toLowerCase();
            } else {
                item["password_hash"] = ''
            }
            if (websitePasswordTotpPeriod) {
                secretObject["website_password_totp_period"] = websitePasswordTotpPeriod;
            }
            if (websitePasswordTotpAlgorithm) {
                secretObject["website_password_totp_algorithm"] = websitePasswordTotpAlgorithm;
            }
            if (websitePasswordTotpDigits) {
                secretObject["website_password_totp_digits"] = websitePasswordTotpDigits;
            }
            if (websitePasswordTotpCode) {
                secretObject["website_password_totp_code"] = websitePasswordTotpCode;
            }
            if (websitePasswordNotes) {
                secretObject["website_password_notes"] = websitePasswordNotes;
            }
            secretObject["website_password_auto_submit"] = websitePasswordAutoSubmit;
            item["autosubmit"] = websitePasswordAutoSubmit;
            secretObject["website_password_allow_http"] = websitePasswordAllowHttp;
            item["allow_http"] = websitePasswordAllowHttp;
            if (websitePasswordUrlFilter) {
                item["urlfilter"] = websitePasswordUrlFilter;
                secretObject["website_password_url_filter"] = websitePasswordUrlFilter;
            } else {
                delete item["urlfilter"];
            }
        }

        if (item.type === "passkey") {
            item["name"] = passkeyTitle;
            secretObject["passkey_title"] = passkeyTitle;
            if (passkeyRpId) {
                secretObject["passkey_rp_id"] = passkeyRpId;
            }
            if (passkeyId) {
                secretObject["passkey_id"] = passkeyId;
            }
            if (passkeyPublicKey) {
                secretObject["passkey_public_key"] = passkeyPublicKey;
            }
            if (passkeyPrivateKey) {
                secretObject["passkey_private_key"] = passkeyPrivateKey;
            }
            if (passkeyUserHandle) {
                secretObject["passkey_user_handle"] = passkeyUserHandle;
            }
            if (passkeyAlgorithm) {
                secretObject["passkey_algorithm"] = passkeyAlgorithm;
            }

            secretObject["passkey_auto_submit"] = passkeyAutoSubmit;
            item["autosubmit"] = passkeyAutoSubmit;
            if (passkeyUrlFilter) {
                item["urlfilter"] = passkeyUrlFilter;
                secretObject["passkey_url_filter"] = passkeyUrlFilter;
            } else {
                delete item["urlfilter"];
            }
        }

        if (item.type === "application_password") {
            item["name"] = applicationPasswordTitle;
            secretObject["application_password_title"] = applicationPasswordTitle;
            if (applicationPasswordUsername) {
                secretObject["application_password_username"] = applicationPasswordUsername;
                item["description"]  = applicationPasswordUsername;
            }
            if (applicationPasswordPassword) {
                secretObject["application_password_password"] = applicationPasswordPassword;
                passwordSha1 = cryptoLibrary.sha1(applicationPasswordPassword);
                item["password_hash"]  = passwordSha1.substring(0, 5).toLowerCase();
            } else {
                item["password_hash"] = ''
            }
            if (applicationPasswordNotes) {
                secretObject["application_password_notes"] = applicationPasswordNotes;
            }
        }

        if (item.type === "bookmark") {
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

        if (item.type === "identity") {
            item["name"] = identityTitle;
            secretObject["identity_title"] = identityTitle;
            item["description"] = '';
            if (identityFirstName) {
                secretObject["identity_first_name"] = identityFirstName;
            }
            if (identityLastName) {
                secretObject["identity_last_name"] = identityLastName;
            }
            if (identityCompany) {
                secretObject["identity_company"] = identityCompany;
            }
            if (identityAddress) {
                secretObject["identity_address"] = identityAddress;
                item["description"]  = item["description"] + identityAddress + ' ';
            }
            if (identityCity) {
                secretObject["identity_city"] = identityCity;
                item["description"]  = item["description"] + identityCity + ' ';
            }
            if (identityPostalCode) {
                secretObject["identity_postal_code"] = identityPostalCode;
            }
            if (identityState) {
                secretObject["identity_state"] = identityState;
                item["description"]  = item["description"] + identityState + ' ';
            }
            if (identityCountry) {
                secretObject["identity_country"] = identityCountry;
                item["description"]  = item["description"] + identityCountry + ' ';
            }
            if (identityPhoneNumber) {
                secretObject["identity_phone_number"] = identityPhoneNumber;
            }
            if (identityEmail) {
                secretObject["identity_email"] = identityEmail;
            }
            if (identityNotes) {
                secretObject["identity_notes"] = identityNotes;
            }
            if (item["description"] === '') {
                delete item["description"];
            }
        }

        if (item.type === "note") {
            item["name"] = noteTitle;
            secretObject["note_title"] = noteTitle;
            if (noteNotes) {
                secretObject["note_notes"] = noteNotes;
            }
        }

        if (item.type === "totp") {
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

        if (item.type === "environment_variables") {
            item["name"] = environmentVariablesTitle;
            secretObject["environment_variables_title"] = environmentVariablesTitle;
            if (environmentVariablesVariables) {
                secretObject["environment_variables_variables"] = environmentVariablesVariables;
            }
            if (environmentVariablesNotes) {
                secretObject["environment_variables_notes"] = environmentVariablesNotes;
            }
        }

        if (item.type === "elster_certificate") {
            item["name"] = elsterCertificateTitle;
            secretObject["elster_certificate_title"] = elsterCertificateTitle;
            secretObject["elster_certificate_file_content"] = elsterCertificateFileContent;
            secretObject["elster_certificate_password"] = elsterCertificatePassword;
            if (elsterCertificateRetrievalCode) {
                secretObject["elster_certificate_retrieval_code"] = elsterCertificateRetrievalCode;
            }
            if (elsterCertificateNotes) {
                secretObject["elster_certificate_notes"] = elsterCertificateNotes;
            }
        }

        if (item.type === "file") {
            item["name"] = fileTitle;
            item["file_title"] = fileTitle;
            secretObject["file_title"] = fileTitle;
        }

        if (item.type === "ssh_own_key") {
            item["name"] = sshOwnKeyTitle;
            secretObject["ssh_own_key_title"] = sshOwnKeyTitle;
            if (sshOwnKeyPublic) {
                secretObject["ssh_own_key_public"] = sshOwnKeyPublic;
            }
            if (sshOwnKeyNotes) {
                secretObject["ssh_own_key_notes"] = sshOwnKeyNotes;
            }
            secretObject["ssh_own_key_private"] = sshOwnKeyPrivate;
        }

        if (item.type === "credit_card") {
            item["name"] = creditCardTitle;
            secretObject["credit_card_title"] = creditCardTitle;
            if (creditCardNumber) {
                secretObject["credit_card_number"] = creditCardNumber;
                item["description"]  = creditCardNumber.replace(/.(?=.{4})/g, 'x');
            }
            if (creditCardCVC) {
                secretObject["credit_card_cvc"] = creditCardCVC;
            }
            if (creditCardPIN) {
                secretObject["credit_card_pin"] = creditCardPIN;
            }
            if (creditCardName) {
                secretObject["credit_card_name"] = creditCardName;
            }
            if (creditCardValidThrough) {
                secretObject["credit_card_valid_through"] = creditCardValidThrough;
            }
            if (creditCardNotes) {
                secretObject["credit_card_notes"] = creditCardNotes;
            }
        }

        if (item.type === "mail_gpg_own_key") {
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

        if (customFields) {
            secretObject["custom_fields"] = customFields;
        }
        if (tags) {
            item["tags"] = tags;
            secretObject["tags"] = tags;
        }

        if (props.onCustomSave) {
            props.onCustomSave(item, secretObject, callbackUrl, callbackUser, callbackPass);
        } else if (typeof item.secret_id === "undefined") {
            // e.g. files
            props.onEdit(item);
        } else if (!props.data) {
            const onError = function (result) {
                console.log(result);
            };

            const onSuccess = function (e) {
                if (closeEditView) {
                    props.onEdit(item);
                }
            };
            secretService
                .writeSecret(item.secret_id, item.secret_key, secretObject, callbackUrl, callbackUser, callbackPass)
                .then(onSuccess, onError);
        }
    };

    const showHistory = (event) => {
        setHistoryDialogOpen(true);
    };

    const onShowHidePassword = (event) => {
        handleClose();
        setShowPassword(!showPassword);
    };

    const onCopyUsername = (event) => {
        handleClose();
        if (item.type === "website_password") {
            browserClientService.copyToClipboard(() => Promise.resolve(websitePasswordUsername));
        }
        if (item.type === "application_password") {
            browserClientService.copyToClipboard(() => Promise.resolve(applicationPasswordUsername));
        }
        notification.push("password_copy", t("USERNAME_COPY_NOTIFICATION"));
    };

    const onCopyPassword = (event) => {
        handleClose();
        if (item.type === "website_password") {
            browserClientService.copyToClipboard(() => Promise.resolve(websitePasswordPassword));
        }
        if (item.type === "application_password") {
            browserClientService.copyToClipboard(() => Promise.resolve(applicationPasswordPassword));
        }
        if (item.type === "elster_certificate") {
            browserClientService.copyToClipboard(() => Promise.resolve(elsterCertificatePassword));
        }
        notification.push("password_copy", t("PASSWORD_COPY_NOTIFICATION"));
    };

    const onCopyRetrievalCode = (event) => {
        handleClose();
        if (item.type === "elster_certificate") {
            browserClientService.copyToClipboard(() => Promise.resolve(elsterCertificateRetrievalCode));
        }
        notification.push("password_copy", t("RETRIEVAL_CODE_COPY_NOTIFICATION"));
    };

    const onCopyValue = (value) => {
        handleClose();
        if (item.type === "environment_variables") {
            browserClientService.copyToClipboard(() => Promise.resolve(value));
        }
        notification.push("value_copy", t("VALUE_COPY_NOTIFICATION"));
    };

    const onCopyUrl = (event) => {
        handleClose();
        if (item.type === "website_password") {
            browserClientService.copyToClipboard(() => Promise.resolve(websitePasswordUrl));
        }
        if (item.type === "bookmark") {
            browserClientService.copyToClipboard(() => Promise.resolve(bookmarkUrl));
        }
        notification.push("password_copy", t("URL_COPY_NOTIFICATION"));
    };

    const onCopyPIN = (event) => {
        handleClose();
        if (item.type === "credit_card") {
            browserClientService.copyToClipboard(() => Promise.resolve(creditCardPIN));
        }
        notification.push("pin_copy", t("PIN_COPY_NOTIFICATION"));
    };

    const onCopyPrivateKey = (event) => {
        handleClose();
        if (item.type === "ssh_own_key") {
            browserClientService.copyToClipboard(() => Promise.resolve(sshOwnKeyPrivate));
        }
        if (item.type === "mail_gpg_own_key") {
            browserClientService.copyToClipboard(() => Promise.resolve(mailGpgOwnKeyPrivate));
        }
        notification.push("password_copy", t("PRIVATE_KEY_COPY_NOTIFICATION"));
    };
    const onGeneratePassword = (event) => {
        handleClose();
        setGeneratePasswordDialogOpen(true);
    };
    const onPasswordGenerated = (password) => {
        handleClose();
        setGeneratePasswordDialogOpen(false);
        if (item.type === "website_password") {
            setWebsitePasswordPassword(password);
        }
        if (item.type === "application_password") {
            setApplicationPasswordPassword(password);
        }
    };

    const onElsterCertificateFileChange = (event) => {
        event.preventDefault();

        if (!elsterCertificateTitle && event.target.files[0].name) {
            setElsterCertificateTitle(event.target.files[0].name);
        }
        setElsterCertificateFileName(event.target.files[0].name);

        const fileReader = new FileReader();

        fileReader.onloadend = function (event) {
            const bytes = new Uint8Array(event.target.result);
            setElsterCertificateFileContent(converterService.toHex(bytes));
        };


        fileReader.readAsArrayBuffer(event.target.files[0]);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setAnchorEl2(null);
        setAnchorEl3(null);
        setAnchorElMoreMenu(null);
    };


    const linkItem = function (event) {
        event.stopPropagation();

        secretService.onItemClick(item);
    };

    const onLinkShare = () => {
        setCreateLinkShareOpen(true);
    };
    const onDelete = () => {
        props.onDeleteItem();
        onClose();
    }

    let title = ''
    if (item.share_rights && item.share_rights.read) {
        title = item.share_rights && item.share_rights.write ? t(itemBlueprint.edit_title) : t(itemBlueprint.show_title);
    } else {
        title = t('ACCESS_DENIED')
    }

    let webClient = getStore().getState().server.webClient || '';
    if (webClient) {
       webClient = webClient + "/";
    }

    const hasAddCustomField = !hideAddCustomField && (item.type === "website_password" || item.type === "application_password" || item.type === "bookmark" || item.type === "note");
    const hasAddTag = !hideAddTag;
    const hasAddTOTP = !hideAddTOTP && item.type === "website_password" && !websitePasswordTotpCode;

    let renderAddButton = null;
    if (hasAddCustomField || hasAddTag || hasAddTOTP) {
        renderAddButton = (
            <React.Fragment>
                <Grid item xs={12} sm={12} md={12}>
                    <Button
                        startIcon={<PlaylistAddIcon />}
                        disabled={getStore().getState().settingsDatastore.noSaveMode}
                        onClick={(event) => {
                            setAnchorEl3(event.currentTarget);
                        }}
                    >
                        {t("ADD_DOT_DOT_DOT")}
                    </Button>
                    <Menu
                        id="add-menu"
                        anchorEl={anchorEl3}
                        keepMounted
                        open={Boolean(anchorEl3)}
                        onClose={handleClose}
                    >
                        {hasAddCustomField && (
                            <MenuItem
                                disabled={readOnly}
                                onClick={() => {
                                    handleClose();
                                    setAddCustomFieldOpen(true);
                                }}
                            >
                                <ListItemIcon className={classes.listItemIcon}>
                                    <PlaylistAddIcon className={classes.icon} fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" noWrap>
                                    {t("ADD_CUSTOM_FIELD")}
                                </Typography>
                            </MenuItem>
                        )}
                        {hasAddTag && (
                            <MenuItem
                                disabled={readOnly}
                                onClick={() => {
                                    handleClose();
                                    setAddTagOpen(true);
                                }}
                            >
                                <ListItemIcon className={classes.listItemIcon}>
                                    <PlaylistAddIcon className={classes.icon} fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" noWrap>
                                    {t("ADD_TAG")}
                                </Typography>
                            </MenuItem>
                        )}
                        {hasAddTOTP && (
                            <MenuItem
                                disabled={readOnly}
                                onClick={() => {
                                    handleClose();
                                    setAddTotpOpen(true);
                                }}
                            >
                                <ListItemIcon className={classes.listItemIcon}>
                                    <PlaylistAddIcon className={classes.icon} fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" noWrap>
                                    {t("ADD_TOTP")}
                                </Typography>
                            </MenuItem>
                        )}
                    </Menu>
                </Grid>
            </React.Fragment>
        )
    }

    const renderedCustomFields = (
        <React.Fragment>
            {customFields.map((customField, index) => (
                <Grid item xs={12} sm={12} md={12} key={`customField-${index}`}>
                    <CustomField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id={`customField${index}`}
                        label={customField.name}
                        name={`customField${index}`}
                        autoComplete="off"
                        value={customField.value}
                        fieldType={customField.type}
                        onChange={(event) => {
                            setDirty(true);
                            setCustomFields(customFields.map((field, i) => i === index ? { ...field, value: event.target.value } : field));
                        }}
                        InputProps={{
                            readOnly: readOnly,
                            type: customField.type === "text" || showPassword ? "text" : "password",
                            classes: {
                                input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                            },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        className={classes.iconButton}
                                        aria-label="menu"
                                        onClick={(event) => {
                                            setAnchorElsCustomFields({ ...anchorElsCustomFields, [index]: event.currentTarget });
                                        }}
                                        size="large">
                                        <MenuOpenIcon fontSize="small" />
                                    </IconButton>
                                    <Menu
                                        id="simple-menu"
                                        anchorEl={anchorElsCustomFields[index]}
                                        keepMounted
                                        open={Boolean(anchorElsCustomFields[index])}
                                        onClose={() => setAnchorElsCustomFields({ ...anchorElsCustomFields, [index]: null })}
                                    >
                                        {customField.type === "password" && (
                                            <MenuItem onClick={(event) => {
                                                onShowHidePassword(event);
                                                setAnchorElsCustomFields({ ...anchorElsCustomFields, [index]: null });
                                            }}>
                                                <ListItemIcon className={classes.listItemIcon}>
                                                    <VisibilityOffIcon className={classes.icon} fontSize="small" />
                                            </ListItemIcon>
                                            <Typography variant="body2" noWrap>
                                                    {t("SHOW_OR_HIDE_VALUE")}
                                                </Typography>
                                            </MenuItem>
                                        )}

                                        <MenuItem onClick={(event) => {
                                            browserClientService.copyToClipboard(() => Promise.resolve(customField.value));
                                            notification.push("content_copy", t("CONTENT_COPY_NOTIFICATION"));
                                            setAnchorElsCustomFields({ ...anchorElsCustomFields, [index]: null });
                                        }}>
                                            <ListItemIcon className={classes.listItemIcon}>
                                                <ContentCopy className={classes.icon} fontSize="small" />
                                            </ListItemIcon>
                                            <Typography variant="body2" noWrap>
                                                {t("COPY_TO_CLIPBOARD")}
                                            </Typography>
                                        </MenuItem>
                                        {!readOnly && (
                                            <>
                                                <Divider className={classes.divider} />
                                                <MenuItem onClick={(event) => {
                                                    setEditCustomFieldOpenIndex(index);
                                                    setAnchorElsCustomFields({ ...anchorElsCustomFields, [index]: null });
                                                }}>
                                                    <ListItemIcon className={classes.listItemIcon}>
                                                        <EditIcon className={classes.icon} fontSize="small" />
                                                    </ListItemIcon>
                                                    <Typography variant="body2" noWrap>
                                                        {t("EDIT_CUSTOM_FIELD")}
                                                    </Typography>
                                                </MenuItem>
                                                <MenuItem onClick={(event) => {
                                                    setCustomFields(customFields.filter((field, i) => i !== index));
                                                    setDirty(true);
                                                    setAnchorElsCustomFields({ ...anchorElsCustomFields, [index]: null });
                                                }}>
                                                    <ListItemIcon className={classes.listItemIcon}>
                                                        <DeleteIcon className={classes.icon} fontSize="small" />
                                                    </ListItemIcon>
                                                    <Typography variant="body2" noWrap>
                                                        {t("REMOVE_CUSTOM_FIELD")}
                                                    </Typography>
                                                </MenuItem>
                                            </>
                                        )}

                                    </Menu>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
            ))}
        </React.Fragment>
    );

    let actions = (
        <React.Fragment>
            <Button
                onClick={() => {
                    onClose();
                }}
            >
                {t("CLOSE")}
            </Button>
            {item.share_rights && item.share_rights.read && item.share_rights.write && !offline && (props.onEdit || props.onCustomSave) && (
                <Button onClick={() => {
                    onEdit(true)
                }} variant="contained" color="primary" disabled={(!canSave || (getStore().getState().settingsDatastore.noSaveMode))} type="submit">
                    {t("SAVE")}
                </Button>
            )}
            {!hideMoreMenu && item.share_rights && (item.share_rights.read || item.share_rights.write) && !offline && (
                <>
                    <IconButton
                        aria-controls="more-menu"
                        aria-label="open more menu"
                        onClick={(event) => {
                            setAnchorElMoreMenu(event.currentTarget);
                        }}
                        size="large">
                        <MoreVertIcon />
                    </IconButton>
                    <Menu
                        id="more-menu"
                        anchorEl={anchorElMoreMenu}
                        keepMounted
                        open={Boolean(anchorElMoreMenu)}
                        onClose={handleClose}
                    >
                        {!getStore().getState().server.complianceDisableLinkShares && (<MenuItem onClick={onLinkShare}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <LinkIcon className={classes.icon} fontSize="small"/>
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("LINK_SHARE")}
                            </Typography>
                        </MenuItem>)}
                        {!getStore().getState().server.complianceDisableLinkShares && item.share_rights.write && props.onDeleteItem && <Divider className={classes.divider} />}
                        {item.share_rights.write && props.onDeleteItem && <MenuItem onClick={onDelete}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <DeleteIcon className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("MOVE_TO_TRASH")}
                            </Typography>
                        </MenuItem>}
                    </Menu>
                </>
            )}
            {decryptMessageDialogOpen && (
                <DialogDecryptGpgMessage
                    open={decryptMessageDialogOpen}
                    onClose={() => setDecryptMessageDialogOpen(false)}
                />
            )}
            {encryptMessageDialogOpen && (
                <DialogEncryptGpgMessage
                    open={encryptMessageDialogOpen}
                    onClose={() => setEncryptMessageDialogOpen(false)}
                    secretId={encryptSecretId}
                />
            )}
            {historyDialogOpen && (
                <DialogHistory open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} item={item} />
            )}
        </React.Fragment>
    )
    const content = (
        <Grid container>
            {item.type === "passkey" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="passkeyTitle"
                        label={t("TITLE")}
                        name="passkeyTitle"
                        autoComplete="off"
                        value={passkeyTitle}
                        InputProps={{ readOnly: readOnly }}
                        required
                        onChange={(event) => {
                            setDirty(true);
                            setPasskeyTitle(event.target.value);
                        }}
                    />
                </Grid>
            )}
            {item.type === "website_password" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="websitePasswordTitle"
                        label={t("TITLE")}
                        name="websitePasswordTitle"
                        autoComplete="off"
                        value={websitePasswordTitle}
                        InputProps={{ readOnly: readOnly }}
                        required
                        onChange={(event) => {
                            setDirty(true);
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
                        margin="dense" size="small"
                        id="websitePasswordUrl"
                        label={t("URL")}
                        name="websitePasswordUrl"
                        autoComplete="off"
                        value={websitePasswordUrl}
                        InputProps={{
                            readOnly: readOnly,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        className={classes.iconButton}
                                        aria-label="menu"
                                        onClick={(event) => {
                                            if (linkDirectly) {
                                                browserClientService.openTab(websitePasswordUrl);
                                            } else {
                                                linkItem(event)
                                            }
                                        }}
                                        size="large">
                                        <OpenInNewIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        onChange={(event) => {
                            setDirty(true);
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
                        margin="dense" size="small"
                        id="websitePasswordUsername"
                        label={t("USERNAME")}
                        name="websitePasswordUsername"
                        autoComplete="off"
                        value={websitePasswordUsername}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setWebsitePasswordUsername(event.target.value);
                        }}
                    />
                </Grid>
            )}
            {item.type === "website_password" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextFieldColored
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="websitePasswordPassword"
                        label={t("PASSWORD")}
                        name="websitePasswordPassword"
                        autoComplete="off"
                        value={websitePasswordPassword}
                        onChange={(event) => {
                            setDirty(true);
                            setWebsitePasswordPassword(event.target.value);
                        }}
                        InputProps={{
                            readOnly: readOnly,
                            type: showPassword ? "text" : "password",
                            classes: {
                                input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                            },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        className={classes.iconButton}
                                        aria-label="menu"
                                        onClick={(event) => {
                                            setAnchorEl(event.currentTarget);
                                        }}
                                        size="large">
                                        <MenuOpenIcon fontSize="small" />
                                    </IconButton>
                                    <Menu
                                        id="simple-menu"
                                        anchorEl={anchorEl}
                                        keepMounted
                                        open={Boolean(anchorEl)}
                                        onClose={handleClose}
                                    >
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
                                        {showGeneratePassword && (
                                            <MenuItem onClick={onGeneratePassword}>
                                                <ListItemIcon className={classes.listItemIcon}>
                                                    <PhonelinkSetupIcon
                                                        className={classes.icon}
                                                        fontSize="small"
                                                    />
                                                </ListItemIcon>
                                                <Typography variant="body2" noWrap>
                                                    {t("GENERATE_PASSWORD")}
                                                </Typography>
                                            </MenuItem>
                                        )}
                                    </Menu>
                                </InputAdornment>
                            ),
                        }}
                    />
                    {!!websitePasswordPassword && (<LinearProgress variant="determinate" value={cryptoLibrary.calculatePasswordStrengthInPercent(websitePasswordPassword)} />)}
                </Grid>
            )}

            {item.type === "website_password" && websitePasswordTotpCode && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextFieldTotp
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="websitePasswordTotpCode"
                        label={t("TOTP_CODE")}
                        name="websitePasswordTotpCode"
                        autoComplete="off"
                        period={websitePasswordTotpPeriod}
                        algorithm={websitePasswordTotpAlgorithm}
                        digits={websitePasswordTotpDigits}
                        code={websitePasswordTotpCode}
                        onDelete={item.share_rights && item.share_rights.write ? () => {
                            setWebsitePasswordTotpCode("");
                            setWebsitePasswordTotpPeriod(30);
                            setWebsitePasswordTotpAlgorithm("SHA1");
                            setWebsitePasswordTotpDigits(6);
                        } : null}
                    />
                </Grid>
            )}

            {item.type === "website_password" && renderedCustomFields}
            {item.type === "website_password" && renderAddButton}

            {item.type === "website_password" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="websitePasswordNotes"
                        label={t("NOTES")}
                        name="websitePasswordNotes"
                        autoComplete="off"
                        value={websitePasswordNotes}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setWebsitePasswordNotes(event.target.value);
                        }}
                        multiline
                        minRows={3}
                        maxRows={32}
                    />
                </Grid>
            )}

            {item.type === "application_password" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="applicationPasswordTitle"
                        label={t("TITLE")}
                        name="applicationPasswordTitle"
                        autoComplete="off"
                        value={applicationPasswordTitle}
                        InputProps={{ readOnly: readOnly }}
                        required
                       onChange={(event) => {
                            setDirty(true);
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
                        margin="dense" size="small"
                        id="applicationPasswordUsername"
                        label={t("USERNAME")}
                        name="applicationPasswordUsername"
                        autoComplete="off"
                        value={applicationPasswordUsername}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setApplicationPasswordUsername(event.target.value);
                        }}
                    />
                </Grid>
            )}
            {item.type === "application_password" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextFieldColored
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="applicationPasswordPassword"
                        label={t("PASSWORD")}
                        name="applicationPasswordPassword"
                        autoComplete="off"
                        value={applicationPasswordPassword}
                        onChange={(event) => {
                            setDirty(true);
                            setApplicationPasswordPassword(event.target.value);
                        }}
                        InputProps={{
                            readOnly: readOnly,
                            type: showPassword ? "text" : "password",
                            classes: {
                                input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                            },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        className={classes.iconButton}
                                        aria-label="menu"
                                        onClick={(event) => {
                                            setAnchorEl(event.currentTarget);
                                        }}
                                        size="large">
                                        <MenuOpenIcon fontSize="small" />
                                    </IconButton>
                                    <Menu
                                        id="simple-menu"
                                        anchorEl={anchorEl}
                                        keepMounted
                                        open={Boolean(anchorEl)}
                                        onClose={handleClose}
                                    >
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
                                        {showGeneratePassword && (
                                            <MenuItem onClick={onGeneratePassword}>
                                                <ListItemIcon className={classes.listItemIcon}>
                                                    <PhonelinkSetupIcon
                                                        className={classes.icon}
                                                        fontSize="small"
                                                    />
                                                </ListItemIcon>
                                                <Typography variant="body2" noWrap>
                                                    {t("GENERATE_PASSWORD")}
                                                </Typography>
                                            </MenuItem>
                                        )}
                                    </Menu>
                                </InputAdornment>
                            ),
                        }}
                    />
                    {!!applicationPasswordPassword && (<LinearProgress variant="determinate" value={cryptoLibrary.calculatePasswordStrengthInPercent(applicationPasswordPassword)} />)}
                </Grid>
            )}

            {item.type === "application_password" && renderedCustomFields}
            {item.type === "application_password" && renderAddButton}

            {item.type === "application_password" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="applicationPasswordNotes"
                        label={t("NOTES")}
                        name="applicationPasswordNotes"
                        autoComplete="off"
                        value={applicationPasswordNotes}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setApplicationPasswordNotes(event.target.value);
                        }}
                        multiline
                        minRows={3}
                        maxRows={32}
                    />
                </Grid>
            )}

            {item.type === "bookmark" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="bookmarkTitle"
                        label={t("TITLE")}
                        name="bookmarkTitle"
                        autoComplete="off"
                        value={bookmarkTitle}
                        InputProps={{ readOnly: readOnly }}
                        required
                        onChange={(event) => {
                            setDirty(true);
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
                        margin="dense" size="small"
                        id="bookmarkUrl"
                        error={!!bookmarkUrl && !helperService.isValidUrl(bookmarkUrl)}
                        label={t("URL")}
                        name="bookmarkUrl"
                        autoComplete="off"
                        value={bookmarkUrl}
                        InputProps={{
                            readOnly: readOnly,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        className={classes.iconButton}
                                        aria-label="menu"
                                        onClick={(event) => {
                                            if (linkDirectly) {
                                                browserClientService.openTab(bookmarkUrl);
                                            } else {
                                                linkItem(event)
                                            }
                                        }}
                                        size="large">
                                        <OpenInNewIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        onChange={(event) => {
                            setDirty(true);
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

            {item.type === "bookmark" && renderedCustomFields}
            {item.type === "bookmark" && renderAddButton}

            {item.type === "bookmark" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="bookmarkNotes"
                        label={t("NOTES")}
                        name="bookmarkNotes"
                        autoComplete="off"
                        value={bookmarkNotes}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setBookmarkNotes(event.target.value);
                        }}
                        multiline
                        minRows={3}
                        maxRows={32}
                    />
                </Grid>
            )}


            {item.type === "identity" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="identityTitle"
                        label={t("TITLE")}
                        name="identityTitle"
                        autoComplete="off"
                        value={identityTitle}
                        InputProps={{ readOnly: readOnly }}
                        required
                        onChange={(event) => {
                            setDirty(true);
                            setIdentityTitle(event.target.value);
                        }}
                    />
                </Grid>
            )}
            {item.type === "identity" && (
                <Grid item xs={6} sm={6} md={6}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="identityFirstName"
                        label={t("FIRST_NAME")}
                        name="identityFirstName"
                        autoComplete="off"
                        value={identityFirstName}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setIdentityFirstName(event.target.value);
                        }}
                    />
                </Grid>
            )}
            {item.type === "identity" && (
                <Grid item xs={6} sm={6} md={6}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="identityLastName"
                        label={t("LAST_NAME")}
                        name="identityLastName"
                        autoComplete="off"
                        value={identityLastName}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setIdentityLastName(event.target.value);
                        }}
                    />
                </Grid>
            )}
            {item.type === "identity" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="identityCompany"
                        label={t("COMPANY")}
                        name="identityCompany"
                        autoComplete="off"
                        value={identityCompany}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setIdentityCompany(event.target.value);
                        }}
                    />
                </Grid>
            )}
            {item.type === "identity" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="identityAddress"
                        label={t("ADDRESS")}
                        name="identityAddress"
                        autoComplete="off"
                        value={identityAddress}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setIdentityAddress(event.target.value);
                        }}
                    />
                </Grid>
            )}
            {item.type === "identity" && (
                <Grid item xs={6} sm={6} md={6}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="identityPostalCode"
                        label={t("POSTAL_CODE")}
                        name="identityPostalCode"
                        autoComplete="off"
                        value={identityPostalCode}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setIdentityPostalCode(event.target.value);
                        }}
                    />
                </Grid>
            )}
            {item.type === "identity" && (
                <Grid item xs={6} sm={6} md={6}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="identityCity"
                        label={t("CITY")}
                        name="identityCity"
                        autoComplete="off"
                        value={identityCity}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setIdentityCity(event.target.value);
                        }}
                    />
                </Grid>
            )}
            {item.type === "identity" && (
                <Grid item xs={6} sm={6} md={6}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="identityState"
                        label={t("STATE")}
                        name="identityState"
                        autoComplete="off"
                        value={identityState}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setIdentityState(event.target.value);
                        }}
                    />
                </Grid>
            )}
            {item.type === "identity" && (
                <Grid item xs={6} sm={6} md={6}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="identityCountry"
                        label={t("COUNTRY")}
                        name="identityCountry"
                        autoComplete="off"
                        value={identityCountry}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setIdentityCountry(event.target.value);
                        }}
                    />
                </Grid>
            )}
            {item.type === "identity" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="identityPhoneNumber"
                        label={t("PHONE_NUMBER")}
                        name="identityPhoneNumber"
                        autoComplete="off"
                        value={identityPhoneNumber}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setIdentityPhoneNumber(event.target.value);
                        }}
                    />
                </Grid>
            )}
            {item.type === "identity" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="identityEmail"
                        label={t("EMAIL")}
                        name="identityEmail"
                        autoComplete="off"
                        value={identityEmail}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setIdentityEmail(event.target.value);
                        }}
                    />
                </Grid>
            )}

            {item.type === "identity" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="identityNotes"
                        label={t("NOTES")}
                        name="identityNotes"
                        autoComplete="off"
                        value={identityNotes}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setIdentityNotes(event.target.value);
                        }}
                        multiline
                        minRows={3}
                        maxRows={32}
                    />
                </Grid>
            )}

            {item.type === "note" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="noteTitle"
                        label={t("TITLE")}
                        name="noteTitle"
                        autoComplete="off"
                        value={noteTitle}
                        InputProps={{ readOnly: readOnly }}
                        required
                        onChange={(event) => {
                            setDirty(true);
                            setNoteTitle(event.target.value);
                        }}
                    />
                </Grid>
            )}

            {item.type === "note" && renderedCustomFields}
            {item.type === "note" && renderAddButton}

            {item.type === "note" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="noteNotes"
                        label={t("NOTES")}
                        name="noteNotes"
                        autoComplete="off"
                        value={noteNotes}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setNoteNotes(event.target.value);
                        }}
                        multiline
                        minRows={3}
                        maxRows={32}
                    />
                </Grid>
            )}

            {item.type === "totp" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="totpTitle"
                        label={t("TITLE")}
                        name="totpTitle"
                        autoComplete="off"
                        value={totpTitle}
                        InputProps={{ readOnly: readOnly }}
                        required
                        onChange={(event) => {
                            setDirty(true);
                            setTotpTitle(event.target.value);
                        }}
                    />
                </Grid>
            )}

            {item.type === "totp" && (
                <Grid item xs={12} sm={12} md={12} className={classes.totpCircleGridItem}>
                    <TotpCircle
                        period={totpPeriod}
                        algorithm={totpAlgorithm}
                        digits={totpDigits}
                        code={totpCode}
                        className={classes.totpCircle}
                    />
                </Grid>
            )}

            {item.type === "totp" && renderAddButton}

            {item.type === "totp" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="totpNotes"
                        label={t("NOTES")}
                        name="totpNotes"
                        autoComplete="off"
                        value={totpNotes}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setTotpNotes(event.target.value);
                        }}
                        multiline
                        minRows={3}
                        maxRows={32}
                    />
                </Grid>
            )}

            {item.type === "environment_variables" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="environmentVariablesTitle"
                        label={t("TITLE")}
                        name="environmentVariablesTitle"
                        autoComplete="off"
                        value={environmentVariablesTitle}
                        InputProps={{ readOnly: readOnly }}
                        required
                        onChange={(event) => {
                            setDirty(true);
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
                                        margin="dense" size="small"
                                        id={"environmentVariablesVariables-key-" + index}
                                        label={t("KEY")}
                                        name={"environmentVariablesVariables-key-" + index}
                                        autoComplete={"environmentVariablesVariables-key-" + index}
                                        value={variable.key}
                                        InputProps={{ readOnly: readOnly }}
                                        required
                                        onChange={(event) => {
                                            setDirty(true);
                                            const newEnvs = helperService.duplicateObject(environmentVariablesVariables);
                                            newEnvs[index]["key"] = event.target.value;
                                            setEnvironmentVariablesVariables(newEnvs);
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={5} sm={5} md={5}>
                                    <TextFieldColored
                                        className={classes.textField5}
                                        variant="outlined"
                                        margin="dense" size="small"
                                        id={"environmentVariablesVariables-value-" + index}
                                        label={t("VALUE")}
                                        name={"environmentVariablesVariables-value-" + index}
                                        autoComplete={"environmentVariablesVariables-value-" + index}
                                        value={variable.value}
                                        InputProps={{
                                            readOnly: !item.share_rights || !item.share_rights.write,
                                            type: showPasswords[index] ? "text" : "password",
                                            classes: {
                                                input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                                            },
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        className={classes.iconButton}
                                                        aria-label="menu"
                                                        onClick={(event) => {
                                                            setAnchorEls({ ...anchorEls, [index]: event.currentTarget });
                                                        }}
                                                        size="large">
                                                        <MenuOpenIcon fontSize="small" />
                                                    </IconButton>
                                                    <Menu
                                                        id={`simple-menu-${index}`}
                                                        anchorEl={anchorEls[index]}
                                                        keepMounted
                                                        open={Boolean(anchorEls[index])}
                                                        onClose={() => setAnchorEls({ ...anchorEls, [index]: null })}
                                                    >
                                                        <MenuItem
                                                            onClick={() => {
                                                                setShowPasswords({
                                                                    ...showPasswords,
                                                                    [index]: !showPasswords[index],
                                                                });
                                                                setAnchorEls({ ...anchorEls, [index]: null });
                                                            }}
                                                        >
                                                            <ListItemIcon className={classes.listItemIcon}>
                                                                <VisibilityOffIcon className={classes.icon} fontSize="small" />
                                                            </ListItemIcon>
                                                            <Typography variant="body2" noWrap>
                                                                {t("SHOW_OR_HIDE_VALUE")}
                                                            </Typography>
                                                        </MenuItem>
                                                        <MenuItem onClick={() => {
                                                            onCopyValue(variable.value);
                                                            setAnchorEls({ ...anchorEls, [index]: null });
                                                        }}>
                                                            <ListItemIcon className={classes.listItemIcon}>
                                                                <ContentCopy className={classes.icon} fontSize="small" />
                                                            </ListItemIcon>
                                                            <Typography variant="body2" noWrap>
                                                                {t("COPY_VALUE")}
                                                            </Typography>
                                                        </MenuItem>
                                                    </Menu>
                                                </InputAdornment>
                                            ),
                                        }}
                                        required
                                        onChange={(event) => {
                                            setDirty(true);
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
                                            setDirty(true);
                                            const newEnvs = helperService.duplicateObject(environmentVariablesVariables);
                                            newEnvs.splice(index, 1);
                                            setEnvironmentVariablesVariables(newEnvs);
                                        }}
                                        size="large">
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

            {item.type === "environment_variables" && renderAddButton}

            {item.type === "environment_variables" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="environmentVariablesNotes"
                        label={t("NOTES")}
                        name="environmentVariablesNotes"
                        autoComplete="off"
                        value={environmentVariablesNotes}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setEnvironmentVariablesNotes(event.target.value);
                        }}
                        multiline
                        minRows={3}
                        maxRows={32}
                    />
                </Grid>
            )}

            {item.type === "elster_certificate" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="elsterCertificateTitle"
                        label={t("TITLE")}
                        name="elsterCertificateTitle"
                        autoComplete="off"
                        value={elsterCertificateTitle}
                        InputProps={{ readOnly: readOnly }}
                        required
                        onChange={(event) => {
                            setDirty(true);
                            setElsterCertificateTitle(event.target.value);
                        }}
                    />
                </Grid>
            )}

            {item.type === "elster_certificate" && (
                <Grid item xs={12} sm={12} md={12}>
                    <Grid item xs={12} sm={12} md={12} style={{ marginBottom: "8px", marginTop: "8px" }}>
                        <Button variant="contained" component="label">
                            {elsterCertificateFileName ? elsterCertificateFileName : t("CERTIFICATE_FILE")}
                            <input type="file" hidden onChange={onElsterCertificateFileChange} accept=".pfx" required readOnly={!item.share_rights || !item.share_rights.write} />
                        </Button>
                    </Grid>
                </Grid>
            )}

            {item.type === "elster_certificate" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextFieldColored
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="elsterCertificatePassword"
                        label={t("CERTIFICATE_PASSWORD")}
                        name="elsterCertificatePassword"
                        autoComplete="off"
                        required
                        value={elsterCertificatePassword}
                        onChange={(event) => {
                            setDirty(true);
                            setElsterCertificatePassword(event.target.value);
                        }}
                        InputProps={{
                            readOnly: readOnly,
                            type: showPassword ? "text" : "password",
                            classes: {
                                input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                            },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        className={classes.iconButton}
                                        aria-label="menu"
                                        onClick={(event) => {
                                            setAnchorEl(event.currentTarget);
                                        }}
                                        size="large">
                                        <MenuOpenIcon fontSize="small" />
                                    </IconButton>
                                    <Menu
                                        id="simple-menu"
                                        anchorEl={anchorEl}
                                        keepMounted
                                        open={Boolean(anchorEl)}
                                        onClose={handleClose}
                                    >
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
                    {!!elsterCertificatePassword && (<LinearProgress variant="determinate" value={cryptoLibrary.calculatePasswordStrengthInPercent(elsterCertificatePassword)} />)}
                </Grid>
            )}

            {item.type === "elster_certificate" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextFieldColored
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="elsterCertificateRetrievalCode"
                        label={t("RETRIEVAL_CODE")}
                        name="elsterCertificateRetrievalCode"
                        autoComplete="off"
                        value={elsterCertificateRetrievalCode}
                        onChange={(event) => {
                            setDirty(true);
                            setElsterCertificateRetrievalCode(event.target.value);
                        }}
                        InputProps={{
                            readOnly: readOnly,
                            type: showPassword ? "text" : "password",
                            classes: {
                                input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                            },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        className={classes.iconButton}
                                        aria-label="menu"
                                        onClick={(event) => {
                                            setAnchorEl2(event.currentTarget);
                                        }}
                                        size="large">
                                        <MenuOpenIcon fontSize="small" />
                                    </IconButton>
                                    <Menu
                                        id="simple-menu"
                                        anchorEl={anchorEl2}
                                        keepMounted
                                        open={Boolean(anchorEl2)}
                                        onClose={handleClose}
                                    >
                                        <MenuItem onClick={onShowHidePassword}>
                                            <ListItemIcon className={classes.listItemIcon}>
                                                <VisibilityOffIcon className={classes.icon} fontSize="small" />
                                            </ListItemIcon>
                                            <Typography variant="body2" noWrap>
                                                {t("SHOW_OR_HIDE_PASSWORD")}
                                            </Typography>
                                        </MenuItem>
                                        <MenuItem onClick={onCopyRetrievalCode}>
                                            <ListItemIcon className={classes.listItemIcon}>
                                                <ContentCopy className={classes.icon} fontSize="small" />
                                            </ListItemIcon>
                                            <Typography variant="body2" noWrap>
                                                {t("COPY_PASSWORD")}
                                            </Typography>
                                        </MenuItem>
                                    </Menu>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
            )}

            {item.type === "elster_certificate" && renderAddButton}

            {item.type === "elster_certificate" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="elsterCertificateNotes"
                        label={t("NOTES")}
                        name="elsterCertificateNotes"
                        autoComplete="off"
                        value={elsterCertificateNotes}
                        onChange={(event) => {
                            setDirty(true);
                            setElsterCertificateNotes(event.target.value);
                        }}
                        multiline
                        minRows={3}
                        maxRows={32}
                    />
                </Grid>
            )}


            {item.type === "file" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="fileTitle"
                        label={t("TITLE")}
                        name="fileTitle"
                        autoComplete="off"
                        value={fileTitle}
                        InputProps={{ readOnly: readOnly }}
                        required
                        onChange={(event) => {
                            setDirty(true);
                            setFileTitle(event.target.value);
                        }}
                    />
                </Grid>
            )}

            {item.type === "credit_card" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="creditCardTitle"
                        label={t("TITLE")}
                        name="creditCardTitle"
                        autoComplete="off"
                        value={creditCardTitle}
                        InputProps={{ readOnly: readOnly }}
                        required
                        onChange={(event) => {
                            setDirty(true);
                            setCreditCardTitle(event.target.value);
                        }}
                    />
                </Grid>
            )}

            {item.type === "credit_card" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextFieldCreditCardNumber
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="creditCardNumber"
                        label={t("CREDIT_CARD_NUMBER")}
                        placeholder="1234 1234 1234 1234"
                        name="creditCardNumber"
                        autoComplete="off"
                        value={creditCardNumber}
                        InputProps={{
                            readOnly: readOnly,
                            type: showPassword ? "text" : "password",
                            classes: {
                                input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                            },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        className={classes.iconButton}
                                        aria-label="menu"
                                        onClick={(event) => {
                                            setAnchorEl2(event.currentTarget);
                                        }}
                                        size="large">
                                        <MenuOpenIcon fontSize="small" />
                                    </IconButton>
                                    <Menu
                                        id="simple-menu"
                                        anchorEl={anchorEl2}
                                        keepMounted
                                        open={Boolean(anchorEl2)}
                                        onClose={handleClose}
                                    >
                                        <MenuItem onClick={onShowHidePassword}>
                                            <ListItemIcon className={classes.listItemIcon}>
                                                <VisibilityOffIcon className={classes.icon} fontSize="small" />
                                            </ListItemIcon>
                                            <Typography variant="body2" noWrap>
                                                {showPassword ? t("HIDE_CREDIT_CARD_NUMBER") : t("SHOW_CREDIT_CARD_NUMBER")}
                                            </Typography>
                                        </MenuItem>
                                        <MenuItem onClick={(event) => {
                                            handleClose();
                                            browserClientService.copyToClipboard(() => Promise.resolve(creditCardNumber));
                                            notification.push("credit_card_number_copy", t("CREDIT_CARD_NUMBER_COPY_NOTIFICATION"));
                                        }}>
                                            <ListItemIcon className={classes.listItemIcon}>
                                                <ContentCopy className={classes.icon} fontSize="small" />
                                            </ListItemIcon>
                                            <Typography variant="body2" noWrap>
                                                {t("COPY_CREDIT_CARD_NUMBER")}
                                            </Typography>
                                        </MenuItem>
                                    </Menu>
                                </InputAdornment>
                            ),
                        }}
                        required
                        onChange={(event) => {
                            setDirty(true);
                            setCreditCardNumber(event.target.value);
                        }}
                    />

                </Grid>
            )}

            {item.type === "credit_card" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="creditCardName"
                        label={t("NAME")}
                        name="creditCardName"
                        autoComplete="off"
                        value={creditCardName}
                        InputProps={{
                            readOnly: readOnly,
                        }}
                        required
                        onChange={(event) => {
                            setDirty(true);
                            setCreditCardName(event.target.value);
                        }}
                    />
                </Grid>
            )}

            {item.type === "credit_card" && (
                <Grid item xs={6} sm={6} md={6}>
                    <TextFieldCreditCardValidThrough
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="creditCardValidThrough"
                        label={t("VALID_THROUGH")}
                        placeholder="MM / YY"
                        name="creditCardValidThrough"
                        autoComplete="off"
                        value={creditCardValidThrough}
                        InputProps={{ readOnly: readOnly }}
                        required
                        onChange={(event) => {
                            setDirty(true);
                            setCreditCardValidThrough(event.target.value)
                        }}
                    />
                </Grid>
            )}

            {item.type === "credit_card" && (
                <Grid item xs={6} sm={6} md={6}>
                    <TextFieldCreditCardCVC
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="creditCardCVC"
                        label={t("CVC")}
                        placeholder="123"
                        name="creditCardCVC"
                        autoComplete="off"
                        value={creditCardCVC}
                        InputProps={{ readOnly: readOnly }}
                        required
                        onChange={(event) => {
                            setDirty(true);
                            setCreditCardCVC(event.target.value)
                        }}
                    />
                </Grid>
            )}

            {item.type === "credit_card" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="creditCardPIN"
                        label={t("PIN")}
                        placeholder="123"
                        name="creditCardPIN"
                        autoComplete="off"
                        value={creditCardPIN}
                        onChange={(event) => {
                            setDirty(true);
                            //check whether our string only contains numbers
                            const pattern = new RegExp('^[0-9]*$');
                            if (!pattern.test(event.target.value)) {
                                return;
                            }
                            setCreditCardPIN(event.target.value);
                        }}
                        InputProps={{
                            readOnly: readOnly,
                            type: showPin ? "text" : "password",
                            classes: {
                                input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                            },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        className={classes.iconButton}
                                        aria-label="menu"
                                        onClick={(event) => {
                                            setAnchorEl(event.currentTarget);
                                        }}
                                        size="large">
                                        <MenuOpenIcon fontSize="small" />
                                    </IconButton>
                                    <Menu
                                        id="simple-menu"
                                        anchorEl={anchorEl}
                                        keepMounted
                                        open={Boolean(anchorEl)}
                                        onClose={handleClose}
                                    >
                                        <MenuItem onClick={(event) => {
                                            handleClose();
                                            setShowPin(!showPin);
                                        }}>
                                            <ListItemIcon className={classes.listItemIcon}>
                                                <VisibilityOffIcon className={classes.icon} fontSize="small" />
                                            </ListItemIcon>
                                            <Typography variant="body2" noWrap>
                                                {t("SHOW_OR_HIDE_PIN")}
                                            </Typography>
                                        </MenuItem>
                                        <MenuItem onClick={onCopyPIN}>
                                            <ListItemIcon className={classes.listItemIcon}>
                                                <ContentCopy className={classes.icon} fontSize="small" />
                                            </ListItemIcon>
                                            <Typography variant="body2" noWrap>
                                                {t("COPY_PIN")}
                                            </Typography>
                                        </MenuItem>
                                    </Menu>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
            )}

            {item.type === "credit_card" && renderAddButton}

            {item.type === "credit_card" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="creditCardNotes"
                        label={t("NOTES")}
                        name="creditCardNotes"
                        autoComplete="off"
                        value={creditCardNotes}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setCreditCardNotes(event.target.value);
                        }}
                        multiline
                        minRows={3}
                        maxRows={32}
                    />
                </Grid>
            )}



            {item.type === "ssh_own_key" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="sshOwnKeyTitle"
                        label={t("TITLE")}
                        name="sshOwnKeyTitle"
                        autoComplete="off"
                        value={sshOwnKeyTitle}
                        InputProps={{ readOnly: readOnly }}
                        required
                        onChange={(event) => {
                            setDirty(true);
                            setSshOwnKeyTitle(event.target.value);
                        }}
                    />
                </Grid>
            )}
            {item.type === "ssh_own_key" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="sshOwnKeyPublic"
                        label={t("PUBLIC_KEY")}
                        name="sshOwnKeyPublic"
                        autoComplete="off"
                        value={sshOwnKeyPublic}
                        InputProps={{
                            readOnly: readOnly,
                            classes: {
                                input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                            },
                        }}
                        required
                        onChange={(event) => {
                            setDirty(true);
                            setSshOwnKeyPublic(event.target.value);
                        }}
                        multiline
                        minRows={3}
                        maxRows={10}
                    />
                </Grid>
            )}
            {item.type === "ssh_own_key" && (
                <Grid item xs={12} sm={12} md={12}>

                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="sshOwnKeyPrivate"
                        label={t("PRIVATE_KEY")}
                        name="sshOwnKeyPrivate"
                        autoComplete="off"
                        value={sshOwnKeyPrivate}
                        required
                        onChange={(event) => {
                            setDirty(true);
                            setSshOwnKeyPrivate(event.target.value);
                        }}
                        multiline={showPassword}
                        minRows={3}
                        maxRows={10}
                        InputProps={{
                            readOnly: readOnly,
                            type: showPassword ? "text" : "password",
                            classes: {
                                input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                            },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        className={classes.iconButton}
                                        aria-label="menu"
                                        onClick={(event) => {
                                            setAnchorEl(event.currentTarget);
                                        }}
                                        size="large">
                                        <MenuOpenIcon fontSize="small" />
                                    </IconButton>
                                    <Menu
                                        id="simple-menu"
                                        anchorEl={anchorEl}
                                        keepMounted
                                        open={Boolean(anchorEl)}
                                        onClose={handleClose}
                                    >
                                        <MenuItem onClick={onShowHidePassword}>
                                            <ListItemIcon className={classes.listItemIcon}>
                                                <VisibilityOffIcon className={classes.icon} fontSize="small" />
                                            </ListItemIcon>
                                            <Typography variant="body2" noWrap>
                                                {t("SHOW_OR_HIDE_PASSWORD")}
                                            </Typography>
                                        </MenuItem>
                                        <MenuItem onClick={onCopyPrivateKey}>
                                            <ListItemIcon className={classes.listItemIcon}>
                                                <ContentCopy className={classes.icon} fontSize="small" />
                                            </ListItemIcon>
                                            <Typography variant="body2" noWrap>
                                                {t("COPY_PRIVATE_KEY")}
                                            </Typography>
                                        </MenuItem>
                                    </Menu>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
            )}

            {item.type === "ssh_own_key" && renderAddButton}

            {item.type === "ssh_own_key" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="sshOwnKeyNotes"
                        label={t("NOTES")}
                        name="sshOwnKeyNotes"
                        autoComplete="off"
                        value={sshOwnKeyNotes}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setSshOwnKeyNotes(event.target.value);
                        }}
                        multiline
                        minRows={3}
                        maxRows={32}
                    />
                </Grid>
            )}





            {item.type === "mail_gpg_own_key" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="mailGpgOwnKeyTitle"
                        label={t("TITLE")}
                        name="mailGpgOwnKeyTitle"
                        autoComplete="off"
                        value={mailGpgOwnKeyTitle}
                        InputProps={{ readOnly: readOnly }}
                        required
                        onChange={(event) => {
                            setDirty(true);
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
                        margin="dense" size="small"
                        id="mailGpgOwnKeyEmail"
                        label={t("EMAIL")}
                        name="mailGpgOwnKeyEmail"
                        autoComplete="off"
                        value={mailGpgOwnKeyEmail}
                        InputProps={{ readOnly: readOnly }}
                        required
                        onChange={(event) => {
                            setDirty(true);
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
                        margin="dense" size="small"
                        id="mailGpgOwnKeyName"
                        label={t("NAME")}
                        name="mailGpgOwnKeyName"
                        autoComplete="off"
                        value={mailGpgOwnKeyName}
                        InputProps={{ readOnly: readOnly }}
                        required
                        onChange={(event) => {
                            setDirty(true);
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
                        margin="dense" size="small"
                        id="mailGpgOwnKeyPublic"
                        label={t("PUBLIC_KEY")}
                        name="mailGpgOwnKeyPublic"
                        autoComplete="off"
                        value={mailGpgOwnKeyPublic}
                        InputProps={{
                            readOnly: readOnly,
                            classes: {
                                input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                            },
                        }}
                        required
                        onChange={(event) => {
                            setDirty(true);
                            setMailGpgOwnKeyPublic(event.target.value);
                        }}
                        disabled
                        multiline
                        minRows={3}
                        maxRows={10}
                    />
                </Grid>
            )}
            {item.type === "mail_gpg_own_key" && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="mailGpgOwnKeyPrivate"
                        label={t("PRIVATE_KEY")}
                        name="mailGpgOwnKeyPrivate"
                        autoComplete="off"
                        value={mailGpgOwnKeyPrivate}
                        required
                        onChange={(event) => {
                            setDirty(true);
                            setMailGpgOwnKeyPrivate(event.target.value);
                        }}
                        disabled
                        multiline={showPassword}
                        minRows={3}
                        maxRows={10}
                        InputProps={{
                            readOnly: readOnly,
                            type: showPassword ? "text" : "password",
                            classes: {
                                input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                            },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        className={classes.iconButton}
                                        aria-label="menu"
                                        onClick={(event) => {
                                            setAnchorEl(event.currentTarget);
                                        }}
                                        size="large">
                                        <MenuOpenIcon fontSize="small" />
                                    </IconButton>
                                    <Menu
                                        id="simple-menu"
                                        anchorEl={anchorEl}
                                        keepMounted
                                        open={Boolean(anchorEl)}
                                        onClose={handleClose}
                                    >
                                        <MenuItem onClick={onShowHidePassword}>
                                            <ListItemIcon className={classes.listItemIcon}>
                                                <VisibilityOffIcon className={classes.icon} fontSize="small" />
                                            </ListItemIcon>
                                            <Typography variant="body2" noWrap>
                                                {t("SHOW_OR_HIDE_PASSWORD")}
                                            </Typography>
                                        </MenuItem>
                                        <MenuItem onClick={onCopyPrivateKey}>
                                            <ListItemIcon className={classes.listItemIcon}>
                                                <ContentCopy className={classes.icon} fontSize="small" />
                                            </ListItemIcon>
                                            <Typography variant="body2" noWrap>
                                                {t("COPY_PRIVATE_KEY")}
                                            </Typography>
                                        </MenuItem>
                                    </Menu>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
            )}
            {item.type === "mail_gpg_own_key" && (
                <Grid item xs={12} sm={12} md={12}>
                    <Button
                        onClick={() => {
                            setEncryptMessageDialogOpen(true);
                            setEncryptSecretId(item.secret_id);
                        }}
                    >
                        {t("ENCRYPT_MESSAGE")}
                    </Button>
                    <Button onClick={() => setDecryptMessageDialogOpen(true)}>{t("DECRYPT_MESSAGE")}</Button>
                </Grid>
            )}

            {(!item.share_rights || !item.share_rights.read) && (
                <Grid item xs={12} sm={12} md={12} className={classes.right}>
                    <MuiAlert
                        severity="error"
                    >
                        {t("PERMISSIONS_TO_ACCESS_THIS_ENTRY_HAVE_BEEN_DENIED")}
                    </MuiAlert>
                </Grid>
            )}

            {tags.length > 0 && (
                <Grid item xs={12} sm={12} md={12} className={classes.right}>
                    <div className={classes.chipContainer}>
                        {tags.map((tag, index) => (
                            <Chip
                                key={index}
                                label={tag}
                                onDelete={readOnly ? undefined : () => {
                                    setTags(tags.filter((t) => t !== tag));
                                }}
                            />
                        ))}
                    </div>
                </Grid>
            )}


            {item.share_rights && item.share_rights.read  && (
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
            )}

            {item.type === "passkey" && showAdvanced && (
                <Grid item xs={12} sm={12} md={12}>
                    <Checkbox
                        checked={passkeyAutoSubmit}
                        onChange={(event) => {
                            setDirty(true);
                            setPasskeyAutoSubmit(event.target.checked);
                        }}
                        checkedIcon={<Check className={classes.checkedIcon} />}
                        icon={<Check className={classes.uncheckedIcon} />}
                        classes={{
                            checked: classes.checked,
                        }}
                    />{" "}
                    {t("DISCOVERABLE")}
                </Grid>
            )}

            {item.type === "website_password" && showAdvanced && (
                <Grid item xs={6} sm={6} md={6}>
                    <Checkbox
                        checked={websitePasswordAutoSubmit}
                        onChange={(event) => {
                            setDirty(true);
                            setWebsitePasswordAutoSubmit(event.target.checked);
                        }}
                        checkedIcon={<Check className={classes.checkedIcon} />}
                        icon={<Check className={classes.uncheckedIcon} />}
                        disabled={readOnly}
                        classes={{
                            checked: classes.checked,
                        }}
                    />{" "}
                    {t("AUTOMATIC_SUBMIT")}
                </Grid>
            )}

            {item.type === "website_password" && showAdvanced && (
                <Grid item xs={6} sm={6} md={6}>
                    <Checkbox
                        checked={websitePasswordAllowHttp}
                        onChange={(event) => {
                            setDirty(true);
                            setWebsitePasswordAllowHttp(event.target.checked);
                        }}
                        checkedIcon={<Check className={classes.checkedIcon} />}
                        icon={<Check className={classes.uncheckedIcon} />}
                        disabled={readOnly}
                        classes={{
                            checked: classes.checked,
                        }}
                    />{" "}
                    {t("ALLOW_HTTP")}
                </Grid>
            )}
            {item.type === "website_password" && showAdvanced && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="websitePasswordUrlFilter"
                        label={t("DOMAIN_FILTER")}
                        helperText={t("URL_FILTER_EG")}
                        name="websitePasswordUrlFilter"
                        autoComplete="off"
                        value={websitePasswordUrlFilter}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
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
                        margin="dense" size="small"
                        id="bookmarkUrlFilter"
                        label={t("DOMAIN_FILTER")}
                        helperText={t("URL_FILTER_EG")}
                        name="bookmarkUrlFilter"
                        autoComplete="off"
                        value={bookmarkUrlFilter}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
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
                        margin="dense" size="small"
                        id="callbackUrl"
                        label={t("CALLBACK_URL")}
                        helperText={t("CALLBACK_URL_PLACEHOLDER")}
                        name="callbackUrl"
                        autoComplete="off"
                        value={callbackUrl}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
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
                        margin="dense" size="small"
                        id="callbackUser"
                        label={t("CALLBACK_USER")}
                        name="callbackUser"
                        autoComplete="off"
                        value={callbackUser}
                        InputProps={{ readOnly: readOnly }}
                        onChange={(event) => {
                            setDirty(true);
                            setCallbackUser(event.target.value);
                        }}
                    />
                </Grid>
            )}
            {hasCallback && showAdvanced && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextFieldColored
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="callbackPass"
                        label={t("CALLBACK_PASS")}
                        name="callbackPass"
                        autoComplete="off"
                        value={callbackPass}
                        onChange={(event) => {
                            setDirty(true);
                            setCallbackPass(event.target.value);
                        }}
                        InputProps={{
                            readOnly: readOnly,
                            type: showPassword ? "text" : "password",
                            classes: {
                                input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                            },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                        size="large">
                                        {showPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    {!!callbackPass && (<LinearProgress variant="determinate" value={cryptoLibrary.calculatePasswordStrengthInPercent(callbackPass)} />)}
                </Grid>
            )}

            {!hideLinkToEntry && showAdvanced && (
                <Grid item xs={12} sm={12} md={12}>
                    {t("ENTRY_LINK")}: <a href={webClient + "index.html#!/datastore/search/" + item.id}>{item.id}</a>
                </Grid>
            )}

            {createLinkShareOpen && (
                <DialogCreateLinkShare
                    open={createLinkShareOpen}
                    onClose={() => setCreateLinkShareOpen(false)}
                    item={item}
                />
            )}

            {addTotpOpen && (
                <DialogAddTotp
                    open={addTotpOpen}
                    onClose={(
                        totpPeriod,
                        totpAlgorithm,
                        totpDigits,
                        totpCode,
                    ) => {
                        setDirty(true);
                        setWebsitePasswordTotpPeriod(totpPeriod);
                        setWebsitePasswordTotpAlgorithm(totpAlgorithm);
                        setWebsitePasswordTotpDigits(totpDigits);
                        setWebsitePasswordTotpCode(totpCode);
                        setAddTotpOpen(false)
                        setTriggerAutoSave(triggerAutoSave + 1)
                    }}
                />
            )}

            {addTagOpen && (
                <DialogAddTag
                    open={addTagOpen}
                    onClose={(
                        newTag,
                    ) => {
                        if (newTag) {
                            setDirty(true);
                            setTags([...tags, newTag]);
                        }
                        setAddTagOpen(false)
                    }}
                />
            )}

            {addCustomFieldOpen && (
                <DialogAddCustomField
                    open={addCustomFieldOpen}
                    onClose={(customField) => {
                        if (customField) {
                            setDirty(true);
                            setAddCustomFieldOpen(false);
                            setCustomFields([...customFields, customField]);
                        } else {
                            setAddCustomFieldOpen(false);
                        }
                    }}
                />
            )}

            {editCustomFieldOpenIndex !== null && (
                <DialogEditCustomField
                    open={editCustomFieldOpenIndex !== null}
                    onClose={(customField) => {
                        if (customField) {
                            setDirty(true);
                            setEditCustomFieldOpenIndex(null);
                            setCustomFields(customFields.map((field, i) => i === editCustomFieldOpenIndex ? customField : field));
                        } else {
                            setEditCustomFieldOpenIndex(null);
                        }
                    }}
                    customField={customFields[editCustomFieldOpenIndex]}
                />
            )}

            {generatePasswordDialogOpen && (
                <DialogGeneratePassword
                    open={generatePasswordDialogOpen}
                    onClose={() => setGeneratePasswordDialogOpen(false)}
                    onConfirm={onPasswordGenerated}
                />
            )}
        </Grid>
    )

    if (inline) {
        return (
            <Paper square  className={classes.inlineEditPaper}>
                <AppBar elevation={0} position="static" color="default">
                    <Toolbar
                        className={classes.toolbarRoot}>{title}</Toolbar>
                </AppBar>
                <div className={classes.root}>
                    {content}
                </div>
                <DialogActions>
                    {actions}
                </DialogActions>
            </Paper>
        )
    } else {
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

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                    }}
                    name="editEntry"
                    autoComplete="off"
                >
                    <DialogTitle id="alert-dialog-title">
                        {title}
                    </DialogTitle>
                    <DialogContent>
                        {content}
                    </DialogContent>
                    <DialogActions>
                        {actions}
                    </DialogActions>
                </form>
            </Dialog>
        )
    }

};

DialogEditEntry.defaultProps = {
    hideLinkToEntry: false,
    hideShowHistory: false,
    hideAddTOTP: false, 
    hideAddCustomField: false,
    hideAddTag: false,
    hideMoreMenu: false,
    linkDirectly: false,
    inline: false,
};

DialogEditEntry.propTypes = {
    onClose: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired,
    onEdit: PropTypes.func,
    onDeleteItem: PropTypes.func,
    open: PropTypes.bool.isRequired,
    item: PropTypes.object.isRequired,
    hideLinkToEntry: PropTypes.bool,
    hideShowHistory: PropTypes.bool,
    hideAddTOTP: PropTypes.bool,
    hideAddCustomField: PropTypes.bool,
    hideAddTag: PropTypes.bool,
    hideMoreMenu: PropTypes.bool,
    linkDirectly: PropTypes.bool,
    inline: PropTypes.bool,
};

export default DialogEditEntry;
