import MuiAlert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ButtonDanger from "../../components/button-danger";
import GridContainerErrors from "../../components/grid-container-errors";
import apiKeys from "../../services/api-keys";

const DeleteApiKeysDialog = (props) => {
	const { open, onClose } = props;
	const { t } = useTranslation();
	const [errors, setErrors] = useState([]);

	const deleteApiKey = () => {
		setErrors([]);

		const onError = (data) => {
			//pass
		};

		const onSuccess = () => {
			onClose();
		};
		apiKeys.deleteApiKey(props.apiKeyId).then(onSuccess, onError);
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
			<DialogTitle id="alert-dialog-title">{t("DELETE_API_KEY")}</DialogTitle>
			<DialogContent>
				<GridContainerErrors errors={errors} setErrors={setErrors} />
				<MuiAlert
					onClose={() => {
						setErrors([]);
					}}
					severity="error"
					style={{ marginBottom: "5px" }}
				>
					{t("DELETE_API_KEY_WARNING")}
				</MuiAlert>
			</DialogContent>
			<DialogActions>
				<ButtonDanger
					onClick={() => {
						deleteApiKey();
					}}
					autoFocus
				>
					{t("DELETE")}
				</ButtonDanger>
				<Button
					onClick={() => {
						onClose();
					}}
				>
					{t("CLOSE")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

DeleteApiKeysDialog.propTypes = {
	onClose: PropTypes.func.isRequired,
	open: PropTypes.bool.isRequired,
	apiKeyId: PropTypes.string.isRequired,
};

export default DeleteApiKeysDialog;
