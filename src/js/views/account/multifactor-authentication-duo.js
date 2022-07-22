import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import CheckIcon from "@material-ui/icons/Check";
import { Grid } from "@material-ui/core";
import TextField from "@material-ui/core/TextField";

import Table from "../../components/table";
import duo from "../../services/duo";
import store from "../../services/store";
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
            store.getState().server.systemWideDuoExists,
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
        { name: t("YUBIKEY_TITLE") },
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
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                onDelete(tableMeta.rowData);
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
                        {!store.getState().server.systemWideDuoExists && (
                            <Grid item xs={12} sm={12} md={12}>
                                <TextField
                                    className={classes.textField}
                                    variant="outlined"
                                    margin="dense"
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
                        {!store.getState().server.systemWideDuoExists && (
                            <Grid item xs={12} sm={12} md={12}>
                                <TextField
                                    className={classes.textField}
                                    variant="outlined"
                                    margin="dense"
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
                        {!store.getState().server.systemWideDuoExists && (
                            <Grid item xs={12} sm={12} md={12}>
                                <TextField
                                    className={classes.textField}
                                    variant="outlined"
                                    margin="dense"
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
                        {!store.getState().server.systemWideDuoExists && (
                            <Grid item xs={12} sm={12} md={12}>
                                <TextField
                                    className={classes.textField}
                                    variant="outlined"
                                    margin="dense"
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
                                    !store.getState().server.systemWideDuoExists &&
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
                                margin="dense"
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
                                margin="dense"
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
