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

import { BarLoader } from "react-spinners";

import Table from "../../components/table";
import webauthnService from "../../services/webauthn";
import converterService from "../../services/converter";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
}));
const MultifactorAuthenticatorWebauthn = (props) => {
    const { open, onClose } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [title, setTitle] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [view, setView] = React.useState("default");
    const [webauthns, setWebauthns] = React.useState([]);
    const [errors, setErrors] = useState([]);

    React.useEffect(() => {
        loadWebauthns();
    }, []);

    const loadWebauthns = () => {
        webauthnService.readWebauthn().then(
            function (webauthns) {
                setWebauthns(
                    webauthns.map((webauthn, index) => {
                        return [webauthn.id, webauthn.title, webauthn.active];
                    })
                );
            },
            function (error) {
                console.log(error);
            }
        );
    };
    const create = () => {

        setLoading(true);

        webauthnService.createWebauthn(title).then(
            async function (webauthn) {
                setTitle("");

                webauthn.options.challenge = Uint8Array.from(webauthn.options.challenge, c => c.charCodeAt(0))
                webauthn.options.user.id = Uint8Array.from(webauthn.options.user.id, c => c.charCodeAt(0))

                let credential;
                try {
                    credential = await navigator.credentials.create({
                        publicKey: webauthn.options
                    });
                } catch (error) {
                    setLoading(false);
                    setView('default');
                    return
                }

                const onSuccess = async function (successful) {
                    await loadWebauthns();
                    setLoading(false);
                    setView('default');
                };

                const onError = function (error) {
                    console.log(error);
                    setLoading(false);
                };

                const convertedCredential = {
                    "id": credential.id,
                    "rawId": credential.id,
                    "type": credential.type,
                    "authenticatorAttachment": credential.authenticatorAttachment,
                    "response": {
                        "attestationObject": converterService.arrayBufferToBase64(credential.response.attestationObject),
                        "clientDataJSON": converterService.arrayBufferToBase64(credential.response.clientDataJSON),
                    },
                }

                return webauthnService.activateWebauthn(webauthn.id, JSON.stringify(convertedCredential)).then(onSuccess, onError);

            },
            function (error) {
                console.log(error);
            }
        );
    };
    const onDelete = (rowData) => {
        setErrors([]);

        const onSuccess = function (successful) {
            loadWebauthns();
        };

        const onError = function (error) {
            console.log(error);
        };

        return webauthnService.deleteWebauthn(rowData[0]).then(onSuccess, onError);
    };
    const onCreate = () => {
        setView("create_step0");
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("FIDO2_WEBAUTHN_TITLE") },
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
            <DialogTitle id="alert-dialog-title">{t("FIDO2_WEBAUTHN")}</DialogTitle>
            {view === "default" && (
                <DialogContent>
                    <Table data={webauthns} columns={columns} options={options} onCreate={onCreate} />
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
                            <Button variant="contained" color="primary" onClick={create} disabled={!title || loading}>
                                <span style={!loading ? {} : { display: "none" }}>{t("CREATE")}</span>
                                <BarLoader color={"#FFF"} height={17} width={37} loading={loading} />
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

MultifactorAuthenticatorWebauthn.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default MultifactorAuthenticatorWebauthn;
