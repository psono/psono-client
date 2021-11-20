import React, { useState } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { bindActionCreators } from "redux";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";

import actionCreators from "../../actions/action-creators";
import MuiAlert from "@material-ui/lab/Alert";
import ButtonDanger from "../../components/button-danger";
import GridContainerErrors from "../../components/grid-container-errors";
import apiKeys from "../../services/api-keys";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
}));

const DeleteApiKeysDialog = (props) => {
    const { open, onClose } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [errors, setErrors] = useState([]);

    const deleteApiKey = () => {
        setErrors([]);

        const onError = function (data) {
            //pass
        };

        const onSuccess = function () {
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

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default connect(mapStateToProps, mapDispatchToProps)(DeleteApiKeysDialog);
