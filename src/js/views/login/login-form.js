import React, { useState } from "react";
import { Grid, Checkbox, DialogContent, CircularProgress } from "@mui/material";
import { makeStyles } from "@mui/styles";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import { Check } from "@mui/icons-material";
import MuiAlert from '@mui/material/Alert'
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import { BarLoader } from "react-spinners";
import { useHistory } from "react-router-dom";

import browserClient from "../../services/browser-client";
import helperService from "../../services/helper";
import ivaltClient from "../../services/ivalt";
import user from "../../services/user";
import host from "../../services/host";
import deviceService from "../../services/device";
import webauthnService from "../../services/webauthn";
import converterService from "../../services/converter";
import { getStore } from "../../services/store";
import { useSelector } from "react-redux";
import action from "../../actions/bound-action-creators";
import GridContainerErrors from "../../components/grid-container-errors";
import FooterLinks from "../../components/footer-links";
import datastoreSettingService from "../../services/datastore-setting";
import TextWithLineBreaks from "../../components/text-with-linebreaks";
import {useTheme} from "@mui/material/styles";
import PropTypes from "prop-types";
import LoginView from "./index";

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
    checked: {
        color: theme.palette.checked.main,
    },
    checkedIcon: {
        width: "20px",
        height: "20px",
        border: `1px solid ${theme.palette.greyText.main}`,
        borderRadius: "3px",
    },
    uncheckedIcon: {
        width: "0px",
        height: "0px",
        padding: "9px",
        border: `1px solid ${theme.palette.greyText.main}`,
        borderRadius: "3px",
    },
	container: {
		background: "gray",
		position: "relative",
		display: "inline-block",
	},
	image: {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		zIndex: 1,
	},
	progress: {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		zIndex: 0,
	},
    inputAdornment: {
        color: theme.palette.lightGreyText.main,
    },
    regularButtonText: {
        color: theme.palette.lightGreyText.main,
    },
    borderSection: {
        border: `1px solid ${theme.palette.background.default}` ,
        padding: "8px",
        marginLeft: "-8px",
        marginRight: "-8px",
        marginBottom: "theme.spacing(1)",
        marginTop: theme.spacing(2),
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
const defaultTimer = 2 * 60;
const LoginViewForm = (props) => {
    const theme = useTheme();
    const classes = useStyles();
    const { t } = useTranslation();
    const history = useHistory();
    const [view, setView] = useState("default");
	const [username, setUsername] = useState(
		getStore().getState().user.username
	);
    const [password, setPassword] = useState("");
    const [server, setServer] = useState(getStore().getState().server.url);
    const [rememberMe, setRememberMe] = useState(getStore().getState().user.rememberMe);
    const [providerId, setProviderId] = useState(0);
    const [trustDevice, setTrustDevice] = useState(getStore().getState().user.trustDevice);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginPossible, setLoginPossible] = useState(false);
    const [domain, setDomain] = useState("");
    const [gaToken, setGaToken] = useState("");
    const [yubikeyOtpToken, setYubikeyOtpToken] = useState("");
    const [duoToken, setDuoToken] = useState("");
    const [errors, setErrors] = useState([]);
    const [multifactors, setMultifactors] = useState([]);
    const [allowRegistration, setAllowRegistration] = useState(false);
    const [loginType, setLoginType] = useState("");
    const [plainPasswordWhitelistedServerUrls, setPlainPasswordWhitelistedServerUrls] = useState([]);
    const [allowLostPassword, setAllowLostPassword] = useState(false);
    const [allowDeleteAccount, setAllowDeleteAccount] = useState(false);
    const [authkeyEnabled, setAuthkeyEnabled] = useState(false);
    const [ldapEnabled, setLdapEnabled] = useState(false);
    const [samlEnabled, setSamlEnabled] = useState(false);
    const [oidcEnabled, setOidcEnabled] = useState(false);
    const [loginInfoText, setLoginInfoText] = useState("");
    const [serverCheck, setServerCheck] = useState({});
    const [samlProvider, setSamlProvider] = useState([]);
    const [oidcProvider, setOidcProvider] = useState([]);
    const [allowCustomServer, setAllowCustomServer] = useState(true);
    const [allowUsernamePasswordLogin, setAllowUsernamePasswordLogin] = useState(true);
    const [decryptLoginDataFunction, setDecryptLoginDataFunction] = useState(null);
    const ivalt = useSelector((store) => store.user.ivalt);
	const [timer, setTimer] = useState(defaultTimer);
	const [ivaltLoading, setIvaltLoading] = useState(false);
    const errorsResponses = {
        AUTHENTICATION_FAILED: t("IVALT_AUTH_FAILED"),
        BIOMETRIC_AUTH_REQUEST_SUCCESSFULLY_SENT: t("IVALT_AUTH_REQUEST_SENT"),
        INVALID_TIMEZONE: t("IVALT_INVALID_TIMEZONE"),
        INVALID_GEOFENCE: t("IVALT_INVALID_GEOFENCE"),
    };
    React.useEffect(() => {
		let timerInterval;
		let timeout;

		if (ivaltLoading) {
			timerInterval = setInterval(() => {
				if (timer <= 0) {
					setIvaltLoading(false);
					setTimer(defaultTimer);
					clearInterval(timerInterval);
					setErrors([t("IVALT_AUTH_TIMEOUT")]);

					return;
				}
				if (timer % 2 == 0) {
					validateIvalt();
				}
				setTimer((prevTimer) => prevTimer - 1);
			}, 1000);
		}

		return () => {
			clearInterval(timerInterval);
			clearTimeout(timeout);
		};
	}, [ivaltLoading, timer]);


    const validateIvalt = () => {
		ivaltClient.validateIvaltTwoFactor().then(
			(res) => {
				if (res.data.non_field_errors === undefined) {
					setIvaltLoading(false);
					setTimer(defaultTimer);

                    let requiredMultifactors = [...multifactors];
                    if (getStore().getState().server.multifactorEnabled) {
                        helperService.removeFromArray(requiredMultifactors, "ivalt_2fa");
                    } else {
                        requiredMultifactors = [];
                    }

					setMultifactors(requiredMultifactors);
				} else if (
					errorsResponses[res.data.non_field_errors[0]] !==
						undefined &&
					res.data.non_field_errors[0] !== "AUTHENTICATION_FAILED"
				) {
					setErrors([errorsResponses[res.data.non_field_errors[0]]]);
					setIvaltLoading(false);
				}
			},
			(error, res) => {
				console.log(error, "ERROR RESPONSE");
				
			}
		);
	};
    React.useEffect(() => {
        if (props.samlTokenId) {
            setLoginLoading(true);
            user.samlLogin(props.samlTokenId).then(
                (loginDetails) => {
                    setLoginLoading(false);
                    handleLogin(loginDetails)
                },
                (errors) => {
                    setErrors(errors);
                }
            );
        }
        if (props.oidcTokenId) {
            setLoginLoading(true);
            user.oidcLogin(props.oidcTokenId).then(
                (loginDetails) => {
                    setLoginLoading(false);
                    handleLogin(loginDetails);
                },
                (errors) => {
                    setErrors(errors);
                }
            );
        }

        browserClient.getConfig().then(onNewConfigLoaded);
    }, []);

    React.useEffect(() => {
        requirementCheckMfa(multifactors);
    }, [multifactors]);


    const handleLogin = (loginDetails) => {
        if (loginDetails.hasOwnProperty("required_multifactors")) {
            const requiredMultifactors = loginDetails["required_multifactors"];
            action().setHasTwoFactor(requiredMultifactors.length > 0);
            setMultifactors(requiredMultifactors);
        }
        if (loginDetails.hasOwnProperty('require_password')) {
            setDecryptLoginDataFunction(() => loginDetails["require_password"]);
        }
    }

    const decryptData = () => {
        const loginDetails = decryptLoginDataFunction(password);
        if (loginDetails.hasOwnProperty("required_multifactors")) {
            const requiredMultifactors = loginDetails["required_multifactors"];
            action().setHasTwoFactor(requiredMultifactors.length > 0);
            setMultifactors(requiredMultifactors);
        }
        if (loginDetails.hasOwnProperty('require_password')) {
            setErrors(['PASSWORD_INCORRECT'])
        }
    };

    const hasLdapAuth = (serverCheck) => {
        return (
            serverCheck.hasOwnProperty("info") &&
            serverCheck["info"].hasOwnProperty("authentication_methods") &&
            serverCheck["info"]["authentication_methods"].indexOf("LDAP") !== -1
        );
    };

    const verifyDuo = () => {
        let duoCode = duoToken;
        if (duoCode === "") {
            duoCode = undefined;
        }

        user.duoVerify(duoCode).then(
            () => {
                let requiredMultifactors = [...multifactors];
                if (getStore().getState().server.multifactorEnabled) {
                    helperService.removeFromArray(requiredMultifactors, "duo_2fa");
                } else {
                    requiredMultifactors = [];
                }

                setMultifactors(requiredMultifactors);
            },
            (errors) => {
                console.log(errors);
                setErrors(errors);
            }
        );
    };

    const verifyWebauthn = () => {
        webauthnService.verifyWebauthnInit().then(
            async function (webauthn) {
                webauthn.options.challenge = Uint8Array.from(webauthn.options.challenge, c => c.charCodeAt(0))
                for (let i = 0; i < webauthn.options.allowCredentials.length; i++) {
                    webauthn.options.allowCredentials[i]['id'] = converterService.base64UrlToArrayBuffer(webauthn.options.allowCredentials[i]['id'])
                }

                let credential;
                try {
                    credential = await navigator.credentials.get({
                        publicKey: webauthn.options
                    });
                } catch (error) {
                    setView('default');
                    return
                }

                const onSuccess = async function (successful) {
                    let requiredMultifactors = [...multifactors];
                    if (getStore().getState().server.multifactorEnabled) {
                        helperService.removeFromArray(requiredMultifactors, "webauthn_2fa");
                    } else {
                        requiredMultifactors = [];
                    }
                    setMultifactors(requiredMultifactors);
                };

                const onError = function (error) {
                    console.log(error);
                    setErrors(["WEBAUTHN_FIDO2_TOKEN_NOT_FOUND"]);
                };

                const convertedCredential = {
                    "id": credential.id,
                    "rawId": credential.id,
                    "type": credential.type,
                    "authenticatorAttachment": credential.authenticatorAttachment,
                    "response": {
                        "authenticatorData": converterService.arrayBufferToBase64(credential.response.authenticatorData),
                        "clientDataJSON": converterService.arrayBufferToBase64(credential.response.clientDataJSON),
                        "signature": converterService.arrayBufferToBase64(credential.response.signature),
                        "userHandle": converterService.arrayBufferToBase64(credential.response.userHandle),
                    },
                }

                return webauthnService.verifyWebauthn(JSON.stringify(convertedCredential)).then(onSuccess, onError);

            },
            function (error) {
                console.log(error);
                setErrors(["WEBAUTHN_FIDO2_TOKEN_NOT_FOUND_FOR_THIS_ORIGIN"]);
            }
        );
    };

    const showGa2faForm = () => {
        setView("google_authenticator");
        setLoginLoading(false);
    };

    const showYubikeyOtp2faForm = () => {
        setView("yubikey_otp");
        setLoginLoading(false);
    };

    const showDuo2faForm = () => {
        setView("duo");
        setLoginLoading(false);
        verifyDuo();
    };

    const showWebauthn2faForm = () => {
        setView("webauthn");
        setLoginLoading(false);
        verifyWebauthn();
    };

    const handleMfa = (multifactors) => {
        if (getStore().getState().server.multifactorEnabled === false && multifactors.length > 1) {
            // show choose multifactor screen as only one is required to be solved
            setView("pick_second_factor");
            setLoginLoading(false);
        } else if (multifactors.indexOf("webauthn_2fa") !== -1) {
            showWebauthn2faForm();
        } else if (multifactors.indexOf("yubikey_otp_2fa") !== -1) {
            showYubikeyOtp2faForm();
        } else if (multifactors.indexOf("google_authenticator_2fa") !== -1) {
            showGa2faForm();
        } else if (multifactors.indexOf("duo_2fa") !== -1) {
            showDuo2faForm();
        } else if (multifactors.indexOf("ivalt_2fa") !== -1) {
			setIvaltLoading(true);
			sendIvaltAuthRequest();
			showIvaltForm();
		} else {
            setView("default");
            setLoginLoading(false);
            setErrors(["Unknown multi-factor authentication requested by server."]);
        }
    };

    const sendIvaltAuthRequest = () => {
		setErrors([]);
		ivaltClient.sendTwoFactorNotification().then(
			(createdIvalt) => {
				validateIvalt();
			},
			function (error) {
				if (error.hasOwnProperty("non_field_errors")) {
					setErrors(error.non_field_errors);
				} else {
					console.error(error);
				}
			}
		);
	};

	const showIvaltForm = () => {
		setView("ivalt");
		setLoginLoading(false);
	};

    const requirementCheckMfa = (multifactors) => {
        if (!getStore().getState().user.token) {
            return;
        }
        if (multifactors.length === 0) {
            user.activateToken().then(() => {
                //setLoginLoading(false);

                if (props.samlTokenId) {
                    history.push("/");
                } else if (props.oidcTokenId) {
                    history.push("/");
                }
                setTimeout(function () {
                    // initialize settings datastore
                    datastoreSettingService.getSettingsDatastore();
                }, 1);
            });
        } else {
            setLoginLoading(false);
            handleMfa(multifactors);
        }
    };

    const disapproveNewServer = () => {
        setView("default");
        setLoginLoading(false);
        setPassword("");
        setErrors([]);
    };

    const approveHost = () => {
        host.approveHost(serverCheck.server_url, serverCheck.verify_key);

        if (loginType === "SAML") {
            initiateSamlLogin(providerId, server);
        } else if (loginType === "OIDC") {
            initiateOidcLogin(providerId, server);
        } else if (loginType === "LOAD_REMOTE_CONFIG") {
            const onError = function (data) {
                console.log(data);
            };

            const onSuccess = function () {
                const onError = function (data) {
                    console.log(data);
                };

                browserClient.getConfig().then(onNewConfigLoaded, onError);
            };
            setView("default");
            host.loadRemoteConfig(serverCheck["info"]["web_client"], serverCheck["server_url"]).then(
                onSuccess,
                onError
            );
        } else if (hasLdapAuth(serverCheck)) {
            if (getStore().getState().persistent.autoApproveLdap.hasOwnProperty(serverCheck.server_url) || plainPasswordWhitelistedServerUrls.includes(serverCheck.server_url)) {
                const userPassword = password;
                setPassword("");

                user.login(userPassword, serverCheck, true).then(
                    handleLogin,
                    (result) => {
                        setLoginLoading(false);
                        if (result.hasOwnProperty("non_field_errors")) {
                            const errors = result.non_field_errors;
                            setErrors(errors);
                        } else {
                            console.log(result);
                            setErrors([result]);
                        }
                    }
                );
            } else {
                setView("ask_send_plain");
                setLoginLoading(false);
            }
        } else {
            const userPassword = password;
            setPassword("");

            user.login(userPassword, serverCheck).then(
                handleLogin,
                (result) => {
                    setLoginLoading(false);
                    if (result.hasOwnProperty("non_field_errors")) {
                        const errors = result.non_field_errors;
                        setErrors(errors);
                    } else {
                        console.log(result);
                        setErrors([result]);
                    }
                }
            );
        }
    };

    const gaVerify = (e) => {
        const onError = function (errors) {
            setErrors(errors);
        };

        const onSuccess = function () {
            let requiredMultifactors = [...multifactors];
            if (getStore().getState().server.multifactorEnabled) {
                helperService.removeFromArray(requiredMultifactors, "google_authenticator_2fa");
            } else {
                requiredMultifactors = [];
            }
            setMultifactors(requiredMultifactors);
        };
        user.gaVerify(gaToken).then(onSuccess, onError);
    };

    const yubikeyOtpVerify = (e) => {
        const onError = function (errors) {
            setErrors(errors);
        };

        const onSuccess = function () {
            let requiredMultifactors = [...multifactors];
            if (getStore().getState().server.multifactorEnabled) {
                helperService.removeFromArray(requiredMultifactors, "yubikey_otp_2fa");
            } else {
                requiredMultifactors = [];
            }
            setMultifactors(requiredMultifactors);
        };
        user.yubikeyOtpVerify(yubikeyOtpToken).then(onSuccess, onError);
    };

    const duoVerify = (e) => {
        let duoCode = duoToken;
        if (duoCode === "") {
            duoCode = undefined;
        }
        const onError = function (errors) {
            setErrors(errors);
        };

        const onSuccess = function () {
            let requiredMultifactors = [...multifactors];
            if (getStore().getState().server.multifactorEnabled) {
                helperService.removeFromArray(requiredMultifactors, "duo_2fa");
            } else {
                requiredMultifactors = [];
            }
            setMultifactors(requiredMultifactors);
        };
        user.duoVerify(duoCode).then(onSuccess, onError);
    };

    const cancel = (e) => {
        setView("default");
        setPassword("");
        setErrors([]);
        setLoginLoading(false);
        setDecryptLoginDataFunction(null);
    };

    const nextLoginStep = (sendPlain, serverCheck) => {
        const userPassword = password;
        setPassword("");

        return user.login(userPassword, serverCheck, sendPlain).then(
            handleLogin,
            (result) => {
                setLoginLoading(false);
                if (result.hasOwnProperty("non_field_errors")) {
                    const errors = result.non_field_errors;
                    setView("default");
                    setErrors(errors);
                } else if (result.hasOwnProperty("errors")) {
                    const errors = result.errors;
                    setView("default");
                    setErrors(errors);
                } else {
                    console.log(result);
                    setView("default");
                    setErrors([result]);
                }
            }
        );
    };

    const disapproveSendPlain = () => {
        return nextLoginStep(false, serverCheck);
    };
    const approveSendPlain = () => {
        const autoApproveLdap = helperService.duplicateObject(getStore().getState().persistent.autoApproveLdap);
        autoApproveLdap[serverCheck.server_url] = true;
        action().setAutoApproveLdap(autoApproveLdap);
        return nextLoginStep(true, serverCheck);
    };

    const onNewConfigLoaded = (configJson) => {
        const serverUrl = configJson["backend_servers"][0]["url"];
        const domain = configJson["backend_servers"][0]["domain"];
        const plainPasswordWhitelistedServerUrls = configJson["backend_servers"].filter(function(server) {
            return server.hasOwnProperty('autoapprove_plain_password') && !!server['autoapprove_plain_password']
        }).map(function(server) {
            return server["url"]
        })
        const allowRegistration =
            !configJson.hasOwnProperty("allow_registration") ||
            (configJson.hasOwnProperty("allow_registration") && configJson["allow_registration"]);
        const allowLostPassword = configJson.allow_lost_password;
        const samlProvider = configJson.saml_provider;
        const oidcProvider = configJson.oidc_provider;
        const authenticationMethods = configJson.authentication_methods;
        const allowDeleteAccount = configJson.allow_delete_account;
        const allowCustomServer = configJson.allow_custom_server;
        const trustDeviceDefault = configJson.trust_device_default;
        const rememberMeDefault = configJson.remember_me_default;
        const allowUsernamePasswordLogin =
            authenticationMethods.includes("AUTHKEY") || authenticationMethods.includes("LDAP");
        const authkeyEnabled = configJson["authentication_methods"].indexOf("AUTHKEY") !== -1;
        const ldapEnabled = configJson["authentication_methods"].indexOf("LDAP") !== -1;
        const samlEnabled = configJson["authentication_methods"].indexOf("SAML") !== -1;
        const oidcEnabled = configJson["authentication_methods"].indexOf("OIDC") !== -1;
        const loginInfoText = configJson["login_info_text"];

        setPlainPasswordWhitelistedServerUrls(plainPasswordWhitelistedServerUrls);
        setAllowLostPassword(allowLostPassword);
        setAllowDeleteAccount(allowDeleteAccount);
        setAllowRegistration(allowRegistration);
        let newServer = server;
        if (!newServer) {
            // if we didn't "remember" a server, we will take the one from the config.
            newServer = serverUrl;
        }
        setServer(newServer);
        setDomain(domain);
        setSamlProvider(samlProvider);
        setOidcProvider(oidcProvider);
        setTrustDevice(trustDevice || trustDeviceDefault);
        setRememberMe(rememberMe || rememberMeDefault);
        setAllowCustomServer(allowCustomServer);
        setAllowUsernamePasswordLogin(allowUsernamePasswordLogin);
        setAuthkeyEnabled(authkeyEnabled);
        setLdapEnabled(ldapEnabled);
        setSamlEnabled(samlEnabled);
        setOidcEnabled(oidcEnabled);
        setLoginInfoText(loginInfoText);
        if (!authkeyEnabled && !ldapEnabled && configJson.hasOwnProperty('auto_login') && configJson['auto_login']) {
            setTimeout(function () {
                if (!props.samlTokenId && !props.oidcTokenId) {
                    if (oidcEnabled && oidcProvider.length === 1) {
                        initiateOidcLogin(oidcProvider[0].provider_id, newServer);
                    }
                    if (samlEnabled && samlProvider.length === 1) {
                        initiateSamlLogin(samlProvider[0].provider_id, newServer);
                    }
                }
            }, 1);
        }

    };

    const remoteConfig = (event) => {
        event.preventDefault();

        if (loginLoading) {
            return;
        }

        action().setServerUrl(server);
        setErrors([]);

        const onError = function (error) {
            console.log(error);
            setErrors(["SERVER_OFFLINE"]);
        };

        const onSuccess = function (serverCheck) {
            setServerCheck(serverCheck);
            action().setServerInfo(serverCheck.info, serverCheck.verify_key);

            if (serverCheck.status !== "matched") {
                setView(serverCheck.status);
                setLoginType("LOAD_REMOTE_CONFIG");
                return;
            }

            const onError = function (data) {
                console.log(data);
            };

            const onSuccess = function () {
                const onError = function (data) {
                    console.log(data);
                };

                browserClient.getConfig().then(onNewConfigLoaded, onError);
            };
            setView("default");
            host.loadRemoteConfig(serverCheck["info"]["web_client"], serverCheck["server_url"]).then(
                onSuccess,
                onError
            );
        };
        host.checkHost(server).then(onSuccess, onError);
    };

    const initiateOidcLogin = (providerId, server) => {
        setLoginLoading(true);
        setLoginType("OIDC");
        setErrors([]);
        setProviderId(providerId);
        return user
            .initiateOidcLogin(server, rememberMe, trustDevice, true)
            .then(
                (serverCheck) => {
                    setServerCheck(serverCheck);
                    action().setServerInfo(serverCheck.info, serverCheck.verify_key);
                    if (serverCheck.status !== "matched") {
                        setView(serverCheck.status);
                    } else {
                        user.getOidcRedirectUrl(providerId).then((result) => {
                            browserClient.launchWebAuthFlow(result.oidc_redirect_url).then((oidcTokenid) => {
                                // comes only here in extensions
                                if (oidcTokenid) {
                                    user.oidcLogin(oidcTokenid).then(
                                        handleLogin,
                                        (errors) => {
                                            setErrors(errors);
                                        }
                                    );
                                }
                            });
                        }, (result) => {
                            setLoginLoading(false);
                            console.log(result);
                        });
                    }
                },
                (result) => {
                    if (result.hasOwnProperty("errors")) {
                        let errors = result.errors;
                        setLoginLoading(false);
                        setErrors(errors);
                    } else if (typeof (result) === 'object') {
                        console.log(result);
                        setLoginLoading(false);
                        setErrors(["RECEIVED_MALFORMED_RESPONSE"]);
                    } else {
                        console.log(result);
                        setLoginLoading(false);
                        setErrors([result]);
                    }
                }
            )
            .catch((result) => {
                setLoginLoading(false);
                return Promise.reject(result);
            });
    };

    const initiateSamlLogin = (providerId, server) => {
        setLoginLoading(true);
        setLoginType("SAML");
        setErrors([]);
        setProviderId(providerId);
        return user
            .initiateSamlLogin(server, rememberMe, trustDevice, true)
            .then(
                (serverCheck) => {
                    setServerCheck(serverCheck);
                    action().setServerInfo(serverCheck.info, serverCheck.verify_key);
                    if (serverCheck.status !== "matched") {
                        setView(serverCheck.status);
                    } else {
                        user.getSamlRedirectUrl(providerId).then((result) => {
                            browserClient.launchWebAuthFlow(result.saml_redirect_url).then((samlTokenid) => {
                                // comes only here in extensions
                                if (samlTokenid) {
                                    user.samlLogin(samlTokenid).then(
                                        handleLogin,
                                        (errors) => {
                                            setErrors(errors);
                                        }
                                    );
                                }
                            });
                        }, (result) => {
                            setLoginLoading(false);
                            console.log(result);
                        });
                    }
                },
                (result) => {
                    if (result.hasOwnProperty("errors")) {
                        let errors = result.errors;
                        setLoginLoading(false);
                        setErrors(errors);
                    } else if (typeof (result) === 'object') {
                        console.log(result);
                        setLoginLoading(false);
                        setErrors(["RECEIVED_MALFORMED_RESPONSE"]);
                    } else {
                        console.log(result);
                        setLoginLoading(false);
                        setErrors([result]);
                    }
                }
            )
            .catch((result) => {
                setLoginLoading(false);
                return Promise.reject(result);
            });
    };

    const initiateLogin = () => {
        setLoginLoading(true);
        setLoginType("");
        setErrors([]);

        let parsedUrl = helperService.parseUrl(server);

        let fullUsername = helperService.formFullUsername(username, domain || parsedUrl["full_domain_without_www"]);

        return user
            .initiateLogin(fullUsername, server, rememberMe, trustDevice, true)
            .then(
                (serverCheck) => {
                    setServerCheck(serverCheck);
                    action().setServerInfo(serverCheck.info, serverCheck.verify_key);
                    if (serverCheck.status !== "matched") {
                        setView(serverCheck.status);
                    } else if (hasLdapAuth(serverCheck)) {
                        if (getStore().getState().persistent.autoApproveLdap.hasOwnProperty(serverCheck.server_url) || plainPasswordWhitelistedServerUrls.includes(serverCheck.server_url)) {
                            return nextLoginStep(true, serverCheck);
                        } else {
                            setView("ask_send_plain");
                            setLoginLoading(false);
                        }
                    } else {
                        return nextLoginStep(false, serverCheck);
                    }
                },
                (result) => {
                    if (result.hasOwnProperty("errors")) {
                        setLoginLoading(false);
                        setErrors(result.errors);
                    } else if (result.hasOwnProperty("data") && result.data.hasOwnProperty("non_field_errors")) {
                        setLoginLoading(false);
                        setErrors(result.data.non_field_errors);
                    } else if (typeof (result) === 'object') {
                        console.log(result);
                        setLoginLoading(false);
                        setErrors(["RECEIVED_MALFORMED_RESPONSE"]);
                    } else {
                        console.log(result);
                        setLoginLoading(false);
                        setErrors([result]);
                    }
                }
            )
            .catch((result) => {
                setLoginLoading(false);
                console.log(result);
                // return Promise.reject(result);
            });
    };
    const redirectRegister = () => {
        window.location.href = "register.html";
    };

    let formContent;

    if (decryptLoginDataFunction !== null) {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <MuiAlert
                            severity="info"
                            style={{
                                marginBottom: "5px",
                                marginTop: "5px",
                            }}
                        >
                            {t("ENTER_PASSWORD_TO_DECRYPT_YOUR_DATASTORE")}
                        </MuiAlert>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="password"
                            label={t("PASSWORD")}
                            InputProps={{
                                type: "password",
                            }}
                            name="password"
                            autoComplete="off"
                            value={password}
                            onChange={(event) => {
                                setPassword(event.target.value);
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={decryptData}
                            type="submit"
                            style={{ marginRight: "10px" }}
                        >
                            {t("DECRYPT")}
                        </Button>
                        <Button onClick={cancel}>
                            <span className={classes.regularButtonText}>{t("CANCEL")}</span>
                        </Button>
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
            </>
        )
    } else if (view === "default") {
        formContent = (
            <>
                <div className={classes.borderSection}>
                {oidcProvider.map((provider, i) => {
                    const initiateOidcLoginHelper = () => {
                        return initiateOidcLogin(provider.provider_id, server);
                    };
                    return (
                        <Grid container key={i}>
                            {i > 0 && <p className={classes.horizontalline}>
                                <span>{t("OR")}</span>
                            </p>}
                            <Grid item xs={12} sm={12} md={12}>
                            {provider.title}
                            </Grid>
                            <Grid item xs={12} sm={12} md={12} style={{ marginTop: "8px" }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={initiateOidcLoginHelper}
                                    type={Boolean(username) && Boolean(password) ? "button": "submit"}
                                    id="sad"
                                    disabled={loginLoading}
                                >
                                    <span
                                        style={
                                            !loginLoading
                                                ? {}
                                                : {
                                                      display: "none",
                                                  }
                                        }
                                    >
                                        {provider.button_name}
                                    </span>
                                    <BarLoader color={"#FFF"} height={17} width={37} loading={loginLoading} />
                                </Button>
                            </Grid>
                        </Grid>
                    );
                })}
                {oidcEnabled && oidcProvider.length > 0 && (samlEnabled || authkeyEnabled || ldapEnabled) && (
                    <p className={classes.horizontalline}>
                        <span>{t("OR")}</span>
                    </p>
                )}
                {samlProvider.map((provider, i) => {
                    const initiateSamlLoginHelper = () => {
                        return initiateSamlLogin(provider.provider_id, server);
                    };
                    return (
                        <Grid container key={i}>
                            {i > 0 && <p className={classes.horizontalline}>
                                <span>{t("OR")}</span>
                            </p>}
                            <Grid item xs={12} sm={12} md={12}>
                                {provider.title}
                            </Grid>
                            <Grid item xs={12} sm={12} md={12} style={{ marginTop: "8px" }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={initiateSamlLoginHelper}
                                    type={Boolean(username) && Boolean(password) ? "button": "submit"}
                                    id="sad"
                                    disabled={loginLoading}
                                >
                                    <span
                                        style={
                                            !loginLoading
                                                ? {}
                                                : {
                                                      display: "none",
                                                  }
                                        }
                                    >
                                        {provider.button_name}
                                    </span>
                                    <BarLoader color={"#FFF"} height={17} width={37} loading={loginLoading} />
                                </Button>
                            </Grid>
                        </Grid>
                    );
                })}
                {samlEnabled && samlProvider.length > 0 && (authkeyEnabled || ldapEnabled) && (
                    <p className={classes.horizontalline}>
                        <span>{t("OR")}</span>
                    </p>
                )}
                {allowUsernamePasswordLogin && (
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
                                autoFocus
                                value={username}
                                onChange={(event) => {
                                    setUsername(event.target.value);
                                    setLoginPossible(!!event.target.value && !!password);
                                }}
                            />
                        </Grid>
                    </Grid>
                )}
                {allowUsernamePasswordLogin && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
                                id="password"
                                label={t("PASSWORD")}
                                InputProps={{
                                    type: "password",
                                }}
                                name="password"
                                autoComplete="off"
                                value={password}
                                onChange={(event) => {
                                    setPassword(event.target.value);
                                    setLoginPossible(!!username && !!event.target.value);
                                }}
                            />
                        </Grid>
                    </Grid>
                )}


                {allowUsernamePasswordLogin && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={initiateLogin}
                                type="submit"
                                disabled={!loginPossible || loginLoading}
                            >
                                <span style={!loginLoading ? {} : { display: "none" }}>{t("LOGIN")}</span>
                                <BarLoader color={"#FFF"} height={17} width={37} loading={loginLoading} />
                            </Button>
                            {allowRegistration && (
                                <Button
                                    onClick={(e) => {
                                        if (window.location.pathname.endsWith("/default_popup.html")) {
                                            browserClient.openTab("register.html");
                                        } else {
                                            redirectRegister(e);
                                        }
                                    }}
                                    disabled={loginLoading}
                                >
                                    <span className={classes.regularButtonText}>{t("REGISTER")}</span>
                                </Button>
                            )}
                        </Grid>
                    </Grid>
                )}
                </div>
                {allowUsernamePasswordLogin && allowCustomServer && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <Checkbox
                                checked={rememberMe}
                                onChange={(event) => {
                                    setRememberMe(event.target.checked);
                                }}
                                checkedIcon={<Check className={classes.checkedIcon} />}
                                icon={<Check className={classes.uncheckedIcon} />}
                                classes={{
                                    checked: classes.checked,
                                }}
                            />{" "}
                            {t("REMEMBER_USERNAME_AND_SERVER")}
                        </Grid>
                    </Grid>
                )}

                {allowUsernamePasswordLogin && !allowCustomServer && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <Checkbox
                                checked={rememberMe}
                                onChange={(event) => {
                                    setRememberMe(event.target.checked);
                                }}
                                checkedIcon={<Check className={classes.checkedIcon} />}
                                icon={<Check className={classes.uncheckedIcon} />}
                                classes={{
                                    checked: classes.checked,
                                }}
                            />{" "}
                            {t("REMEMBER_USERNAME")}
                        </Grid>
                    </Grid>
                )}

                {!allowUsernamePasswordLogin && allowCustomServer && (
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <Checkbox
                                checked={rememberMe}
                                onChange={(event) => {
                                    setRememberMe(event.target.checked);
                                }}
                                checkedIcon={<Check className={classes.checkedIcon} />}
                                icon={<Check className={classes.uncheckedIcon} />}
                                classes={{
                                    checked: classes.checked,
                                }}
                            />{" "}
                            {t("REMEMBER_SERVER")}
                        </Grid>
                    </Grid>
                )}
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <Checkbox
                            checked={trustDevice}
                            onChange={(event) => {
                                setTrustDevice(event.target.checked);
                            }}
                            checkedIcon={<Check className={classes.checkedIcon} />}
                            icon={<Check className={classes.uncheckedIcon} />}
                            classes={{
                                checked: classes.checked,
                            }}
                        />{" "}
                        {t("TRUST_DEVICE")}
                    </Grid>
                </Grid>
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
                                    setDomain(helperService.getDomainWithoutWww(event.target.value.trim()));
                                }}
                            />
                        </Grid>
                    </Grid>
                )}
            </>
        );
    }

    if (view === "new_server") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <h4>{t("NEW_SERVER")}</h4>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="server_fingerprint"
                            label={t("FINGERPRINT_OF_THE_NEW_SERVER")}
                            InputProps={{
                                multiline: true,
                            }}
                            name="server_fingerprint"
                            autoComplete="off"
                            value={serverCheck.verify_key}
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <MuiAlert
                            severity="info"
                            style={{
                                marginBottom: "5px",
                                marginTop: "5px",
                            }}
                        >
                            {t("IT_APPEARS_THAT_YOU_WANT_TO_CONNECT")}
                        </MuiAlert>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={approveHost}
                            type="submit"
                            style={{ marginRight: "10px" }}
                        >
                            {t("APPROVE")}
                        </Button>
                        <Button onClick={cancel}>
                            <span className={classes.regularButtonText}>{t("CANCEL")}</span>
                        </Button>
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
            </>
        );
    }

    if (view === "signature_changed") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <h4>{t("SERVER_SIGNATURE_CHANGED")}</h4>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="server_fingerprint"
                            label={t("FINGERPRINT_OF_THE_NEW_SERVER")}
                            InputProps={{
                                multiline: true,
                            }}
                            name="server_fingerprint"
                            autoComplete="off"
                            value={serverCheck.verify_key}
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="oldserver_fingerprint"
                            label={t("FINGERPRINT_OF_THE_OLD_SERVER")}
                            InputProps={{
                                multiline: true,
                            }}
                            name="oldserver_fingerprint"
                            autoComplete="off"
                            value={serverCheck.verify_key_old}
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <MuiAlert
                            severity="warning"
                            style={{
                                marginBottom: "5px",
                                marginTop: "5px",
                            }}
                        >
                            {t("THE_SIGNATURE_OF_THE_SERVER_CHANGED")}
                            <br />
                            <br />
                            <strong>{t("CONTACT_THE_OWNER_OF_THE_SERVER")}</strong>
                        </MuiAlert>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={disapproveNewServer}
                            type="submit"
                            style={{ marginRight: "10px" }}
                        >
                            {t("CANCEL")}
                        </Button>
                        <Button onClick={approveHost}>
                            <span className={classes.regularButtonText}>{t("IGNORE_AND_CONTINUE")}</span>
                        </Button>
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
            </>
        );
    }

    if (view === "unsupported_server_version") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <h4>{t("SERVER_UNSUPPORTED")}</h4>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <MuiAlert
                            severity="warning"
                            style={{
                                marginBottom: "5px",
                                marginTop: "5px",
                            }}
                        >
                            {t("THE_VERSION_OF_THE_SERVER_IS_TOO_OLD_AND_NOT_SUPPORTED_PLEASE_UPGRADE")}
                        </MuiAlert>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={cancel}
                            type="submit"
                        >
                            {t("BACK")}
                        </Button>
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
            </>
        );
    }

    if (view === "ask_send_plain") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <p>{t("SERVER_ASKS_FOR_YOUR_PLAINTEXT_PASSWORD")}</p>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <MuiAlert
                            severity="warning"
                            style={{
                                marginBottom: "5px",
                                marginTop: "5px",
                            }}
                        >
                            {t("ACCEPTING_THIS_WILL_SEND_YOUR_PLAIN_PASSWORD")}
                        </MuiAlert>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={approveSendPlain}
                            type="submit"
                            style={{ marginRight: "10px" }}
                        >
                            {t("APPROVE_UNSAFE")}
                        </Button>
                        <Button onClick={disapproveSendPlain}>
                            <span className={classes.regularButtonText}>{t("DECLINE_SAFE")}</span>
                        </Button>
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
            </>
        );
    }

    if (view === "google_authenticator") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <p>{t("ENTER_YOUR_TOTP_CODE")}</p>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="gaToken"
                            label={t("TOTP_CODE")}
                            name="gaToken"
                            autoComplete="off"
                            required
                            value={gaToken}
                            onChange={(event) => {
                                setGaToken(event.target.value);
                            }}
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={gaVerify}
                            type="submit"
                            style={{ marginRight: "10px" }}
                            disabled={!gaToken || gaToken.length < 6}
                        >
                            {t("SEND")}
                        </Button>
                        <Button onClick={cancel}>
                            <span className={classes.regularButtonText}>{t("CANCEL")}</span>
                        </Button>
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
            </>
        );
    }

    if (view === "yubikey_otp") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <p>{t("ENTER_YOUR_YUBIKEY_OTP_TOKEN")}</p>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="yubikeyOtpToken"
                            label={t("YUBIKEY_TOKEN")}
                            name="yubikeyOtpToken"
                            autoComplete="off"
                            required
                            value={yubikeyOtpToken}
                            onChange={(event) => {
                                setYubikeyOtpToken(event.target.value);
                            }}
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={yubikeyOtpVerify}
                            type="submit"
                            style={{ marginRight: "10px" }}
                            disabled={!yubikeyOtpToken || yubikeyOtpToken.length < 6}
                        >
                            {t("SEND")}
                        </Button>
                        <Button onClick={cancel}>
                            <span className={classes.regularButtonText}>{t("CANCEL")}</span>
                        </Button>
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
            </>
        );
    }

    if (view === "duo") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <p>{t("APPROVE_THE_PUSH_NOTIFICATION")}</p>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="duoToken"
                            label={t("DUO_CODE")}
                            name="duoToken"
                            autoComplete="off"
                            required
                            value={duoToken}
                            onChange={(event) => {
                                setDuoToken(event.target.value);
                            }}
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={duoVerify}
                            type="submit"
                            style={{ marginRight: "10px" }}
                            disabled={!duoToken || duoToken.length < 6}
                        >
                            {t("SEND")}
                        </Button>
                        <Button onClick={cancel}>
                            <span className={classes.regularButtonText}>{t("CANCEL")}</span>
                        </Button>
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
            </>
        );
    }

    if (view === "webauthn") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <p>{t("SOLVE_THE_WEBAUTHN_CHALLENGE")}</p>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button onClick={cancel}>
                            <span className={classes.regularButtonText}>{t("CANCEL")}</span>
                        </Button>
                    </Grid>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
            </>
        );
    }

    if (view === "pick_second_factor") {
        formContent = (
            <>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <p>{t("PICK_SECOND_FACTOR")}</p>
                    </Grid>
                </Grid>
                {multifactors.indexOf("google_authenticator_2fa") !== -1 && (
                    <Grid container style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Grid item xs={12} sm={12} md={12}>
                            <Button variant="contained" color="primary" onClick={showGa2faForm} type="submit">
                                {t("TOTP")}
                            </Button>
                        </Grid>
                    </Grid>
                )}
                {multifactors.indexOf("yubikey_otp_2fa") !== -1 && (
                    <Grid container style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Grid item xs={12} sm={12} md={12}>
                            <Button variant="contained" color="primary" onClick={showYubikeyOtp2faForm} type="submit">
                                {t("YUBIKEY")}
                            </Button>
                        </Grid>
                    </Grid>
                )}
                {multifactors.indexOf("webauthn_2fa") !== -1 && (
                    <Grid container style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Grid item xs={12} sm={12} md={12}>
                            <Button variant="contained" color="primary" onClick={showWebauthn2faForm} type="submit">
                                {t("FIDO2_WEBAUTHN")}
                            </Button>
                        </Grid>
                    </Grid>
                )}
                {multifactors.indexOf("duo_2fa") !== -1 && (
                    <Grid container style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Grid item xs={12} sm={12} md={12}>
                            <Button variant="contained" color="primary" onClick={showDuo2faForm} type="submit">
                                {t("DUO")}
                            </Button>
                        </Grid>
                    </Grid>
                )}
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} style={{ marginTop: "5px", marginBottom: "5px" }}>
                        <Button onClick={cancel}>
                            <span className={classes.regularButtonText}>{t("CANCEL")}</span>
                        </Button>
                    </Grid>
                </Grid>
            </>
        );
    }

    if (view === "ivalt") {
		formContent = (
			<>
				<Grid
					container
					style={{
						display: "flex",
						justifyContent: "space-around",
						minHeight: "45px",
						marginBottom: "15px",
					}}
				>
					<div className={classes.container}>
						<img
							width={45}
							height={45}
							src={"img/sc-logo.png"}
							alt="Loading"
							className={classes.image}
						/>
						{ivaltLoading && (
							<CircularProgress
								size={60}
								className={classes.progress}
								style={{ animation: "unset", zIndex: 2 }}
							/>
						)}
					</div>

					{ivaltLoading && (
						<div>
							<p>{t("IVALT_REQUEST_SENT_TO_APP")}</p>
							<p>{t("WAITING_FOR_AUTHENTICATION")}</p>
							<p>{timer}</p>
						</div>
					)}
				</Grid>
				<GridContainerErrors errors={errors} setErrors={setErrors} />
				<Grid
					item
					xs={12}
					sm={12}
					md={12}
					style={{ marginTop: "5px", marginBottom: "5px" }}
				>
					<Button
						variant="contained"
						onClick={() => {
							setIvaltLoading(false);
							setTimer(defaultTimer);
							cancel();
						}}
					>
						{t("CANCEL")}
					</Button>
					{!ivaltLoading && (
						<Button
							style={{ marginLeft: "1rem" }}
							variant="contained"
							onClick={() => {
								setIvaltLoading(true);
								sendIvaltAuthRequest();
							}}
						>
							{t("RETRY")}
						</Button>
					)}
				</Grid>
			</>
		);
	}

    // a webclient that doesn't allow different servers, doesn't need remote config, so we can hide it.
    const hideRemoteConfig = deviceService.isWebclient() && !allowCustomServer;
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
            }}
            name="loginForm"
            autoComplete="off"
        >
            {formContent}
            <div className={`${props.fullWidth ? 'full-width-' : ''}box-footer`}>
                {!hideRemoteConfig && (
                    <>
                        <a onClick={remoteConfig} href="#">
                            {t("REMOTE_CONFIG")}
                        </a>
                        &nbsp;&nbsp;
                    </>
                )}

                {allowLostPassword && !window.location.pathname.endsWith("/default_popup.html") && (
                    <>
                        <a href="lost-password.html">{t("LOST_PASSWORD")}</a>
                        &nbsp;&nbsp;
                    </>
                )}
                {allowLostPassword && window.location.pathname.endsWith("/default_popup.html") && (
                    <>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (loginLoading) {
                                    return;
                                }
                                browserClient.openTab("lost-password.html");
                            }}
                        >
                            {t("LOST_PASSWORD")}
                        </a>
                        &nbsp;&nbsp;
                    </>
                )}

                {allowDeleteAccount && !window.location.pathname.endsWith("/default_popup.html") && (
                    <a href="delete-user.html">{t("DELETE_ACCOUNT")}</a>
                )}
                {allowDeleteAccount && window.location.pathname.endsWith("/default_popup.html") && (
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (loginLoading) {
                                return;
                            }
                            browserClient.openTab("delete-user.html");
                        }}
                    >
                        {t("DELETE_ACCOUNT")}
                    </a>
                )}
                &nbsp;&nbsp;
                <FooterLinks />
            </div>
            {loginInfoText && (
                <MuiAlert
                    icon={false}
                    severity="info"
                    style={{
                        marginTop: "5px",
                        fontSize: "10px",
                    }}
                >
                    <TextWithLineBreaks text={loginInfoText} />
                </MuiAlert>
            )}
        </form>
    );
};

LoginViewForm.defaultProps = {
    fullWidth: false,
};
LoginViewForm.propTypes = {
    fullWidth: PropTypes.bool,
};


export default LoginViewForm;
