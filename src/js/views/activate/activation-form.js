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

const ActivationForm = (props) => {
    const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
    const classes = useStyles();
    const { t } = useTranslation();

    const [view, setView] = useState("default");
    const [server, setServer] = useState(getStore().getState().server.url);
    const [activateInProgress, setActivateInProgress] = useState(false);
    const [activationCode, setActivationCode] = useState(props.activationCode || "");
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


    const activateCode = () => {
        setActivateInProgress(true)

        function onError() {
            setActivateInProgress(false)
            alert("Error, should not happen.");
        }

        function onSuccess(data) {
            setActivateInProgress(false)
            setErrors([])
            setMsgs([])
            if (data.response === "success") {
                window.location.href = 'activate-successful.html';
            } else {
                if (data.error_data === null) {
                    setErrors(['SERVER_OFFLINE'])
                } else {
                    const newErrors = []
                    for (let property in data.error_data) {
                        if (data.error_data.hasOwnProperty(property)) {
                            for (let i = 0; i < data.error_data[property].length; i++) {
                                newErrors.push(data.error_data[property][i]);
                            }
                        }
                    }
                    setErrors(newErrors)
                }
            }
        }
        user.activateCode(activationCode, server)
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
                        <GridContainerErrors errors={['BEFORE_ACTIVATION_LOGOUT']} setErrors={() => {}} severity={"info"} />
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
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="activationCode"
                            multiline
                            label={t("KEY")}
                            name="activationCode"
                            autoComplete="off"
                            value={activationCode}
                            onChange={(event) => {
                                setActivationCode(event.target.value);
                            }}
                            InputProps={{
                                classes: {
                                    input: `psono-addPasswordFormButtons-covered ${classes.passwordField}`,
                                },
                            }}
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={activateCode}
                            type="submit"
                            disabled={!activationCode || activateInProgress}
                        >
                            <span style={!activateInProgress ? {} : { display: "none" }}>{t("ACTIVATE")}</span>
                            <BarLoader color={"#FFF"} height={17} width={37} loading={activateInProgress} />
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
            <>
                <GridContainerErrors errors={msgs} setErrors={setMsgs} severity={"info"} />
                <Grid container>
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
            </>
        );
    }



    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
            }}
            name="activationForm"
            autoComplete="off"
        >
            {formContent}
        </form>
    );
};

export default ActivationForm;
