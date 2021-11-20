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
import { Checkbox, Grid } from "@material-ui/core";
import TextField from "@material-ui/core/TextField";

import actionCreators from "../../actions/action-creators";
import GridContainerErrors from "../../components/grid-container-errors";
import { Check } from "@material-ui/icons";
import apiKey from "../../services/api-keys";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import MuiAlert from "@material-ui/lab/Alert";
import Table from "../../components/table";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
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
}));

const EditDatastoresDialog = (props) => {
    const { open, onClose, apiKeyId } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [title, setTitle] = useState("");
    const [restrictToSecrets, setRestrictToSecrets] = useState(true);
    const [allowInsecureUsage, setAllowInsecureUsage] = useState(false);
    const [rightToRead, setRightToRead] = useState(true);
    const [rightToWrite, setRightToWrite] = useState(false);
    const [secrets, setSecrets] = useState([]);
    const [errors, setErrors] = useState([]);

    React.useEffect(() => {
        loadApiKey();
    }, []);

    const loadApiKey = () => {
        apiKey.readApiKey(props.apiKeyId).then(
            function (data) {
                setTitle(data.title);
                setRestrictToSecrets(data.restrict_to_secrets);
                setAllowInsecureUsage(data.allow_insecure_access);
                setRightToRead(data.read);
                setRightToWrite(data.write);
            },
            function (error) {
                console.log(error);
            }
        );
        apiKey.readApiKeySecrets(props.apiKeyId).then(
            function (secrets) {
                // TODO implement secrets mapping
                console.log(secrets);
                setSecrets(secrets);
            },
            function (result) {
                // pass
            }
        );
    };

    const edit = () => {
        const onError = function (result) {
            // pass
        };

        const onSuccess = function (result) {
            onClose();
        };

        return apiKey.updateApiKey(props.apiKeyId, title, restrictToSecrets, allowInsecureUsage, rightToRead, rightToWrite).then(onSuccess, onError);
    };

    const onAddSecret = () => {
        // TODO implement add Secret
    };

    const columns = [
        //{ name: t("ID"), options: { display: false } },
        { name: t("TITLE") },
        {
            name: t("DELETE"),
            options: {
                filter: true,
                sort: false,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                // TODO implement
                                //onDelete(tableMeta.rowData);
                            }}
                        >
                            <DeleteIcon />
                        </IconButton>
                    );
                },
            },
        },
    ];

    const options = {
        filterType: "checkbox",
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
            <DialogTitle id="alert-dialog-title">{t("EDIT_DATASTORE")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="title"
                            label={t("DATASTORE_DESCRIPTION")}
                            name="title"
                            autoComplete="title"
                            value={title}
                            onChange={(event) => {
                                setTitle(event.target.value);
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Checkbox
                            tabIndex={1}
                            checked={restrictToSecrets}
                            onChange={(event) => {
                                setRestrictToSecrets(event.target.checked);
                            }}
                            checkedIcon={<Check className={classes.checkedIcon} />}
                            icon={<Check className={classes.uncheckedIcon} />}
                            classes={{
                                checked: classes.checked,
                            }}
                        />{" "}
                        {t("SECRETS_ONLY")}
                    </Grid>
                    {!restrictToSecrets && (
                        <Grid item xs={12} sm={12} md={12}>
                            <MuiAlert
                                severity="warning"
                                style={{
                                    marginBottom: "5px",
                                    marginTop: "5px",
                                }}
                            >
                                {t("API_KEY_NOT_RESTRICTED_TO_SECRETS_WARNING")}
                            </MuiAlert>
                        </Grid>
                    )}
                    <Grid item xs={12} sm={12} md={12}>
                        <Checkbox
                            tabIndex={1}
                            checked={allowInsecureUsage}
                            onChange={(event) => {
                                setAllowInsecureUsage(event.target.checked);
                            }}
                            checkedIcon={<Check className={classes.checkedIcon} />}
                            icon={<Check className={classes.uncheckedIcon} />}
                            classes={{
                                checked: classes.checked,
                            }}
                        />{" "}
                        {t("ALLOW_INSECURE_USAGE")}
                    </Grid>
                    {allowInsecureUsage && (
                        <Grid item xs={12} sm={12} md={12}>
                            <MuiAlert
                                severity="warning"
                                style={{
                                    marginBottom: "5px",
                                    marginTop: "5px",
                                }}
                            >
                                {t("API_KEY_INSECURE_USAGE_WARNING")}
                            </MuiAlert>
                        </Grid>
                    )}
                    <Grid item xs={12} sm={12} md={12}>
                        <Checkbox
                            tabIndex={1}
                            checked={rightToRead}
                            onChange={(event) => {
                                setRightToRead(event.target.checked);
                            }}
                            checkedIcon={<Check className={classes.checkedIcon} />}
                            icon={<Check className={classes.uncheckedIcon} />}
                            classes={{
                                checked: classes.checked,
                            }}
                        />{" "}
                        {t("RIGHT_TO_READ")}
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Checkbox
                            tabIndex={1}
                            checked={rightToWrite}
                            onChange={(event) => {
                                setRightToWrite(event.target.checked);
                            }}
                            checkedIcon={<Check className={classes.checkedIcon} />}
                            icon={<Check className={classes.uncheckedIcon} />}
                            classes={{
                                checked: classes.checked,
                            }}
                        />{" "}
                        {t("RIGHT_TO_WRITE")}
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Table data={secrets} columns={columns} options={options} onCreate={onAddSecret} />
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
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
                    onClick={() => {
                        edit();
                    }}
                    variant="contained"
                    color="primary"
                    disabled={!title}
                >
                    {t("EDIT")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

EditDatastoresDialog.propTypes = {
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
export default connect(mapStateToProps, mapDispatchToProps)(EditDatastoresDialog);
