import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import MuiAlert from '@mui/material/Alert'
import ButtonDanger from "../../components/button-danger";
import GridContainerErrors from "../../components/grid-container-errors";
import fileRepositoryService from "../../services/file-repository";

const DeleteFileRepositoriesDialog = (props) => {
    const { open, onClose } = props;
    const { t } = useTranslation();
    const [errors, setErrors] = useState([]);

    const deleteFileRepository = () => {
        setErrors([]);

        const onError = function (data) {
            console.log(data);

            if (data.hasOwnProperty("message")) {
                setErrors([data.message]);
            } else {
                alert("Error, should not happen.");
            }
        };

        const onSuccess = function () {
            onClose();
        };
        fileRepositoryService.deleteFileRepository(props.fileRepositoryId).then(onSuccess, onError);
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
            <DialogTitle id="alert-dialog-title">{t("DELETE_FILE_REPOSITORY")}</DialogTitle>
            <DialogContent>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
                <MuiAlert
                    onClose={() => {
                        setErrors([]);
                    }}
                    severity="error"
                    style={{ marginBottom: "5px" }}
                >
                    {t("DELETE_FILE_REPOSITORY_WARNING")}
                </MuiAlert>
            </DialogContent>
            <DialogActions>
                <ButtonDanger
                    onClick={() => {
                        deleteFileRepository();
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

DeleteFileRepositoriesDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    fileRepositoryId: PropTypes.string.isRequired,
};

export default DeleteFileRepositoriesDialog;
