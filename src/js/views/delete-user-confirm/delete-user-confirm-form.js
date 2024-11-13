import React, { useState } from "react";
import { useSelector } from "react-redux";
import { BarLoader } from "react-spinners";

import { Grid } from "@mui/material";
import { makeStyles } from '@mui/styles';
import TextField from "@mui/material/TextField";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";

import browserClient from "../../services/browser-client";
import { getStore } from "../../services/store";
import GridContainerErrors from "../../components/grid-container-errors";
import user from "../../services/user";
import MuiAlert from "@mui/material/Alert";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
        "& .MuiInputBase-root": {
            color: theme.palette.lightGreyText.main,
        },
        "& .MuiInputAdornment-root .MuiTypography-colorTextSecondary": {
            color: theme.palette.greyText.main,
        },
        "& MuiFormControl-root": {
            color: theme.palette.lightGreyText.main,
        },
        "& label": {
            color: theme.palette.lightGreyText.main,
        },
        "& .MuiInput-underline:after": {
            borderBottomColor: "green",
        },
        "& .MuiOutlinedInput-root": {
            "& fieldset": {
                borderColor: theme.palette.greyText.main,
            },
        },
    },
    passwordField: {
        fontFamily: "'Fira Code', monospace",
    },
}));

const DeleteUserConfirmForm = (props) => {
    const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
    const classes = useStyles();
    const { t } = useTranslation();

    const [view, setView] = useState("default");
    const [server, setServer] = useState(getStore().getState().server.url);
    const [deleteInProgress, setDeleteInProgress] = useState(false);
    const [errors, setErrors] = useState([]);
    const [msgs, setMsgs] = useState([]);
    const [allowCustomServer, setAllowCustomServer] = useState(true);

    React.useEffect(() => {

        browserClient.getConfig().then(onNewConfigLoaded);
    }, []);

    const onNewConfigLoaded = (configJson) => {
        const serverUrl = configJson["backend_servers"][0]["url"];
        const allowCustomServer = configJson.allow_custom_server;

        setServer(serverUrl);
        setAllowCustomServer(allowCustomServer);
    };


    const unregisterConfirm = () => {
        setDeleteInProgress(true)

        function onError(response) {
            setDeleteInProgress(false)
            console.log(response)
            if (response.hasOwnProperty("data") && response.data.hasOwnProperty("non_field_errors")) {
                setErrors(response.data.non_field_errors);
            } else {
                setErrors(["SERVER_OFFLINE"]);
            }
        }

        function onSuccess(data) {
            setDeleteInProgress(false)
            setErrors([])
            setMsgs([])
            setView('success')
        }
        user.unregisterConfirm(props.unregisterCode, server)
            .then(onSuccess, onError);
    };

    const logout = async () => {
        user.logout();
    };

    let formContent;

    if (isLoggedIn) {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <GridContainerErrors errors={['BEFORE_DELETION_LOGOUT']} setErrors={() => {}} severity={"info"} />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={logout}
                            type="submit"
                        >
                            {t("LOGOUT")}
                        </Button>
                    </Grid>
                </Grid>
            </>
        )
    } else if (view === "default") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <MuiAlert
                            severity="warning"
                            style={{
                                marginBottom: "5px",
                                marginTop: "5px",
                            }}
                        >
                            {t('DELETE_ACCOUNT_WARNING')}
                        </MuiAlert>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={unregisterConfirm}
                            type="submit"
                            disabled={!props.unregisterCode || deleteInProgress}
                        >
                            <span style={!deleteInProgress ? {} : { display: "none" }}>{t("DELETE_USER_ACCOUNT")}</span>
                            <BarLoader color={"#FFF"} height={17} width={37} loading={deleteInProgress} />
                        </Button>
                        <Button href={"index.html"}>
                            {t("ABORT")}
                        </Button>
                    </Grid>
                </Grid>
                <GridContainerErrors errors={msgs} setErrors={setMsgs} severity={"info"} />
                <GridContainerErrors errors={errors} setErrors={setErrors} />
                {allowCustomServer && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12} style={{ marginTop: "10px" }}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
                                id="server"
                                label={t("SERVER")}
                                name="server"
                                autoComplete="off"
                                value={server}
                                onChange={(event) => {
                                    setServer(event.target.value.trim());
                                }}
                            />
                        </Grid>
                    </Grid>
                )}
            </>
        );
    } else if (view === "success") {
        formContent = (
            <Grid container>
                <Grid item xs={12} sm={12} md={12} style={{ textAlign: "center" }}>
                    <ThumbUpIcon style={{ fontSize: 160 }} />
                </Grid>
                <GridContainerErrors errors={msgs} setErrors={setMsgs} severity={"info"} />
                <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {window.location.href = "index.html";}}
                        type="submit"
                    >
                        <span>{t("BACK_TO_HOME")}</span>
                    </Button>
                </Grid>
            </Grid>
        );
    }



    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
            }}
            name="deleteUserConfirmForm"
            autoComplete="off"
        >
            {formContent}
        </form>
    );
};

export default DeleteUserConfirmForm;
