import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import { Grid } from "@mui/material";
import TextField from "@mui/material/TextField";

import Table from "../../components/table";
import duo from "../../services/duo";
import { getStore } from "../../services/store";
import GridContainerErrors from "../../components/grid-container-errors";
import TextFieldQrCode from "../../components/text-field/qr";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
}));

const MultifactorAuthenticatorDuo = (props) => {
    const { open, onClose } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [title, setTitle] = React.useState("");
    const [integrationKey, setIntegrationKey] = React.useState("");
    const [secretKey, setSecretKey] = React.useState("");
    const [host, setHost] = React.useState("");
    const [uri, setUri] = React.useState("");
    const [code, setCode] = React.useState("");
    const [newDuo, setNewDuo] = React.useState({});
    const [view, setView] = React.useState("default");
    const [duos, setDuos] = React.useState([]);
    const [errors, setErrors] = useState([]);

    React.useEffect(() => {
        loadDuos();
    }, []);

    const loadDuos = () => {
        duo.readDuo().then(
            function (keys) {
                setDuos(
                    keys.map((key, index) => {
                        return [key.id, key.title, key.active];
                    })
                );
            },
            function (error) {
                console.log(error);
            }
        );
    };

    const onDuoActivationSuccessful = (successful) => {
        if (successful) {
            setCode("");
            setNewDuo({});
            setView("default");
            loadDuos();
        } else {
            setErrors(["CODE_INCORRECT"]);
        }
    };

    const gotoStep3 = () => {
        setView("step3");
        duo.activateDuo(newDuo.id, undefined).then(onDuoActivationSuccessful, () => {
            // may fail for valid reasons, e.g. timeout and won't harm the activation as the user can still
            // manually activate the DUO
        });
    };

    const validate = () => {
        setErrors([]);
        duo.activateDuo(newDuo.id, code).then(onDuoActivationSuccessful, () => {
            // may fail for valid reasons, e.g. timeout and won't harm the activation as the user can still
            // manually activate the DUO
        });
    };

    const create = () => {
        duo.createDuo(
            getStore().getState().server.systemWideDuoExists,
            title || undefined,
            integrationKey || undefined,
            secretKey || undefined,
            host || undefined
        ).then(
            function (createdDuo) {
                setNewDuo(createdDuo);
                if (createdDuo.uri === "") {
                    duo.activateDuo(createdDuo.id, undefined).then(onDuoActivationSuccessful, () => {
                        // may fail for valid reasons, e.g. timeout and won't harm the activation as the user can still
                        // manually activate the DUO
                    });
                    setView("step3");
                    return;
                }
                setView("step2");
                setUri(createdDuo.uri)
                setTitle("");
                setIntegrationKey("");
                setSecretKey("");
                setHost("");
            },
            function (error) {
                if (error.hasOwnProperty("non_field_errors")) {
                    setErrors(error.non_field_errors);
                } else {
                    console.log(error);
                }
            }
        );
    };

    const onDelete = (rowData) => {
        setErrors([]);

        const onSuccess = function (successful) {
            loadDuos();
        };

        const onError = function (error) {
            console.log(error);
        };

        return duo.deleteDuo(rowData[0]).then(onSuccess, onError);
    };
    const onCreate = () => {
        setView("create_step0");
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("DUO_TITLE") },
        {
            name: t("ACTIVE"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return <span>{tableMeta.rowData[2] && <CheckIcon />}</span>;
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
                        <IconButton
                            onClick={() => {
                                onDelete(tableMeta.rowData);
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

    return (
        <Dialog
            fullWidth
            maxWidth={"sm"}
            open={open}
            onClose={() => {
                setView("default");
                onClose();
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{t("DUO")}</DialogTitle>
            {view === "default" && (
                <DialogContent>
                    <Table data={duos} columns={columns} options={options} onCreate={onCreate} />
                </DialogContent>
            )}

            {view === "create_step0" && (
                <DialogContent>
                    <Grid container>
                        {!getStore().getState().server.systemWideDuoExists && (
                            <Grid item xs={12} sm={12} md={12}>
                                <TextField
                                    className={classes.textField}
                                    variant="outlined"
                                    margin="dense" size="small"
                                    id="title"
                                    label={t("TITLE")}
                                    helperText={t("TITLE_OF_YOUR_DUO")}
                                    name="title"
                                    autoComplete="off"
                                    required
                                    value={title}
                                    onChange={(event) => {
                                        setTitle(event.target.value);
                                    }}
                                />
                            </Grid>
                        )}
                        {!getStore().getState().server.systemWideDuoExists && (
                            <Grid item xs={12} sm={12} md={12}>
                                <TextField
                                    className={classes.textField}
                                    variant="outlined"
                                    margin="dense" size="small"
                                    id="integrationKey"
                                    label={t("INTEGRATION_KEY")}
                                    name="integrationKey"
                                    autoComplete="off"
                                    required
                                    value={integrationKey}
                                    onChange={(event) => {
                                        setIntegrationKey(event.target.value);
                                    }}
                                />
                            </Grid>
                        )}
                        {!getStore().getState().server.systemWideDuoExists && (
                            <Grid item xs={12} sm={12} md={12}>
                                <TextField
                                    className={classes.textField}
                                    variant="outlined"
                                    margin="dense" size="small"
                                    id="secretKey"
                                    label={t("SECRET_KEY")}
                                    name="secretKey"
                                    autoComplete="off"
                                    required
                                    value={secretKey}
                                    onChange={(event) => {
                                        setSecretKey(event.target.value);
                                    }}
                                />
                            </Grid>
                        )}
                        {!getStore().getState().server.systemWideDuoExists && (
                            <Grid item xs={12} sm={12} md={12}>
                                <TextField
                                    className={classes.textField}
                                    variant="outlined"
                                    margin="dense" size="small"
                                    id="host"
                                    label={t("HOST")}
                                    name="host"
                                    autoComplete="off"
                                    required
                                    value={host}
                                    onChange={(event) => {
                                        setHost(event.target.value);
                                    }}
                                />
                            </Grid>
                        )}
                        <GridContainerErrors errors={errors} setErrors={setErrors} />
                        <Grid item xs={12} sm={12} md={12}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={create}
                                disabled={
                                    !getStore().getState().server.systemWideDuoExists &&
                                    (!title || !integrationKey || !secretKey || !host)
                                }
                            >
                                {t("SETUP")}
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>
            )}

            {view === "step2" && (
                <DialogContent>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextFieldQrCode
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
                                value={uri}
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <Button variant="contained" color="primary" onClick={gotoStep3}>
                                {t("SCAN_THE_CODE_THEN_CLICK_HERE")}
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>
            )}

            {view === "step3" && (
                <DialogContent>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
                                id="code"
                                label={t("CODE")}
                                helperText={t("ONE_CODE_FOR_VALIDATION")}
                                name="code"
                                autoComplete="off"
                                value={code}
                                onChange={(event) => {
                                    setCode(event.target.value);
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <Button variant="contained" color="primary" onClick={validate}>
                                {t("VALIDATE")}
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>
            )}
            <DialogActions>
                <Button
                    onClick={() => {
                        onClose();
                    }}
                    autoFocus
                >
                    {t("CLOSE")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

MultifactorAuthenticatorDuo.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default MultifactorAuthenticatorDuo;
