import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { Grid } from "@mui/material";
import { makeStyles } from '@mui/styles';
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import MuiAlert from '@mui/material/Alert'
import Button from "@mui/material/Button";

import browserClient from "../../services/browser-client";
import helperService from "../../services/helper";
import user from "../../services/user";
import GridContainerErrors from "../../components/grid-container-errors";
import { getStore } from "../../services/store";
import FooterLinks from "../../components/footer-links";

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
    button: {
        color: "white !important",
    },
    inputAdornment: {
        color: theme.palette.lightGreyText.main,
    },
    horizontalline: {
        width: "100%",
        textAlign: "center",
        borderBottom: `1px solid ${theme.palette.background.default}` ,
        lineHeight: "0.1em",
        margin: "20px 0",
        "& span": {
            backgroundColor: theme.palette.blueBackground.main,
            padding: "0 10px",
        },
    },
}));

const DeleteUserViewForm = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();

    const [view, setView] = useState("default");
    const [username, setUsername] = useState(getStore().getState().user.username);

    const [email, setEmail] = useState("");
    const [server, setServer] = useState(getStore().getState().server.url);
    const [domain, setDomain] = useState("");
    const [errors, setErrors] = useState([]);
    const [allowDeleteAccount, setAllowDeleteAccount] = useState(false);
    const [allowCustomServer, setAllowCustomServer] = useState(true);

    let isSubscribed = true;
    React.useEffect(() => {
        browserClient.getConfig().then(onNewConfigLoaded);
        return () => (isSubscribed = false);
    }, []);


    const onNewConfigLoaded = (configJson) => {
        if (!isSubscribed) {
            return;
        }
        const serverUrl = configJson["backend_servers"][0]["url"];
        const domain = configJson["backend_servers"][0]["domain"];
        const allowDeleteAccount = configJson.allow_delete_account;
        const allowCustomServer = configJson.allow_custom_server;

        setAllowDeleteAccount(allowDeleteAccount);
        setServer(serverUrl);
        setDomain(domain);
        setAllowCustomServer(allowCustomServer);
    };

    const deleteAccount = () => {
        setErrors([]);
        let parsedUrl = helperService.parseUrl(server);

        // Validate now the username
        let fullUsername = helperService.formFullUsername(username, domain || parsedUrl["full_domain_without_www"]);
        const testResult = helperService.isValidUsername(fullUsername);
        if (testResult) {
            setErrors([testResult]);
            return;
        }

        function onError(data) {
            if (data.hasOwnProperty("data") && data.data.hasOwnProperty("non_field_errors")) {
                setErrors(data.data.non_field_errors);
            } else if (data.hasOwnProperty("errors")) {
                let errors = data.errors;
                setErrors(errors);
            } else if (typeof (data) === 'object') {
                console.log(data);
                setErrors(["RECEIVED_MALFORMED_RESPONSE"]);
            } else  {
                console.log(data);
                setErrors([data]);
            }
        }

        function onSuccess(data) {
            if (data.hasOwnProperty("message")) {
                setErrors([data.message]);
            } else {
                setView("success");
            }
        }

        user.unregister(username, email).then(onSuccess, onError);
    };

    let formContent;

    if (view === "default") {
        formContent = (
            <>
                {!allowDeleteAccount && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <MuiAlert
                                severity="info"
                                style={{
                                    marginBottom: "5px",
                                    marginTop: "5px",
                                }}
                            >
                                {t("USER_ACCOUNT_DELETION_HAS_BEEN_DISABLED")}
                            </MuiAlert>
                        </Grid>
                        <Grid item xs={6} sm={6} md={6} style={{ marginTop: "5px", marginBottom: "5px" }}>
                            <Button
                                variant="contained"
                                color="primary"
                                type="submit"
                                href={"index.html"}
                                className={classes.button}
                            >
                                {t("BACK_TO_HOME")}
                            </Button>
                        </Grid>
                    </Grid>
                )}
                {allowDeleteAccount && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
                                id="username"
                                label={t("USERNAME")}
                                InputProps={{
                                    endAdornment:
                                        domain && !username.includes("@") ? (
                                            <InputAdornment position="end"><span className={classes.inputAdornment}>{"@" + domain}</span></InputAdornment>
                                        ) : null,
                                }}
                                name="username"
                                autoComplete="off"
                                value={username}
                                onChange={(event) => {
                                    setUsername(event.target.value);
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <p className={classes.horizontalline}>
                                <span>{t("OR")}</span>
                            </p>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
                                id="email"
                                type="email"
                                label={t("EMAIL")}
                                name="email"
                                autoComplete="off"
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value);
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <MuiAlert
                                severity="info"
                                style={{
                                    marginBottom: "5px",
                                    marginTop: "5px",
                                }}
                            >
                                {t("DELETE_ACCOUNT_INFO")}
                            </MuiAlert>
                        </Grid>
                    </Grid>
                )}

                {allowDeleteAccount && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={deleteAccount}
                                type="submit"
                                disabled={Boolean((!username && !email) || (username && email))}
                            >
                                {t("REQUEST_ACCOUNT_DELETION")}
                            </Button>
                            <Button href={"index.html"}>
                                {t("ABORT")}
                            </Button>
                        </Grid>
                    </Grid>
                )}
                <GridContainerErrors errors={errors} setErrors={setErrors} />
                {allowCustomServer && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
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
                                    setDomain(helperService.getDomainWithoutWww(event.target.value.trim()));
                                }}
                            />
                        </Grid>
                    </Grid>
                )}
            </>
        );
    }

    if (view === "success") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ textAlign: "center" }}>
                        <ThumbUpIcon style={{ fontSize: 160 }} />
                    </Grid>
                    <Grid item xs={6} sm={6} md={6} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            type="submit"
                            href={"index.html"}
                            className={classes.button}
                        >
                            {t("BACK_TO_HOME")}
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
            name="deleteUserForm"
            autoComplete="off"
        >
            {formContent}
            <div className="box-footer">
                <FooterLinks />
            </div>
        </form>
    );
};

export default DeleteUserViewForm;
