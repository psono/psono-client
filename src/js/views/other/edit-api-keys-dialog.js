import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import { Checkbox, Grid } from "@material-ui/core";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import MuiAlert from "@material-ui/lab/Alert";
import { Check } from "@material-ui/icons";

import GridContainerErrors from "../../components/grid-container-errors";
import Table from "../../components/table";
import DialogSelectSecret from "../../components/dialogs/select-secret";
import apiKey from "../../services/api-keys";
import apiKeysService from "../../services/api-keys";

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
    passwordField: {
        fontFamily: "'Fira Code', monospace",
    },
}));

const EditApiKeysDialog = (props) => {
    const { open, onClose, apiKeyId } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const serverUrl = useSelector((state) => state.server.url);
    const serverPublicKey = useSelector((state) => state.server.publicKey);
    const serverVerifyKey = useSelector((state) => state.server.verifyKey);
    const [addSecretOpen, setAddSecretOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [apiKeyPrivateKey, setApiKeyPrivateKey] = useState("");
    const [apiKeySecretKey, setApiKeySecretKey] = useState("");
    const [restrictToSecrets, setRestrictToSecrets] = useState(true);
    const [allowInsecureUsage, setAllowInsecureUsage] = useState(false);
    const [rightToRead, setRightToRead] = useState(true);
    const [rightToWrite, setRightToWrite] = useState(false);
    const [secrets, setSecrets] = useState([]);
    const [errors, setErrors] = useState([]);
    const [showApiKeyId, setShowApiKeyId] = useState(false);
    const [showApiKeyPrivateKey, setShowApiKeyPrivateKey] = useState(false);
    const [showApiKeySecretKey, setShowApiKeySecretKey] = useState(false);

    React.useEffect(() => {
        loadApiKey();
        loadApiKeySecrets();
    }, []);

    const loadApiKey = () => {
        apiKey.readApiKey(apiKeyId).then(
            function (data) {
                setTitle(data.title);
                setApiKeyPrivateKey(data.private_key);
                setApiKeySecretKey(data.secret_key);
                setRestrictToSecrets(data.restrict_to_secrets);
                setAllowInsecureUsage(data.allow_insecure_access);
                setRightToRead(data.read);
                setRightToWrite(data.write);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    const loadApiKeySecrets = () => {
        apiKey.readApiKeySecrets(apiKeyId).then(
            function (secrets) {
                setSecrets(secrets.map((secret) => [secret.id, secret.name, secret.secret_id]));
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

        return apiKey.updateApiKey(apiKeyId, title, restrictToSecrets, allowInsecureUsage, rightToRead, rightToWrite).then(onSuccess, onError);
    };

    const onAddSecret = (item, path, nodePath) => {
        setAddSecretOpen(false);
        secrets.push([item.id, item.name, item.secret_id]);
        setSecrets(secrets);
        apiKeysService.addSecretToApiKey(apiKeyId, apiKeySecretKey, item);
    };

    const deleteSecret = (secretId) => {
        const onError = function (result) {
            // pass
            console.log(result);
        };

        const onSuccess = function () {
            loadApiKeySecrets();
        };

        apiKeysService.deleteApiKeySecret(secretId).then(onSuccess, onError);
    };
    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("TITLE") },
        {
            name: t("SECRET_ID"),
            options: {
                filter: true,
                sort: false,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            label={"SECRET_ID"}
                            name="secretId"
                            autoComplete="secretId"
                            value={tableMeta.rowData[2]}
                            readOnly
                            InputProps={{
                                classes: {
                                    input: classes.passwordField,
                                },
                            }}
                        />
                    );
                },
            },
        },
        {
            name: t("DELETE"),
            options: {
                filter: true,
                sort: false,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton onClick={() => deleteSecret(tableMeta.rowData[0])}>
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

    const isSelectable = (node) => {
        if (node.hasOwnProperty("type") && node.type === "file") {
            return false;
        }
        return true;
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
            <DialogTitle id="alert-dialog-title">{t("EDIT_API_KEY")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            id="title"
                            label={t("TITLE")}
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
                        <h4>{t("DETAILS")}</h4>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="apiKeyId"
                                label={"API_KEY_ID"}
                                name="apiKeyId"
                                autoComplete="apiKeyId"
                                value={apiKeyId}
                                readOnly
                                InputProps={{
                                    type: showApiKeyId ? "text" : "password",
                                    classes: {
                                        input: classes.passwordField,
                                    },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton aria-label="toggle api key id visibility" onClick={() => setShowApiKeyId(!showApiKeyId)} edge="end">
                                                {showApiKeyId ? <Visibility /> : <VisibilityOff />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="apiKeyPrivateKey"
                                label={"API_KEY_PRIVATE_KEY"}
                                name="apiKeyPrivateKey"
                                autoComplete="apiKeyPrivateKey"
                                value={apiKeyPrivateKey}
                                readOnly
                                InputProps={{
                                    type: showApiKeyPrivateKey ? "text" : "password",
                                    classes: {
                                        input: classes.passwordField,
                                    },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle api key id visibility"
                                                onClick={() => setShowApiKeyPrivateKey(!showApiKeyPrivateKey)}
                                                edge="end"
                                            >
                                                {showApiKeyPrivateKey ? <Visibility /> : <VisibilityOff />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="apiKeySecretKey"
                                label={"API_KEY_SECRET_KEY"}
                                name="apiKeySecretKey"
                                autoComplete="apiKeySecretKey"
                                value={apiKeySecretKey}
                                readOnly
                                InputProps={{
                                    type: showApiKeySecretKey ? "text" : "password",
                                    classes: {
                                        input: classes.passwordField,
                                    },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle api key id visibility"
                                                onClick={() => setShowApiKeySecretKey(!showApiKeySecretKey)}
                                                edge="end"
                                            >
                                                {showApiKeySecretKey ? <Visibility /> : <VisibilityOff />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="serverUrl"
                                label={"SERVER_URL"}
                                name="serverUrl"
                                autoComplete="serverUrl"
                                value={serverUrl}
                                readOnly
                                InputProps={{
                                    classes: {
                                        input: classes.passwordField,
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="serverPublicKey"
                                label={"SERVER_PUBLIC_KEY"}
                                name="serverPublicKey"
                                autoComplete="serverPublicKey"
                                value={serverPublicKey}
                                readOnly
                                InputProps={{
                                    classes: {
                                        input: classes.passwordField,
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="serverVerifyKey"
                                label={"SERVER_SIGNATURE"}
                                name="serverVerifyKey"
                                autoComplete="serverVerifyKey"
                                value={serverVerifyKey}
                                readOnly
                                InputProps={{
                                    classes: {
                                        input: classes.passwordField,
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>
                    {restrictToSecrets && (
                        <Grid item xs={12} sm={12} md={12}>
                            <h4>{t("SECRETS")}</h4>
                        </Grid>
                    )}
                    {restrictToSecrets && (
                        <Grid item xs={12} sm={12} md={12}>
                            <Table data={secrets} columns={columns} options={options} onCreate={() => setAddSecretOpen(true)} />
                        </Grid>
                    )}
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
                    {t("SAVE")}
                </Button>
            </DialogActions>
            {addSecretOpen && (
                <DialogSelectSecret open={addSecretOpen} onClose={() => setAddSecretOpen(false)} onSelectItem={onAddSecret} isSelectable={isSelectable} />
            )}
        </Dialog>
    );
};

EditApiKeysDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    apiKeyId: PropTypes.string.isRequired,
};

export default EditApiKeysDialog;
