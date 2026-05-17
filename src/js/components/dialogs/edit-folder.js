import { Grid } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import folderColorService from "../../services/folder-color";
import FolderColorField from "./folder-color-field";

const useStyles = makeStyles((theme) => ({
	textField: {
		width: "100%",
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
}));

const DialogEditFolder = (props) => {
	const { open, onClose, node } = props;
	const { t } = useTranslation();
	const classes = useStyles();
	const [folderName, setFolderName] = useState(node.name);
	const [folderColor, setFolderColor] = useState(
		node.color || folderColorService.DEFAULT_FOLDER_COLOR,
	);
	const hasFolderColorError =
		!folderColorService.isFolderColorValid(folderColor);

	const onSave = () => {
		node.name = folderName;
		node.color = folderColorService.normalizeFolderColor(folderColor);
		props.onSave(node);
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
			<DialogTitle id="alert-dialog-title">{t("EDIT_FOLDER")}</DialogTitle>
			<DialogContent>
				<Grid container>
					<Grid item xs={12} sm={12} md={12}>
						<TextField
							className={classes.textField}
							variant="outlined"
							margin="dense"
							size="small"
							id="folderName"
							label={t("FOLDER_NAME")}
							name="folderName"
							autoComplete="off"
							value={folderName}
							required
							onChange={(event) => {
								setFolderName(event.target.value);
							}}
						/>
					</Grid>
					<Grid item xs={12} sm={12} md={12}>
						<FolderColorField
							value={folderColor}
							onChange={setFolderColor}
							error={hasFolderColorError}
						/>
					</Grid>
					<Grid item xs={12} sm={12} md={12}>
						{t("FOLDER_LINK")}:{" "}
						<a href={"index.html#!/datastore/search/" + node.id}>{node.id}</a>
					</Grid>
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
				<Button
					onClick={onSave}
					variant="contained"
					color="primary"
					disabled={!folderName || hasFolderColorError}
				>
					{t("SAVE")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

DialogEditFolder.propTypes = {
	onClose: PropTypes.func.isRequired,
	onSave: PropTypes.func.isRequired,
	open: PropTypes.bool.isRequired,
	node: PropTypes.object.isRequired,
};

export default DialogEditFolder;
