import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import MuiAlert from "@material-ui/lab/Alert";
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
