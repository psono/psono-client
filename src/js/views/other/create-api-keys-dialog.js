import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { Checkbox, Grid } from "@mui/material";
import TextField from "@mui/material/TextField";

import GridContainerErrors from "../../components/grid-container-errors";
import { Check } from "@mui/icons-material";
import apiKey from "../../services/api-keys";
import MuiAlert from '@mui/material/Alert'
import Table from "../../components/table";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import DialogSelectSecret from "../../components/dialogs/select-secret";

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

const CreateApiKeysDialog = (props) => {
    const { open, onClose, apiKeyId } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [title, setTitle] = useState("");
    const [restrictToSecrets, setRestrictToSecrets] = useState(true);
    const [allowInsecureUsage, setAllowInsecureUsage] = useState(false);
    const [rightToRead, setRightToRead] = useState(true);
    const [rightToWrite, setRightToWrite] = useState(false);
    const [addSecretOpen, setAddSecretOpen] = useState(false);
    const [secrets, setSecrets] = useState([]);
    const [errors, setErrors] = useState([]);

    const create = () => {
        const onError = function (result) {
            // pass
        };

        const onSuccess = function (result) {
            onClose();
        };

        return apiKey
            .createApiKey(
                title,
                restrictToSecrets,
                allowInsecureUsage,
                rightToRead,
                rightToWrite,
                secrets.map((secret) => {
                    return {
                        secret_id: secret[2],
                        name: secret[1],
                        secret_key: secret[3],
                    };
                })
            )
            .then(onSuccess, onError);
    };

    const onAddSecret = (items, path, nodePath) => {
        setAddSecretOpen(false);
        const newSecrets = [...secrets];
        items.forEach((item) => {
            newSecrets.push([item.id, item.name, item.secret_id, item.secret_key]);
        })
        setSecrets(newSecrets);
    };

    const onDeleteSecret = (rowData) => {
        const filtered = secrets.filter(function (secret, index, arr) {
            return rowData[0] !== secret[0];
        });
        setSecrets(filtered);
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("TITLE") },
        {
            name: t("DELETE"),
            options: {
                filter: true,
                sort: false,
                empty: false,
                customHeadLabelRender: () => null,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                onDeleteSecret(tableMeta.rowData);
                            }}
                            size="large">
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
            <DialogTitle id="alert-dialog-title">{t("CREATE_NEW_API_KEY")}</DialogTitle>
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
                        <Table
                            data={secrets}
                            columns={columns}
                            options={options}
                            onCreate={() => setAddSecretOpen(true)}
                        />
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
                        create();
                    }}
                    variant="contained"
                    color="primary"
                    disabled={!title}
                >
                    {t("CREATE")}
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

CreateApiKeysDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default CreateApiKeysDialog;
