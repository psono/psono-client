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
import googleAuthenticator from "../../services/google-authenticator";
import GridContainerErrors from "../../components/grid-container-errors";
import TextFieldPassword from "../../components/text-field/password";
import TextFieldQrCode from "../../components/text-field/qr";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
}));
const MultifactorAuthenticatorGoogleAuthenticator = (props) => {
    const { open, onClose } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [title, setTitle] = React.useState("");
    const [code, setCode] = React.useState("");
    const [uri, setUri] = React.useState("");
    const [newGa, setNewGa] = React.useState({});
    const [view, setView] = React.useState("default");
    const [googleAuthenticators, setGoogleAuthenticators] = React.useState([]);
    const [errors, setErrors] = useState([]);

    React.useEffect(() => {
        loadGoogleAuthenticators();
    }, []);

    const loadGoogleAuthenticators = () => {
        googleAuthenticator.readGa().then(
            function (authenticators) {
                setGoogleAuthenticators(
                    authenticators.map((authenticator, index) => {
                        return [authenticator.id, authenticator.title, authenticator.active];
                    })
                );
            },
            function (error) {
                console.log(error);
            }
        );
    };
    const generate = () => {
        setView("create_step1");

        googleAuthenticator.createGa(title).then(
            function (ga) {
                setNewGa(ga);
                setTitle("");
                setUri(ga.uri);
            },
            function (error) {
                console.log(error);
            }
        );
    };
    const showStep2 = () => {
        setView("create_step2");
    };
    const validate = () => {
        setErrors([]);

        const onSuccess = function (successful) {
            if (successful) {
                setNewGa({});
                setView("default");
                loadGoogleAuthenticators();
            } else {
                setErrors(["CODE_INCORRECT"]);
            }
        };

        const onError = function (error) {
            console.log(error);
        };

        return googleAuthenticator.activateGa(newGa.id, code).then(onSuccess, onError);
    };
    const onDelete = (rowData) => {
        setErrors([]);

        const onSuccess = function (successful) {
            loadGoogleAuthenticators();
        };

        const onError = function (error) {
            console.log(error);
        };

        return googleAuthenticator.deleteGa(rowData[0]).then(onSuccess, onError);
    };
    const onCreate = () => {
        setView("create_step0");
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("TOTP_TITLE") },
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
            <DialogTitle id="alert-dialog-title">{t("TOTP")}</DialogTitle>
            {view === "default" && (
                <DialogContent>
                    <Table data={googleAuthenticators} columns={columns} options={options} onCreate={onCreate} />
                </DialogContent>
            )}
            {view === "create_step0" && (
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
                                required
                                value={title}
                                onChange={(event) => {
                                    setTitle(event.target.value);
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <Button variant="contained" color="primary" onClick={generate} disabled={!title}>
                                {t("GENERATE")}
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>
            )}
            {view === "create_step1" && (
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
                            <TextFieldPassword
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
                                id="uri"
                                label={"URI"}
                                name="uri"
                                autoComplete="off"
                                value={uri}

                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <Button variant="contained" color="primary" onClick={showStep2}>
                                {t("SCAN_THE_CODE_THEN_CLICK_HERE")}
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>
            )}
            {view === "create_step2" && (
                <DialogContent>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
                                id="code"
                                label={t("CODE")}
                                name="code"
                                autoComplete="off"
                                helperText={t("ONE_CODE_FOR_VALIDATION")}
                                required
                                value={code}
                                onChange={(event) => {
                                    setCode(event.target.value);
                                }}
                            />
                        </Grid>
                        <GridContainerErrors errors={errors} setErrors={setErrors} />
                        <Grid item xs={12} sm={12} md={12}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={validate}
                                disabled={!code || code.length < 6}
                            >
                                {t("VALIDATE")}
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>
            )}
            <DialogActions>
                <Button
                    onClick={() => {
                        setView("default");
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

MultifactorAuthenticatorGoogleAuthenticator.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default MultifactorAuthenticatorGoogleAuthenticator;
