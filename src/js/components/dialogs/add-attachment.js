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
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import SelectFieldFileDestination from "../select-field/file-destination";

import cryptoLibrary from "../../services/crypto-library";
import fileTransferService from "../../services/file-transfer";
import converterService from "../../services/converter";
import notification from "../../services/notification";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
    fileButton: {
        marginTop: "8px",
        marginBottom: "8px",
    },
}));

const DialogAddAttachment = (props) => {
    const { open, onClose, item } = props;
    const { t } = useTranslation();
    const classes = useStyles();

    const [selectedFile, setSelectedFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [fileDestination, setFileDestination] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const onFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setFileName(file.name);
        }
    };

    const onUpload = async () => {
        if (!selectedFile || !fileDestination) {
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            // Extract shard or file repository from destination
            let shard = undefined;
            let fileRepository = undefined;

            if (fileDestination.destination_type === "file_repository") {
                fileRepository = fileDestination;
            } else if (fileDestination.destination_type === "shard") {
                shard = fileDestination;
            }

            // Generate a random key for file encryption
            const fileSecretKey = cryptoLibrary.generateSecretKey();
            const fileChunkSize = 128 * 1024 * 1024; // 128 MB chunks
            const chunkCount = Math.ceil(selectedFile.size / fileChunkSize);

            // Create file on server with parentSecretId
            const fileResponse = await fileTransferService.createFile(
                shard ? shard.id : undefined,
                fileRepository ? fileRepository.id : undefined,
                selectedFile.size + chunkCount * 40, // Add overhead for encryption
                chunkCount,
                undefined, // linkId - not needed for attachments
                undefined, // parentDatastoreId - not needed when using parentSecretId
                undefined, // parentShareId - not needed when using parentSecretId
                item.secret_id // parentSecretId
            );

            // Upload chunks sequentially
            const chunks = await multiChunkUpload(
                shard,
                fileRepository,
                selectedFile,
                fileResponse.file_transfer_id,
                fileResponse.file_transfer_secret_key,
                fileSecretKey,
                fileChunkSize
            );

            // Build attachment object
            const newAttachment = {
                file_id: fileResponse.file_id,
                file_chunks: Object.keys(chunks).map(pos => ({
                    hash: chunks[pos],
                    position: parseInt(pos)
                })),
                file_secret_key: fileSecretKey,
                file_size: selectedFile.size,
                file_shard_id: shard ? shard.id : null,
                file_repository_id: fileRepository ? fileRepository.id : null,
                filename: fileName
            };

            notification.push("file_upload", t("FILE_UPLOADED_SUCCESSFULLY"));
            onClose(newAttachment);

        } catch (error) {
            console.error("File upload error:", error);
            notification.push("file_upload_error", t("FILE_UPLOAD_FAILED"));
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const multiChunkUpload = (shard, fileRepository, file, fileTransferId, fileTransferSecretKey, fileSecretKey, fileChunkSize) => {
        return new Promise((resolve, reject) => {
            let chunkPosition = 1;
            let fileSliceStart = 0;
            const chunks = {};
            const maxChunks = Math.ceil(file.size / fileChunkSize);
            let uploadedChunks = 0;

            const readFileChunk = (fileSliceStart, chunkSize, chunkPosition) => {
                return new Promise((resolveChunk) => {
                    const fileReader = new FileReader();

                    fileReader.onloadend = async (event) => {
                        try {
                            const bytes = new Uint8Array(event.target.result);

                            // Encrypt chunk
                            const encryptedBytes = await cryptoLibrary.encryptFile(bytes, fileSecretKey);

                            // Hash encrypted chunk
                            const hashChecksum = cryptoLibrary.sha512(encryptedBytes);

                            // Upload chunk
                            await fileTransferService.upload(
                                new Blob([encryptedBytes], { type: "application/octet-stream" }),
                                fileTransferId,
                                fileTransferSecretKey,
                                chunkSize,
                                chunkPosition,
                                shard,
                                fileRepository,
                                hashChecksum
                            );

                            uploadedChunks++;
                            setUploadProgress(Math.round((uploadedChunks / maxChunks) * 100));

                            resolveChunk({
                                chunk_position: chunkPosition,
                                hash_checksum: hashChecksum,
                            });
                        } catch (error) {
                            reject(error);
                        }
                    };

                    const file_slice = file.slice(fileSliceStart, fileSliceStart + chunkSize);
                    fileReader.readAsArrayBuffer(file_slice);
                });
            };

            const readNextChunk = async () => {
                const chunkSize = Math.min(fileChunkSize, file.size - fileSliceStart);
                if (chunkSize === 0) {
                    return resolve(chunks);
                }

                try {
                    const chunk = await readFileChunk(fileSliceStart, chunkSize, chunkPosition);
                    fileSliceStart = fileSliceStart + chunkSize;
                    chunkPosition = chunkPosition + 1;
                    chunks[chunk.chunk_position] = chunk.hash_checksum;
                    await readNextChunk();
                } catch (error) {
                    reject(error);
                }
            };

            readNextChunk();
        });
    };

    const handleClose = () => {
        if (!uploading) {
            setSelectedFile(null);
            setFileName("");
            setFileDestination(null);
            setUploadProgress(0);
            onClose(null);
        }
    };

    return (
        <Dialog
            fullWidth
            maxWidth={"sm"}
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{t("ADD_ATTACHMENT")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <SelectFieldFileDestination
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            size="small"
                            id="fileDestination"
                            label="TARGET_STORAGE"
                            error={!fileDestination}
                            value={fileDestination}
                            required
                            onChange={(value) => {
                                setFileDestination(value);
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Button
                            className={classes.fileButton}
                            variant="contained"
                            disabled={uploading}
                            component="label"
                        >
                            {selectedFile ? selectedFile.name : t("CHOOSE_FILE")}
                            <input type="file" hidden onChange={onFileChange} />
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            size="small"
                            id="fileName"
                            label={t("FILENAME")}
                            name="fileName"
                            autoComplete="off"
                            value={fileName}
                            required
                            disabled={uploading}
                            onChange={(event) => {
                                setFileName(event.target.value);
                            }}
                        />
                    </Grid>
                    {uploading && (
                        <Grid item xs={12} sm={12} md={12}>
                            <LinearProgress variant="determinate" value={uploadProgress} />
                            <Typography variant="caption" align="center" display="block">
                                {t("UPLOADING")}: {uploadProgress}%
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={handleClose}
                    disabled={uploading}
                >
                    {t("CLOSE")}
                </Button>
                <Button
                    onClick={onUpload}
                    variant="contained"
                    color="primary"
                    disabled={!selectedFile || !fileName || !fileDestination || uploading}
                >
                    {t("ADD")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

DialogAddAttachment.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    item: PropTypes.object.isRequired,
};

export default DialogAddAttachment;
