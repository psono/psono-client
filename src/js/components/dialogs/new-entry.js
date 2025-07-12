import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import { makeStyles } from '@mui/styles';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
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
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import Box from "@mui/material/Box";
import EditIcon from "@mui/icons-material/Edit";
import LinearProgress from "@mui/material/LinearProgress";
import Divider from "@mui/material/Divider";

import helperService from "../../services/helper";
import cryptoLibrary from "../../services/crypto-library";
import offlineCache from "../../services/offline-cache";
import secretService from "../../services/secret";
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
import { getStore } from "../../services/store";
import TextFieldCreditCardNumber from "../text-field/credit-card-number";
import TextFieldCreditCardValidThrough from "../text-field/credit-card-valid-through";
import TextFieldCreditCardCVC from "../text-field/credit-card-cvc";
import {useHotkeys} from "react-hotkeys-hook";
import converterService from "../../services/converter";
import DialogGeneratePassword from "./generate-password";
import DialogAddCustomField from "./add-custom-field";
import DialogAddTag from "./add-tag";
import DialogEditCustomField from "./edit-custom-field";
import TextFieldTotp from "../text-field/totp";
import DialogAddTotp from "./add-totp";
import Chip from "@mui/material/Chip";
import TextFieldColored from "../text-field/colored";

const useStyles = makeStyles((theme) => ({
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
    chipContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: theme.spacing(1),
        marginTop: theme.spacing(1),
    },
}));

const DialogNewEntry = (props) => {
    const { open, onClose, parentDatastoreId, parentShareId } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const offline = offlineCache.isActive();

    const [addCustomFieldOpen, setAddCustomFieldOpen] = useState(false);
    const [editCustomFieldOpenIndex, setEditCustomFieldOpenIndex] = useState(null);
    const [addTotpOpen, setAddTotpOpen] = useState(false);
    const [addTagOpen, setAddTagOpen] = useState(false);
    const [importGpgKeyAsTextDialogOpen, setImportGpgKeyAsTextDialogOpen] = useState(false);
    const [generateNewGpgKeyDialogOpen, setGenerateNewGpgKeyDialogOpen] = useState(false);
    const [generatePasswordDialogOpen, setGeneratePasswordDialogOpen] = useState(false);

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
    const [websitePasswordAllowHttp, setWebsitePasswordAllowHttp] = useState(false);
    const [websitePasswordUrlFilter, setWebsitePasswordUrlFilter] = useState("");
    const [websitePasswordTotpPeriod, setWebsitePasswordTotpPeriod] = useState(30);
    const [websitePasswordTotpAlgorithm, setWebsitePasswordTotpAlgorithm] = useState("SHA1");
    const [websitePasswordTotpDigits, setWebsitePasswordTotpDigits] = useState(6);
    const [websitePasswordTotpCode, setWebsitePasswordTotpCode] = useState("");

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
    const [fileName, setFileName] = useState("");
    const [file, setFile] = useState(null);
    const [fileDestination, setFileDestination] = useState(null);
    const [uploadStepComplete, setUploadStepComplete] = useState("");

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
    const [creditCardName, setCreditCardName] = useState("");
    const [creditCardValidThrough, setCreditCardValidThrough] = useState("");
    const [creditCardPIN, setCreditCardPIN] = useState("");
    const [creditCardNotes, setCreditCardNotes] = useState("");

    const [mailGpgOwnKeyTitle, setMailGpgOwnKeyTitle] = useState("");
    const [mailGpgOwnKeyEmail, setMailGpgOwnKeyEmail] = useState("");
    const [mailGpgOwnKeyName, setMailGpgOwnKeyName] = useState("");
    const [mailGpgOwnKeyPublic, setMailGpgOwnKeyPublic] = useState("");
    const [mailGpgOwnKeyPrivate, setMailGpgOwnKeyPrivate] = useState("");

    const [anchorEl, setAnchorEl] = React.useState(null);
    const [anchorEl2, setAnchorEl2] = React.useState(null);
    const [anchorEl3, setAnchorEl3] = React.useState(null);
    const [anchorElsCustomFields, setAnchorElsCustomFields] = React.useState({});

    const [callbackUrl, setCallbackUrl] = useState("");
    const [callbackPass, setCallbackPass] = useState("");
    const [callbackUser, setCallbackUser] = useState("");
    const [customFields, setCustomFields] = useState([]);
    const [tags, setTags] = useState([]);

    const [showPassword, setShowPassword] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [errors, setErrors] = useState([]);

    const [processing, setProcessing] = React.useState(false);
    const [percentageComplete, setPercentageComplete] = React.useState(0);
    let openRequests = 0;
    let closedRequests = 0;

    const [type, setType] = useState("website_password");

    const hasCallback = ["file", "elster_certificate"].indexOf(type) === -1 &&  // files have no callbacks
        !getStore().getState().server.disableCallbacks;

    const isValidWebsitePassword = Boolean(websitePasswordTitle);
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
    const isValidFile = Boolean(fileTitle) && Boolean(file);
    const isValidElsterCertificate =
        Boolean(elsterCertificateTitle) &&
        Boolean(elsterCertificateFileContent) &&
        Boolean(elsterCertificatePassword);
    const canSave =
        (type === "website_password" && isValidWebsitePassword) ||
        (type === "application_password" && isValidApplicationPassword) ||
        (type === "bookmark" && isValidBookmark) ||
        (type === "identity" && isValidIdentity) ||
        (type === "note" && isValidNote) ||
        (type === "totp" && isValidTotp) ||
        (type === "environment_variables" && isValidEnvironmentVariables) ||
        (type === "ssh_own_key" && isValidSshOwnKey) ||
        (type === "credit_card" && isValidCreditCard) ||
        (type === "mail_gpg_own_key" && isValidMailGpgOwnKey) ||
        (type === "file" && isValidFile) ||
        (type === "elster_certificate" && isValidElsterCertificate);
    const hasAdvanced = type !== "file" && type !== "elster_certificate";

    useHotkeys('alt+b', () => {
        // copy username
        onCopyUsername();
    })

    useHotkeys('alt+c', () => {
        // copy password
        onCopyPassword();
    })

    useHotkeys('alt+shift+u', () => {
        // copy url
        onCopyUrl();
    })

    const onFileChange = (event) => {
        event.preventDefault();

        if (!fileTitle && event.target.files[0].name) {
            setFileTitle(event.target.files[0].name);
        }
        setFileName(event.target.files[0].name);
        setFile(event.target.files[0]);
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
        let passwordSha1;

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
                item["description"]  = item["description"] + identityAddress + " ";
            }
            if (identityCity) {
                secretObject["identity_city"] = identityCity;
                item["description"]  = item["description"] + identityCity + " ";
            }
            if (identityPostalCode) {
                secretObject["identity_postal_code"] = identityPostalCode;
            }
            if (identityState) {
                secretObject["identity_state"] = identityState;
                item["description"]  = item["description"] + identityState + " ";
            }
            if (identityCountry) {
                secretObject["identity_country"] = identityCountry;
                item["description"]  = item["description"] + identityCountry + " ";
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
            if (creditCardName) {
                secretObject["credit_card_name"] = creditCardName;
            }
            if (creditCardValidThrough) {
                secretObject["credit_card_valid_through"] = creditCardValidThrough;
            }
            if (creditCardPIN) {
                secretObject["credit_card_pin"] = creditCardPIN;
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

    const onCopyUsername = (event) => {
        handleClose();
        if (type === "website_password") {
            browserClientService.copyToClipboard(() => Promise.resolve(websitePasswordUsername));
        }
        if (type === "application_password") {
            browserClientService.copyToClipboard(() => Promise.resolve(applicationPasswordUsername));
        }
        notification.push("password_copy", t("USERNAME_COPY_NOTIFICATION"));
    };

    const onCopyPassword = (event) => {
        handleClose();
        if (type === "website_password") {
            browserClientService.copyToClipboard(() => Promise.resolve(websitePasswordPassword));
        }
        if (type === "application_password") {
            browserClientService.copyToClipboard(() => Promise.resolve(applicationPasswordPassword));
        }
        if (type === "elster_certificate") {
            browserClientService.copyToClipboard(() => Promise.resolve(elsterCertificatePassword));
        }
        notification.push("password_copy", t("PASSWORD_COPY_NOTIFICATION"));
    };

    const onCopyRetrievalCode = (event) => {
        handleClose();
        if (type === "elster_certificate") {
            browserClientService.copyToClipboard(() => Promise.resolve(elsterCertificateRetrievalCode));
        }
        notification.push("password_copy", t("RETRIEVAL_CODE_COPY_NOTIFICATION"));
    };

    const onCopyUrl = (event) => {
        handleClose();
        if (type === "website_password") {
            browserClientService.copyToClipboard(() => Promise.resolve(websitePasswordUrl));
        }
        if (type === "bookmark") {
            browserClientService.copyToClipboard(() => Promise.resolve(bookmarkUrl));
        }
        notification.push("password_copy", t("URL_COPY_NOTIFICATION"));
    };

    const onCopyPIN = (event) => {
        handleClose();
        if (type === "credit_card") {
            browserClientService.copyToClipboard(() => Promise.resolve(creditCardPIN));
        }
        notification.push("pin_copy", t("PIN_COPY_NOTIFICATION"));
    };
    const onGeneratePassword = (event) => {
        handleClose();
        setGeneratePasswordDialogOpen(true);
    };
    const onPasswordGenerated = (password) => {
        handleClose();
        setGeneratePasswordDialogOpen(false);
        if (type === "website_password") {
            setWebsitePasswordPassword(password);
        }
        if (type === "application_password") {
            setApplicationPasswordPassword(password);
        }
        if (type === "elster_certificate") {
            setElsterCertificatePassword(password);
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

    const handleClose = () => {
        setAnchorEl(null);
        setAnchorEl2(null);
        setAnchorEl3(null);
    };



    const renderAddButton = (
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
                    {(type === "website_password" || type === "application_password" || type === "bookmark" || type === "note") && (
                        <MenuItem
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
                    <MenuItem
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
                    {type === "website_password" && !websitePasswordTotpCode && (
                        <MenuItem
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
                            setCustomFields(customFields.map((field, i) => i === index ? { ...field, value: event.target.value } : field));
                        }}
                        InputProps={{
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
                                            setAnchorElsCustomFields({ ...anchorElsCustomFields, [index]: null });
                                        }}>
                                            <ListItemIcon className={classes.listItemIcon}>
                                                <DeleteIcon className={classes.icon} fontSize="small" />
                                            </ListItemIcon>
                                            <Typography variant="body2" noWrap>
                                                {t("REMOVE_CUSTOM_FIELD")}
                                            </Typography>
                                        </MenuItem>
                                    </Menu>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
            ))}
        </React.Fragment>
    );

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
                name="createEntry"
                autoComplete="off"
            >
                <DialogTitle id="alert-dialog-title">{t("NEW_ENTRY")}</DialogTitle>
                <DialogContent>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <SelectFieldEntryType
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
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
                                    margin="dense" size="small"
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
                                    margin="dense" size="small"
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
                                        } else if (!parsedUrl.authority) {
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
                                    margin="dense" size="small"
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
                                        setWebsitePasswordPassword(event.target.value);
                                    }}
                                    InputProps={{
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
                                {!!websitePasswordPassword && (<LinearProgress variant="determinate" value={cryptoLibrary.calculatePasswordStrengthInPercent(websitePasswordPassword)} />)}
                            </Grid>
                        )}


                        {type === "website_password" && websitePasswordTotpCode && (
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
                                    onDelete={() => {
                                        setWebsitePasswordTotpCode("");
                                        setWebsitePasswordTotpPeriod(30);
                                        setWebsitePasswordTotpAlgorithm("SHA1");
                                        setWebsitePasswordTotpDigits(6);
                                    }}
                                />
                            </Grid>
                        )}

                        {type === "website_password" && renderedCustomFields}
                        {type === "website_password" && renderAddButton}

                        {type === "website_password" && (
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
                                    margin="dense" size="small"
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
                                    margin="dense" size="small"
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
                                        setApplicationPasswordPassword(event.target.value);
                                    }}
                                    InputProps={{
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
                                {!!applicationPasswordPassword && (<LinearProgress variant="determinate" value={cryptoLibrary.calculatePasswordStrengthInPercent(applicationPasswordPassword)} />)}
                            </Grid>
                        )}

                        {type === "application_password" && renderedCustomFields}
                        {type === "application_password" && renderAddButton}

                        {type === "application_password" && (
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
                                    margin="dense" size="small"
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
                                    margin="dense" size="small"
                                    id="bookmarkUrl"
                                    error={!!bookmarkUrl && !helperService.isValidUrl(bookmarkUrl)}
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

                        {type === "bookmark" && renderedCustomFields}
                        {type === "bookmark" && renderAddButton}

                        {type === "bookmark" && (
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
                                    onChange={(event) => {
                                        setBookmarkNotes(event.target.value);
                                    }}
                                    multiline
                                    minRows={3}
                                    maxRows={32}
                                />
                            </Grid>
                        )}


                        {type === "identity" && (
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
                                    required
                                    onChange={(event) => {
                                        setIdentityTitle(event.target.value);
                                    }}
                                />
                            </Grid>
                        )}
                        {type === "identity" && (
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
                                    onChange={(event) => {
                                        setIdentityFirstName(event.target.value);
                                    }}
                                />
                            </Grid>
                        )}
                        {type === "identity" && (
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
                                    onChange={(event) => {
                                        setIdentityLastName(event.target.value);
                                    }}
                                />
                            </Grid>
                        )}
                        {type === "identity" && (
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
                                    onChange={(event) => {
                                        setIdentityCompany(event.target.value);
                                    }}
                                />
                            </Grid>
                        )}
                        {type === "identity" && (
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
                                    onChange={(event) => {
                                        setIdentityAddress(event.target.value);
                                    }}
                                />
                            </Grid>
                        )}
                        {type === "identity" && (
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
                                    onChange={(event) => {
                                        setIdentityPostalCode(event.target.value);
                                    }}
                                />
                            </Grid>
                        )}
                        {type === "identity" && (
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
                                    onChange={(event) => {
                                        setIdentityCity(event.target.value);
                                    }}
                                />
                            </Grid>
                        )}
                        {type === "identity" && (
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
                                    onChange={(event) => {
                                        setIdentityState(event.target.value);
                                    }}
                                />
                            </Grid>
                        )}
                        {type === "identity" && (
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
                                    onChange={(event) => {
                                        setIdentityCountry(event.target.value);
                                    }}
                                />
                            </Grid>
                        )}
                        {type === "identity" && (
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
                                    onChange={(event) => {
                                        setIdentityPhoneNumber(event.target.value);
                                    }}
                                />
                            </Grid>
                        )}
                        {type === "identity" && (
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
                                    onChange={(event) => {
                                        setIdentityEmail(event.target.value);
                                    }}
                                />
                            </Grid>
                        )}
                        {type === "identity" && (
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
                                    onChange={(event) => {
                                        setIdentityNotes(event.target.value);
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
                                    margin="dense" size="small"
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

                        {type === "note" && renderedCustomFields}
                        {type === "note" && renderAddButton}

                        {type === "note" && (
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
                                    margin="dense" size="small"
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
                                    margin="dense" size="small"
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
                                    margin="dense" size="small"
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
                                    margin="dense" size="small"
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
                                    margin="dense" size="small"
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
                                            input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                                        },
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    className={classes.iconButton}
                                                    aria-label="menu"
                                                    onClick={onShowHidePassword}
                                                    size="large">
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

                        {type === "totp" && renderAddButton}

                        {type === "totp" && (
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
                                    margin="dense" size="small"
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
                                                    margin="dense" size="small"
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
                                                        classes: {
                                                            input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                                                        },
                                                    }}
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
                                                    size="large">
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

                        {type === "environment_variables" && renderAddButton}

                        {type === "environment_variables" && (
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
                                    onChange={(event) => {
                                        setEnvironmentVariablesNotes(event.target.value);
                                    }}
                                    multiline
                                    minRows={3}
                                    maxRows={32}
                                />
                            </Grid>
                        )}

                        {type === "elster_certificate" && (
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
                                    required
                                    onChange={(event) => {
                                        setElsterCertificateTitle(event.target.value);
                                    }}
                                />
                            </Grid>
                        )}

                        {type === "elster_certificate" && (
                            <Grid item xs={12} sm={12} md={12}>
                                <Grid item xs={12} sm={12} md={12} style={{ marginBottom: "8px", marginTop: "8px" }}>
                                    <Button variant="contained" component="label">
                                        {elsterCertificateFileName ? elsterCertificateFileName : t("CERTIFICATE_FILE")}
                                        <input type="file" hidden onChange={onElsterCertificateFileChange} accept=".pfx" required />
                                    </Button>
                                </Grid>
                            </Grid>
                        )}

                        {type === "elster_certificate" && (
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
                                        setElsterCertificatePassword(event.target.value);
                                    }}
                                    InputProps={{
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

                        {type === "elster_certificate" && (
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
                                        setElsterCertificateRetrievalCode(event.target.value);
                                    }}
                                    InputProps={{
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

                        {type === "elster_certificate" && renderAddButton}

                        {type === "elster_certificate" && (
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
                                        setElsterCertificateNotes(event.target.value);
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
                                    margin="dense" size="small"
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
                                        margin="dense" size="small"
                                        id="fileDestination"
                                        label={t("TARGET_STORAGE")}
                                        error={!fileDestination}
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
                                    margin="dense" size="small"
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
                                    margin="dense" size="small"
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
                                    margin="dense" size="small"
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
                                    margin="dense" size="small"
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
                                    margin="dense" size="small"
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
                                    margin="dense" size="small"
                                    id="creditCardPIN"
                                    label={t("PIN")}
                                    placeholder="123"
                                    name="creditCardPIN"
                                    autoComplete="off"
                                    value={creditCardPIN}
                                    onChange={(event) => {
                                        //check whether our string only contains numbers
                                        const pattern = new RegExp('^[0-9]*$');
                                        if (!pattern.test(event.target.value)) {
                                            return;
                                        }
                                        setCreditCardPIN(event.target.value);
                                    }}
                                    InputProps={{
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

                        {type === "credit_card" && renderAddButton}

                        {type === "credit_card" && (
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
                                    onChange={(event) => {
                                        setCreditCardNotes(event.target.value);
                                    }}
                                    multiline
                                    minRows={3}
                                    maxRows={32}
                                />
                            </Grid>
                        )}


                        {type === "ssh_own_key" && (sshOwnKeyTitle || sshOwnKeyPublic || sshOwnKeyPrivate || sshOwnKeyNotes) && (
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
                                    margin="dense" size="small"
                                    id="sshOwnKeyPublic"
                                    label={t("PUBLIC_KEY")}
                                    name="sshOwnKeyPublic"
                                    autoComplete="off"
                                    value={sshOwnKeyPublic}
                                    InputProps={{
                                        classes: {
                                            input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                                        },
                                    }}
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
                                    margin="dense" size="small"
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
                                    InputProps={{
                                        classes: {
                                            input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                                        },
                                    }}
                                />
                            </Grid>
                        )}

                        {type === "ssh_own_key" && renderAddButton}

                        {type === "ssh_own_key" && (sshOwnKeyTitle || sshOwnKeyPublic || sshOwnKeyPrivate || sshOwnKeyNotes) && (
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
                                    onChange={(event) => {
                                        setSshOwnKeyNotes(event.target.value);
                                    }}
                                    multiline
                                    minRows={3}
                                    maxRows={32}
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
                                    margin="dense" size="small"
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
                                    margin="dense" size="small"
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
                                    margin="dense" size="small"
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
                                    margin="dense" size="small"
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
                                    InputProps={{
                                        classes: {
                                            input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                                        },
                                    }}
                                />
                            </Grid>
                        )}
                        {type === "mail_gpg_own_key" && mailGpgOwnKeyPrivate && (
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
                                    disabled
                                    multiline
                                    minRows={3}
                                    maxRows={10}
                                    InputProps={{
                                        classes: {
                                            input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                                        },
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

                        {tags.length > 0 && (
                            <Grid item xs={12} sm={12} md={12} className={classes.right}>
                                <div className={classes.chipContainer}>
                                    {tags.map((tag, index) => (
                                        <Chip
                                            key={index}
                                            label={tag}
                                            onDelete={() => {
                                                setTags(tags.filter((t) => t !== tag));
                                            }}
                                        />
                                    ))}
                                </div>
                            </Grid>
                        )}

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
                            <Grid item xs={6} sm={6} md={6}>
                                <Checkbox
                                    checked={websitePasswordAllowHttp}
                                    onChange={(event) => {
                                        setWebsitePasswordAllowHttp(event.target.checked);
                                    }}
                                    checkedIcon={<Check className={classes.checkedIcon} />}
                                    icon={<Check className={classes.uncheckedIcon} />}
                                    classes={{
                                        checked: classes.checked,
                                    }}
                                />{" "}
                                {t("ALLOW_HTTP")}
                            </Grid>
                        )}
                        {type === "website_password" && showAdvanced && (
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
                                    margin="dense" size="small"
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
                                    margin="dense" size="small"
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
                                    margin="dense" size="small"
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
                                        setCallbackPass(event.target.value);
                                    }}
                                    InputProps={{
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
                        <Button onClick={onCreate} variant="contained" color="primary" disabled={!canSave || processing} type="submit">
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

                {addTotpOpen && (
                    <DialogAddTotp
                        open={addTotpOpen}
                        onClose={(
                            totpPeriod,
                            totpAlgorithm,
                            totpDigits,
                            totpCode,
                        ) => {
                            setWebsitePasswordTotpPeriod(totpPeriod);
                            setWebsitePasswordTotpAlgorithm(totpAlgorithm);
                            setWebsitePasswordTotpDigits(totpDigits);
                            setWebsitePasswordTotpCode(totpCode);
                            setAddTotpOpen(false)
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
            </form>
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
