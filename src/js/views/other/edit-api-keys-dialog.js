import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { makeStyles } from '@mui/styles';
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { Checkbox, Grid } from "@mui/material";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import MuiAlert from '@mui/material/Alert'
import { Check } from "@mui/icons-material";

import GridContainerErrors from "../../components/grid-container-errors";
import Table from "../../components/table";
import DialogSelectSecret from "../../components/dialogs/select-secret";
import apiKey from "../../services/api-keys";
import apiKeysService from "../../services/api-keys";
import TabPanel from "../../components/tab-panel";

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
    tabPanel: {
        "& .MuiBox-root": {
            padding: "16px 0px",
        },
    },
}));

const EditApiKeysDialog = (props) => {
    const { open, onClose, apiKeyId } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const serverUrl = useSelector((state) => state.server.url);
    const serverPublicKey = useSelector((state) => state.server.publicKey);
    const serverVerifyKey = useSelector((state) => state.server.verifyKey);
    const [value, setValue] = React.useState(0);
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

        return apiKey
            .updateApiKey(apiKeyId, title, restrictToSecrets, allowInsecureUsage, rightToRead, rightToWrite)
            .then(onSuccess, onError);
    };

    const onAddSecret = (items, path, nodePath) => {
        setAddSecretOpen(false);
        const newSecrets = [...secrets];
        items.forEach((item) => {
            newSecrets.push([item.id, item.name, item.secret_id]);
        })
        setSecrets(newSecrets);
        items.forEach((item) => {
            apiKeysService.addSecretToApiKey(apiKeyId, apiKeySecretKey, item);
        })

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
                            margin="dense" size="small"
                            label={"SECRET_ID"}
                            name="secretId"
                            autoComplete="off"
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
                customHeadLabelRender: () => null,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton onClick={() => deleteSecret(tableMeta.rowData[0])} size="large">
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
        return !(node.hasOwnProperty("type") && node.type === "file");
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
                            margin="dense" size="small"
                            id="title"
                            label={t("TITLE")}
                            name="title"
                            autoComplete="off"
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
                                if (!event.target.checked && value === 1) {
                                    // switch tabs if we have the secret tab and don't restrict to secrets
                                    setValue(0);
                                }
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
                        <Divider style={{ marginTop: "20px", marginBottom: "10px" }} />
                        <Tabs
                            value={value}
                            indicatorColor="primary"
                            textColor="primary"
                            onChange={(event, newValue) => {
                                setValue(newValue);
                            }}
                            aria-label="users and groups"
                        >
                            <Tab label={t("DETAILS")} />
                            {restrictToSecrets && <Tab label={t("SECRETS")} />}
                        </Tabs>
                        <TabPanel value={value} index={0} className={classes.tabPanel}>
                            <Grid container>
                                <Grid item xs={12} sm={12} md={12}>
                                    <TextField
                                        className={classes.textField}
                                        variant="outlined"
                                        margin="dense" size="small"
                                        id="apiKeyId"
                                        label={"API_KEY_ID"}
                                        name="apiKeyId"
                                        autoComplete="off"
                                        value={apiKeyId}
                                        readOnly
                                        InputProps={{
                                            type: showApiKeyId ? "text" : "password",
                                            classes: {
                                                input: classes.passwordField,
                                            },
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle api key id visibility"
                                                        onClick={() => setShowApiKeyId(!showApiKeyId)}
                                                        edge="end"
                                                        size="large">
                                                        {showApiKeyId ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={12} md={12}>
                                    <TextField
                                        className={classes.textField}
                                        variant="outlined"
                                        margin="dense" size="small"
                                        id="apiKeyPrivateKey"
                                        label={"API_KEY_PRIVATE_KEY"}
                                        name="apiKeyPrivateKey"
                                        autoComplete="off"
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
                                                        size="large">
                                                        {showApiKeyPrivateKey ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={12} md={12}>
                                    <TextField
                                        className={classes.textField}
                                        variant="outlined"
                                        margin="dense" size="small"
                                        id="apiKeySecretKey"
                                        label={"API_KEY_SECRET_KEY"}
                                        name="apiKeySecretKey"
                                        autoComplete="off"
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
                                                        size="large">
                                                        {showApiKeySecretKey ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={12} md={12}>
                                    <TextField
                                        className={classes.textField}
                                        variant="outlined"
                                        margin="dense" size="small"
                                        id="serverUrl"
                                        label={"SERVER_URL"}
                                        name="serverUrl"
                                        autoComplete="off"
                                        value={serverUrl}
                                        readOnly
                                        InputProps={{
                                            classes: {
                                                input: classes.passwordField,
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={12} md={12}>
                                    <TextField
                                        className={classes.textField}
                                        variant="outlined"
                                        margin="dense" size="small"
                                        id="serverPublicKey"
                                        label={"SERVER_PUBLIC_KEY"}
                                        name="serverPublicKey"
                                        autoComplete="off"
                                        value={serverPublicKey}
                                        readOnly
                                        InputProps={{
                                            classes: {
                                                input: classes.passwordField,
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={12} md={12}>
                                    <TextField
                                        className={classes.textField}
                                        variant="outlined"
                                        margin="dense" size="small"
                                        id="serverVerifyKey"
                                        label={"SERVER_SIGNATURE"}
                                        name="serverVerifyKey"
                                        autoComplete="off"
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
                        </TabPanel>
                        <TabPanel value={value} index={1} className={classes.tabPanel}>
                            <Table
                                data={secrets}
                                columns={columns}
                                options={options}
                                onCreate={() => setAddSecretOpen(true)}
                            />
                        </TabPanel>
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
                    {t("SAVE")}
                </Button>
            </DialogActions>
            {addSecretOpen && (
                <DialogSelectSecret
                    open={addSecretOpen}
                    onClose={() => setAddSecretOpen(false)}
                    onSelectItems={onAddSecret}
                    isSelectable={isSelectable}
                />
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
