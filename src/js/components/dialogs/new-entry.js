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
import Box from "@material-ui/core/Box";
import LinearProgress from "@material-ui/core/LinearProgress";

import helperService from "../../services/helper";
import cryptoLibrary from "../../services/crypto-library";
import offlineCache from "../../services/offline-cache";
import secretService from "../../services/secret";
import datastorePasswordService from "../../services/datastore-password";
import browserClientService from "../../services/browser-client";
import notification from "../../services/notification";
import fileTransferService from "../../services/file-transfer";
import ContentCopy from "../icons/ContentCopy";
import TotpCircle from "../totp-circle";
import DialogDecryptGpgMessage from "./decrypt-gpg-message";
import DialogEncryptGpgMessage from "./encrypt-gpg-message";
import SelectFieldEntryType from "../select-field/entry-type";
import SelectFieldTotpAlgorithm from "../select-field/totp-algorithm";
import DialogGenerateNewGpgKey from "./generate-new-gpg-key";
import DialogImportGpgKeyAsText from "./import-gpg-key-as-text";
import DialogGenerateNewSshKey from "./generate-new-ssh-key";
import DialogImportSshKeyAsText from "./import-ssh-key-as-text";
import SelectFieldFileDestination from "../select-field/file-destination";
import GridContainerErrors from "../grid-container-errors";
import store from "../../services/store";
import TextFieldCreditCardNumber from "../text-field/credit-card-number";
import TextFieldCreditCardValidThrough from "../text-field/credit-card-valid-through";
import TextFieldCreditCardCVC from "../text-field/credit-card-cvc";

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
    const { open, onClose, parentDatastoreId, parentShareId } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const offline = offlineCache.isActive();

    const [importGpgKeyAsTextDialogOpen, setImportGpgKeyAsTextDialogOpen] = useState(false);
    const [generateNewGpgKeyDialogOpen, setGenerateNewGpgKeyDialogOpen] = useState(false);

    const [importSshKeyAsTextDialogOpen, setImportSshKeyAsTextDialogOpen] = useState(false);
    const [generateNewSshKeyDialogOpen, setGenerateNewSshKeyDialogOpen] = useState(false);

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
    const [fileName, setFileName] = useState("");
    const [file, setFile] = useState(null);
    const [fileDestination, setFileDestination] = useState(null);
    const [uploadStepComplete, setUploadStepComplete] = useState("");

    const [sshOwnKeyTitle, setSshOwnKeyTitle] = useState("");
    const [sshOwnKeyPublic, setSshOwnKeyPublic] = useState("");
    const [sshOwnKeyPrivate, setSshOwnKeyPrivate] = useState("");

    const [creditCardTitle, setCreditCardTitle] = useState("");
    const [creditCardNumber, setCreditCardNumber] = useState("");
    const [creditCardCVC, setCreditCardCVC] = useState("");
    const [creditCardName, setCreditCardName] = useState("");
    const [creditCardValidThrough, setCreditCardValidThrough] = useState("");
    const [creditCardNotes, setCreditCardNotes] = useState("");

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
    const [errors, setErrors] = useState([]);

    const [processing, setProcessing] = React.useState(false);
    const [percentageComplete, setPercentageComplete] = React.useState(0);
    let openRequests = 0;
    let closedRequests = 0;

    const [type, setType] = useState("website_password");

    const hasCallback = ["file"].indexOf(type) === -1 &&  // files have no callbacks
        !store.getState().server.disableCallbacks;

    const isValidWebsitePassword = Boolean(websitePasswordTitle);
    const isValidApplicationPassword = Boolean(applicationPasswordTitle);
    const isValidBookmark = Boolean(bookmarkTitle) && (!bookmarkUrl || helperService.isValidUrl(bookmarkUrl));
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
    const isValidFile = Boolean(fileTitle) && Boolean(file);
    const canSave =
        (type === "website_password" && isValidWebsitePassword) ||
        (type === "application_password" && isValidApplicationPassword) ||
        (type === "bookmark" && isValidBookmark) ||
        (type === "note" && isValidNote) ||
        (type === "totp" && isValidTotp) ||
        (type === "environment_variables" && isValidEnvironmentVariables) ||
        (type === "ssh_own_key" && isValidSshOwnKey) ||
        (type === "credit_card" && isValidCreditCard) ||
        (type === "mail_gpg_own_key" && isValidMailGpgOwnKey) ||
        (type === "file" && isValidFile);
    const hasAdvanced = type !== "file";

    const onFileChange = (event) => {
        event.preventDefault();

        if (!fileTitle && event.target.files[0].name) {
            setFileTitle(event.target.files[0].name);
        }
        setFileName(event.target.files[0].name);
        setFile(event.target.files[0]);
    };

    /**
     * Uploads a file and returns a promise with all the file upload details like chunks, file id and so on
     *
     * @param linkId
     *
     * @returns {Promise<{file_secret_key: string, file_id, file_chunks: unknown}>|Promise<void>}
     */
    const fileUpload = (linkId) => {
        setProcessing(true);
        openRequests = 0;
        closedRequests = 0;
        setPercentageComplete(0);
        const fileSecretKey = cryptoLibrary.generateSecretKey();
        //const fileChunkSize = 8*1024*1024; // in bytes. e.g.   8*1024*1024 Bytes =   8 MB
        const fileChunkSize = 128 * 1024 * 1024; // in bytes. e.g. 128*1024*1024 Bytes = 128 MB

        let fileRepositoryId = undefined;
        let shardId = undefined;
        let fileRepository = undefined;
        let shard = undefined;

        if (fileDestination["destination_type"] === "file_repository") {
            fileRepositoryId = fileDestination["id"];
            fileRepository = fileDestination;
        }
        if (fileDestination["destination_type"] === "shard") {
            shardId = fileDestination["id"];
            shard = fileDestination;
        }

        /**
         * Uploads a file in chunks and returns the array of hashs
         *
         * @param shard
         * @param fileRepository
         * @param file
         * @param fileTransferId
         * @param {string} fileTransferSecretKey The hex encoded secret key for the file transfer
         * @param fileSecretKey
         * @param fileChunkSize
         *
         * @returns {Promise} Promise with the chunks uploaded
         */
        function multiChunkUpload(
            shard,
            fileRepository,
            file,
            fileTransferId,
            fileTransferSecretKey,
            fileSecretKey,
            fileChunkSize
        ) {
            const onLoadEnd = function (bytes, chunkSize, fileSecretKey, chunkPosition, resolve) {
                cryptoLibrary.encryptFile(bytes, fileSecretKey).then(function (encryptedBytes) {
                    setUploadStepComplete("HASHING_FILE_CHUNK");
                    closedRequests = closedRequests + 1;
                    setPercentageComplete(Math.round((closedRequests / openRequests) * 1000) / 10);

                    const hashChecksum = cryptoLibrary.sha512(encryptedBytes);

                    setUploadStepComplete("UPLOADING_FILE_CHUNK");
                    closedRequests = closedRequests + 1;
                    setPercentageComplete(Math.round((closedRequests / openRequests) * 1000) / 10);

                    fileTransferService
                        .upload(
                            new Blob([encryptedBytes], { type: "application/octet-stream" }),
                            fileTransferId,
                            fileTransferSecretKey,
                            chunkSize,
                            chunkPosition,
                            shard,
                            fileRepository,
                            hashChecksum
                        )
                        .then(function () {
                            return resolve({
                                chunk_position: chunkPosition,
                                hash_checksum: hashChecksum,
                            });
                        }, function () {
                            setErrors(["UPLOAD_FAILED"])
                        });
                });
            };

            const readFileChunk = function (
                file,
                fileSliceStart,
                chunkSize,
                onLoadEnd,
                fileSecretKey,
                chunkPosition,
                resolve
            ) {
                const fileReader = new FileReader();

                fileReader.onloadend = function (event) {
                    const bytes = new Uint8Array(event.target.result);
                    onLoadEnd(bytes, chunkSize, fileSecretKey, chunkPosition, resolve);
                };

                const file_slice = file.slice(fileSliceStart, fileSliceStart + chunkSize);

                fileReader.readAsArrayBuffer(file_slice);
            };

            let chunkPosition = 1;
            let fileSliceStart = 0;
            const chunks = {};
            const maxChunks = Math.ceil(file.size / fileChunkSize);

            openRequests = maxChunks * 3;

            return new Promise(function (resolve, reject) {
                // new sequential approach
                function readNextChunk() {
                    const chunkSize = Math.min(fileChunkSize, file.size - fileSliceStart);
                    if (chunkSize === 0) {
                        return resolve(chunks);
                    }

                    setUploadStepComplete("ENCRYPTING_FILE_CHUNK");
                    closedRequests = closedRequests + 1;
                    setPercentageComplete(Math.round((closedRequests / openRequests) * 1000) / 10);

                    function onReadFileChunkComplete(chunk) {
                        fileSliceStart = fileSliceStart + chunkSize;
                        chunkPosition = chunkPosition + 1;
                        chunks[chunk["chunk_position"]] = chunk["hash_checksum"];
                        readNextChunk();
                    }

                    readFileChunk(
                        file,
                        fileSliceStart,
                        chunkSize,
                        onLoadEnd,
                        fileSecretKey,
                        chunkPosition,
                        onReadFileChunkComplete
                    );
                }

                readNextChunk();
            });
        }

        const onSuccess = function (data) {
            return multiChunkUpload(
                shard,
                fileRepository,
                file,
                data["file_transfer_id"],
                data["file_transfer_secret_key"],
                fileSecretKey,
                fileChunkSize
            ).then(function (chunks) {
                const uploadResult = {
                    file_chunks: chunks,
                    file_id: data["file_id"],
                    file_secret_key: fileSecretKey,
                    file_size: file.size,
                };
                if (shard && shard.hasOwnProperty("id")) {
                    uploadResult["file_shard_id"] = shard["id"];
                }
                if (fileRepository && fileRepository.hasOwnProperty("id")) {
                    uploadResult["file_repository_id"] = fileRepository["id"];
                }

                setProcessing(false);
                openRequests = 0;
                closedRequests = 0;
                setPercentageComplete(0);

                return uploadResult;
            });
        };

        const onError = function (data) {
            if (data.hasOwnProperty("non_field_errors") && data.non_field_errors.length > 0) {
                return Promise.reject(data.non_field_errors);
            } else {
                console.log(data);
                alert("Error, should not happen.");
            }
        };

        const chunkCount = Math.ceil(file.size / fileChunkSize);

        if (file.size === 0) {
            return Promise.resolve();
        }

        return fileTransferService
            .createFile(
                shardId,
                fileRepositoryId,
                file.size + chunkCount * 40,
                chunkCount,
                linkId,
                parentDatastoreId,
                parentShareId
            )
            .then(onSuccess, onError);
    };

    const onCreate = (event) => {
        const item = {
            id: cryptoLibrary.generateUuid(),
            type: type,
            parent_datastore_id: parentDatastoreId,
            parent_share_id: parentShareId,
        };
        const secretObject = {};

        if (item.type === "website_password") {
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

        if (item.type === "application_password") {
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

        if (item.type === "file") {
            item["name"] = fileTitle;
            item["file_title"] = fileTitle;
        }

        if (item.type === "ssh_own_key") {
            item["name"] = sshOwnKeyTitle;
            secretObject["ssh_own_key_title"] = sshOwnKeyTitle;
            if (sshOwnKeyPublic) {
                secretObject["ssh_own_key_public"] = sshOwnKeyPublic;
            }
            secretObject["ssh_own_key_private"] = sshOwnKeyPrivate;
        }

        if (item.type === "credit_card") {
            item["name"] = creditCardTitle;
            secretObject["credit_card_title"] = creditCardTitle;
            if (creditCardNumber) {
                secretObject["credit_card_number"] = creditCardNumber;
            }
            if (creditCardCVC) {
                secretObject["credit_card_cvc"] = creditCardCVC;
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
        if (item.type === "file") {
            fileUpload(item["id"]).then((data) => {
                item["file_chunks"] = data.file_chunks;
                item["file_id"] = data.file_id;
                item["file_secret_key"] = data.file_secret_key;
                item["file_size"] = data.file_size;
                if (data.hasOwnProperty("file_shard_id")) {
                    item["file_shard_id"] = data.file_shard_id;
                }
                if (data.hasOwnProperty("file_repository_id")) {
                    item["file_repository_id"] = data.file_repository_id;
                }
                item["file_size"] = data.file_size;
                props.onCreate(item);
            });
        } else {
            const onError = function (result) {
                // pass
            };

            const onSuccess = function (data) {
                item["secret_id"] = data.secret_id;
                item["secret_key"] = data.secret_key;
                props.onCreate(item);
            };
            secretService
                .createSecret(
                    secretObject,
                    item.id,
                    parentDatastoreId,
                    parentShareId,
                    callbackUrl,
                    callbackUser,
                    callbackPass
                )
                .then(onSuccess, onError);
        }
    };

    const onShowHidePassword = (event) => {
        handleClose();
        setShowPassword(!showPassword);
    };

    const onCopyPassword = (event) => {
        handleClose();
        if (type === "website_password") {
            browserClientService.copyToClipboard(() => Promise.resolve(websitePasswordPassword));
        }
        if (type === "application_password") {
            browserClientService.copyToClipboard(() => Promise.resolve(applicationPasswordPassword));
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
    const onNewGpgKeysGenerated = (title, name, email, privateKey, publicKey) => {
        setGenerateNewGpgKeyDialogOpen(false);
        setMailGpgOwnKeyTitle(title);
        setMailGpgOwnKeyName(name);
        setMailGpgOwnKeyEmail(email);
        setMailGpgOwnKeyPrivate(privateKey);
        setMailGpgOwnKeyPublic(publicKey);
    };
    const onNewGpgKeyImported = (title, name, email, privateKey, publicKey) => {
        setImportGpgKeyAsTextDialogOpen(false);
        setMailGpgOwnKeyTitle(title);
        setMailGpgOwnKeyName(name);
        setMailGpgOwnKeyEmail(email);
        setMailGpgOwnKeyPrivate(privateKey);
        setMailGpgOwnKeyPublic(publicKey);
    };
    const onNewSshKeysGenerated = (title, privateKey, publicKey) => {
        setGenerateNewSshKeyDialogOpen(false);
        setSshOwnKeyTitle(title);
        setSshOwnKeyPrivate(privateKey);
        setSshOwnKeyPublic(publicKey);
    };
    const onNewSshKeyImported = (title, privateKey, publicKey) => {
        setImportSshKeyAsTextDialogOpen(false);
        setSshOwnKeyTitle(title);
        setSshOwnKeyPrivate(privateKey);
        setSshOwnKeyPublic(publicKey);
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
                            autoComplete="off"
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
                                autoComplete="off"
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
                                autoComplete="off"
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
                                autoComplete="off"
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
                                autoComplete="off"
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
                                            <IconButton
                                                className={classes.iconButton}
                                                aria-label="menu"
                                                onClick={openMenu}
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
                            {!!websitePasswordPassword && (<LinearProgress variant="determinate" value={cryptoLibrary.calculatePasswordStrengthInPercent(websitePasswordPassword)} />)}
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
                                autoComplete="off"
                                value={websitePasswordNotes}
                                onChange={(event) => {
                                    setWebsitePasswordNotes(event.target.value);
                                }}
                                multiline
                                minRows={3}
                                maxRows={32}
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
                                autoComplete="off"
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
                                autoComplete="off"
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
                                autoComplete="off"
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
                                            <IconButton
                                                className={classes.iconButton}
                                                aria-label="menu"
                                                onClick={openMenu}
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
                            {!!applicationPasswordPassword && (<LinearProgress variant="determinate" value={cryptoLibrary.calculatePasswordStrengthInPercent(applicationPasswordPassword)} />)}
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
                                autoComplete="off"
                                value={applicationPasswordNotes}
                                onChange={(event) => {
                                    setApplicationPasswordNotes(event.target.value);
                                }}
                                multiline
                                minRows={3}
                                maxRows={32}
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
                                autoComplete="off"
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
                                error={bookmarkUrl && !helperService.isValidUrl(bookmarkUrl)}
                                label={t("URL")}
                                name="bookmarkUrl"
                                autoComplete="off"
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
                                autoComplete="off"
                                value={bookmarkNotes}
                                onChange={(event) => {
                                    setBookmarkNotes(event.target.value);
                                }}
                                multiline
                                minRows={3}
                                maxRows={32}
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
                                autoComplete="off"
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
                                autoComplete="off"
                                value={noteNotes}
                                onChange={(event) => {
                                    setNoteNotes(event.target.value);
                                }}
                                multiline
                                minRows={3}
                                maxRows={32}
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
                                autoComplete="off"
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
                                autoComplete="off"
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
                                autoComplete="off"
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
                                autoComplete="off"
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
                                autoComplete="off"
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
                                            <IconButton
                                                className={classes.iconButton}
                                                aria-label="menu"
                                                onClick={onShowHidePassword}
                                            >
                                                <VisibilityOffIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    )}

                    {type === "totp" && (
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
                    {type === "totp" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="totpNotes"
                                label={t("NOTES")}
                                name="totpNotes"
                                autoComplete="off"
                                value={totpNotes}
                                onChange={(event) => {
                                    setTotpNotes(event.target.value);
                                }}
                                multiline
                                minRows={3}
                                maxRows={32}
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
                                autoComplete="off"
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
                                                    const newEnvs =
                                                        helperService.duplicateObject(environmentVariablesVariables);
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
                                                    const newEnvs =
                                                        helperService.duplicateObject(environmentVariablesVariables);
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
                                                    const newEnvs =
                                                        helperService.duplicateObject(environmentVariablesVariables);
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
                                autoComplete="off"
                                value={environmentVariablesNotes}
                                onChange={(event) => {
                                    setEnvironmentVariablesNotes(event.target.value);
                                }}
                                multiline
                                minRows={3}
                                maxRows={32}
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
                                autoComplete="off"
                                value={fileTitle}
                                required
                                onChange={(event) => {
                                    setFileTitle(event.target.value);
                                }}
                            />
                        </Grid>
                    )}

                    {type === "file" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <Grid item xs={12} sm={12} md={12}>
                                <SelectFieldFileDestination
                                    className={classes.textField}
                                    variant="outlined"
                                    margin="dense"
                                    id="fileDestination"
                                    label={t("TARGET_STORAGE")}
                                    error={!Boolean(fileDestination)}
                                    value={fileDestination}
                                    required
                                    onChange={(value) => {
                                        setFileDestination(value);
                                    }}
                                />
                            </Grid>
                        </Grid>
                    )}

                    {type === "file" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <Grid item xs={12} sm={12} md={12} style={{ marginBottom: "8px", marginTop: "8px" }}>
                                <Button variant="contained" disabled={processing} component="label">
                                    {fileName ? fileName : t("FILE")}
                                    <input type="file" hidden onChange={onFileChange} required />
                                </Button>
                            </Grid>
                        </Grid>
                    )}
                    {processing && (
                        <Grid item xs={12} sm={12} md={12} style={{ marginBottom: "8px", marginTop: "8px" }}>
                            <Box display="flex" alignItems="center">
                                <Box width="100%" mr={1}>
                                    <LinearProgress variant="determinate" value={percentageComplete} />
                                </Box>
                                <Box minWidth={35}>
                                    <span style={{ whiteSpace: "nowrap" }}>{percentageComplete} %</span>
                                </Box>
                            </Box>
                        </Grid>
                    )}

                    {type === "credit_card" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="creditCardTitle"
                                label={t("TITLE")}
                                name="creditCardTitle"
                                autoComplete="off"
                                value={creditCardTitle}
                                required
                                onChange={(event) => {
                                    setCreditCardTitle(event.target.value);
                                }}
                            />
                        </Grid>
                    )}

                    {type === "credit_card" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextFieldCreditCardNumber
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="creditCardNumber"
                                label={t("CREDIT_CARD_NUMBER")}
                                placeholder="1234 1234 1234 1234"
                                name="creditCardNumber"
                                autoComplete="off"
                                value={creditCardNumber}
                                required
                                onChange={(event) => {
                                    setCreditCardNumber(event.target.value);
                                }}
                            />

                        </Grid>
                    )}

                    {type === "credit_card" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="creditCardName"
                                label={t("NAME")}
                                name="creditCardName"
                                autoComplete="off"
                                value={creditCardName}
                                required
                                onChange={(event) => {
                                    setCreditCardName(event.target.value);
                                }}
                            />
                        </Grid>
                    )}

                    {type === "credit_card" && (
                        <Grid item xs={6} sm={6} md={6}>
                            <TextFieldCreditCardValidThrough
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="creditCardValidThrough"
                                label={t("VALID_THROUGH")}
                                placeholder="MM / YY"
                                name="creditCardValidThrough"
                                autoComplete="off"
                                value={creditCardValidThrough}
                                required
                                onChange={(event) => {
                                    setCreditCardValidThrough(event.target.value)
                                }}
                            />
                        </Grid>
                    )}

                    {type === "credit_card" && (
                        <Grid item xs={6} sm={6} md={6}>
                            <TextFieldCreditCardCVC
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="creditCardCVC"
                                label={t("CVC")}
                                placeholder="123"
                                name="creditCardCVC"
                                autoComplete="off"
                                value={creditCardCVC}
                                required
                                onChange={(event) => {
                                    setCreditCardCVC(event.target.value)
                                }}
                            />
                        </Grid>
                    )}

                    {type === "credit_card" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="creditCardNotes"
                                label={t("NOTES")}
                                name="creditCardNotes"
                                autoComplete="off"
                                value={creditCardNotes}
                                onChange={(event) => {
                                    setCreditCardNotes(event.target.value);
                                }}
                                multiline
                                minRows={3}
                                maxRows={32}
                            />
                        </Grid>
                    )}


                    {type === "ssh_own_key" && sshOwnKeyTitle && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="sshOwnKeyTitle"
                                label={t("TITLE")}
                                name="sshOwnKeyTitle"
                                autoComplete="off"
                                value={sshOwnKeyTitle}
                                required
                                onChange={(event) => {
                                    setSshOwnKeyTitle(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "ssh_own_key" && sshOwnKeyPublic && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="sshOwnKeyPublic"
                                label={t("PUBLIC_KEY")}
                                name="sshOwnKeyPublic"
                                autoComplete="off"
                                value={sshOwnKeyPublic}
                                required
                                disabled
                                multiline
                                minRows={3}
                                maxRows={10}
                            />
                        </Grid>
                    )}
                    {type === "ssh_own_key" && sshOwnKeyPrivate && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="sshOwnKeyPrivate"
                                label={t("PRIVATE_KEY")}
                                name="sshOwnKeyPrivate"
                                autoComplete="off"
                                value={sshOwnKeyPrivate}
                                required
                                disabled
                                multiline
                                minRows={3}
                                maxRows={10}
                            />
                        </Grid>
                    )}

                    {type === "ssh_own_key" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <Button
                                onClick={() => {
                                    setGenerateNewSshKeyDialogOpen(true);
                                }}
                            >
                                {t("GENERATE_NEW_SSH_KEY")}
                            </Button>
                            <Button onClick={() => setImportSshKeyAsTextDialogOpen(true)}>{t("IMPORT_AS_TEXT")}</Button>
                        </Grid>
                    )}

                    {type === "mail_gpg_own_key" && mailGpgOwnKeyTitle && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="mailGpgOwnKeyTitle"
                                label={t("TITLE")}
                                name="mailGpgOwnKeyTitle"
                                autoComplete="off"
                                value={mailGpgOwnKeyTitle}
                                required
                                onChange={(event) => {
                                    setMailGpgOwnKeyTitle(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "mail_gpg_own_key" && mailGpgOwnKeyEmail && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="mailGpgOwnKeyEmail"
                                label={t("EMAIL")}
                                name="mailGpgOwnKeyEmail"
                                autoComplete="off"
                                value={mailGpgOwnKeyEmail}
                                required
                                disabled
                            />
                        </Grid>
                    )}
                    {type === "mail_gpg_own_key" && mailGpgOwnKeyName && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="mailGpgOwnKeyName"
                                label={t("NAME")}
                                name="mailGpgOwnKeyName"
                                autoComplete="off"
                                value={mailGpgOwnKeyName}
                                required
                                disabled
                            />
                        </Grid>
                    )}
                    {type === "mail_gpg_own_key" && mailGpgOwnKeyPublic && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="mailGpgOwnKeyPublic"
                                label={t("PUBLIC_KEY")}
                                name="mailGpgOwnKeyPublic"
                                autoComplete="off"
                                value={mailGpgOwnKeyPublic}
                                required
                                disabled
                                multiline
                                minRows={3}
                                maxRows={10}
                            />
                        </Grid>
                    )}
                    {type === "mail_gpg_own_key" && mailGpgOwnKeyPrivate && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="mailGpgOwnKeyPrivate"
                                label={t("PRIVATE_KEY")}
                                name="mailGpgOwnKeyPrivate"
                                autoComplete="off"
                                value={mailGpgOwnKeyPrivate}
                                required
                                disabled
                                multiline
                                minRows={3}
                                maxRows={10}
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
                            <Button onClick={() => setImportGpgKeyAsTextDialogOpen(true)}>{t("IMPORT_AS_TEXT")}</Button>
                        </Grid>
                    )}

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

                    {hasAdvanced && (
                        <Grid item xs={12} sm={12} md={12} className={classes.right}>
                            <Button aria-label="settings" onClick={() => setShowAdvanced(!showAdvanced)}>
                                {t("ADVANCED")}
                            </Button>
                        </Grid>
                    )}

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
                                autoComplete="off"
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
                                autoComplete="off"
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
                                autoComplete="off"
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
                                autoComplete="off"
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
                                autoComplete="off"
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
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            {!!callbackPass && (<LinearProgress variant="determinate" value={cryptoLibrary.calculatePasswordStrengthInPercent(callbackPass)} />)}
                        </Grid>
                    )}
                    <GridContainerErrors errors={errors} setErrors={setErrors} />
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    disabled={processing}
                    onClick={() => {
                        onClose();
                    }}
                >
                    {t("CLOSE")}
                </Button>
                {!offline && props.onCreate && (
                    <Button onClick={onCreate} variant="contained" color="primary" disabled={!canSave || processing}>
                        {t("CREATE")}
                    </Button>
                )}
            </DialogActions>
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
            {importGpgKeyAsTextDialogOpen && (
                <DialogImportGpgKeyAsText
                    open={importGpgKeyAsTextDialogOpen}
                    onClose={() => setImportGpgKeyAsTextDialogOpen(false)}
                    onNewGpgKeyImported={onNewGpgKeyImported}
                />
            )}
            {generateNewGpgKeyDialogOpen && (
                <DialogGenerateNewGpgKey
                    open={generateNewGpgKeyDialogOpen}
                    onClose={() => setGenerateNewGpgKeyDialogOpen(false)}
                    onNewGpgKeysGenerated={onNewGpgKeysGenerated}
                />
            )}
            {importSshKeyAsTextDialogOpen && (
                <DialogImportSshKeyAsText
                    open={importSshKeyAsTextDialogOpen}
                    onClose={() => setImportSshKeyAsTextDialogOpen(false)}
                    onNewSshKeyImported={onNewSshKeyImported}
                />
            )}
            {generateNewSshKeyDialogOpen && (
                <DialogGenerateNewSshKey
                    open={generateNewSshKeyDialogOpen}
                    onClose={() => setGenerateNewSshKeyDialogOpen(false)}
                    onNewSshKeysGenerated={onNewSshKeysGenerated}
                />
            )}
        </Dialog>
    );
};

DialogNewEntry.propTypes = {
    onClose: PropTypes.func.isRequired,
    onCreate: PropTypes.func,
    open: PropTypes.bool.isRequired,
    parentDatastoreId: PropTypes.string,
    parentShareId: PropTypes.string,
};

export default DialogNewEntry;
