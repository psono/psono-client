import { Grid } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import LinearProgress from "@mui/material/LinearProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { makeStyles } from "@mui/styles";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type {
	DialogAttachment,
	FileDestination,
	ResultDialogProps,
} from "../../../types/dialogs";
import {
	uploadAttachment,
	type PendingAttachment,
} from "../../services/attachment";
import notification from "../../services/notification";
import SelectFieldFileDestination from "../select-field/file-destination";

const useStyles = makeStyles((theme) => ({
	textField: {
		width: "100%",
	},
	fileButton: {
		marginTop: "8px",
		marginBottom: "8px",
	},
}));

export interface DialogAddAttachmentProps
	extends ResultDialogProps<DialogAttachment> {
	item: { secret_id?: string };
	onSelect?: (attachment: PendingAttachment) => void;
}

const DialogAddAttachment = (props: DialogAddAttachmentProps) => {
	const { open, onClose, item, onSelect } = props;
	const { t } = useTranslation();
	const classes = useStyles();

	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState("");
	const [fileDestination, setFileDestination] =
		useState<FileDestination | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);

	const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setSelectedFile(file);
			setFileName(file.name);
		}
	};

	const onUpload = async () => {
		if (!selectedFile || !fileDestination) {
			return;
		}
		if (onSelect) {
			onSelect({
				file: selectedFile,
				filename: fileName,
				destination: fileDestination,
			});
			return;
		}

		setUploading(true);
		setUploadProgress(0);

		try {
			const newAttachment = await uploadAttachment(
				{
					file: selectedFile,
					filename: fileName,
					destination: fileDestination,
				},
				item.secret_id!,
				setUploadProgress,
			);

			notification.push("file_upload", t("FILE_UPLOADED_SUCCESSFULLY"));
			onClose(newAttachment);
		} catch (error) {
			console.error("File upload error:", error);
			notification.push("file_upload_error", t("FILE_UPLOAD_FAILED"));
			setUploading(false);
			setUploadProgress(0);
		}
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
							label="TARGET_STORAGE"
							error={!fileDestination}
							value={fileDestination}
							required
							onChange={(value: FileDestination | null) => {
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
				<Button onClick={handleClose} disabled={uploading}>
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

export default DialogAddAttachment;
