import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import { Grid } from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { EmergencyCodeStatus } from "../../../types/auth";
import { hasAuthField } from "../../../types/auth-ui";
import type {
	AuthFormView,
	AuthUiServerInfo,
	SsoRouteParams,
} from "../../../types/auth-ui";
import type {
	BackendServerConfiguration,
	ClientConfiguration,
} from "../../../types/browser";
import type { HostCheckResult } from "../../../types/host";
import action from "../../actions/bound-action-creators";
import AdminRecoveryKeyChanged from "../../components/admin-recovery-key-changed";
import FooterLinks from "../../components/footer-links";
import GridContainerErrors from "../../components/grid-container-errors";
import browserClient from "../../services/browser-client";
import {
	emergencyCodeFromInput,
	emergencyCodeFromWords,
} from "../../services/emergency-code-format";
import helperService from "../../services/helper";
import host from "../../services/host";
import { getStore } from "../../services/store";
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
	button: {
		color: "white !important",
	},
	inputAdornment: {
		color: theme.palette.lightGreyText.main,
	},
	regularButtonText: {
		color: theme.palette.lightGreyText.main,
	},
}));

const EmergencyCodeViewForm = (_props: SsoRouteParams) => {
	const classes = useStyles();
	const { t } = useTranslation();

	const [view, setView] = useState<
		AuthFormView | EmergencyCodeStatus["status"] | HostCheckResult["status"]
	>("default");
	const [remainingWaitingTime, setRemainingWaitingTime] = useState(-1);
	const [username, setUsername] = useState("");
	const [emergencyCode, setEmergencyCode] = useState("");
	const [code, setCode] = useState("");
	const [words, setWords] = useState("");
	const [server, setServer] = useState(getStore().getState().server.url);
	const [serverCheck, setServerCheck] = useState<Partial<HostCheckResult>>({});
	const [domain, setDomain] =
		useState<BackendServerConfiguration["domain"]>("");
	const [errors, setErrors] = useState<string[]>([]);
	const [allowCustomServer, setAllowCustomServer] = useState(true);

	React.useEffect(() => {
		action().setServerInfo({}, undefined);
		browserClient.getConfig().then(onNewConfigLoaded);
	}, []);

	const cancel = () => {
		setView("default");
		setErrors([]);
	};

	const onNewConfigLoaded = (configJson: ClientConfiguration) => {
		const serverUrl = configJson["backend_servers"][0]["url"]!;
		const domain = configJson["backend_servers"][0]["domain"];
		const allowCustomServer = configJson.allow_custom_server;

		setServer(serverUrl);
		setDomain(domain);
		setAllowCustomServer(allowCustomServer);
	};

	const arm = (localEmergencyCode: string, serverCheck: HostCheckResult) => {
		const parsedUrl = helperService.parseUrl(server);
		const fullUsername = helperService.formFullUsername(
			username,
			domain || parsedUrl["full_domain_without_www"]!,
		);

		function onError(data: unknown) {
			setView("default");
			console.log(data);
			if (
				hasAuthField(data, "data") &&
				hasAuthField(data.data, "non_field_errors")
			) {
				setErrors(data.data.non_field_errors);
			} else if (
				hasAuthField(data, "data") &&
				hasAuthField(data.data, "detail")
			) {
				setErrors([data.data.detail]);
			} else if (!hasAuthField(data, "data")) {
				setErrors(["SERVER_OFFLINE"]);
			} else {
				alert("Error, should not happen.");
			}
		}

		function onSuccess(data: EmergencyCodeStatus) {
			if (data.status === "active") {
				window.location.href = "index.html";
			}

			setView(data.status); // started, waiting
			if (data.remaining_wait_time) {
				setRemainingWaitingTime(data.remaining_wait_time);
			}
		}
		user
			.armEmergencyCode(
				fullUsername,
				localEmergencyCode,
				server,
				serverCheck["info"] as AuthUiServerInfo,
				serverCheck["verify_key"],
			)
			.then(onSuccess, onError);
	};

	const approveHost = () => {
		host.approveHost(
			serverCheck.server_url!,
			serverCheck.verify_key!,
			serverCheck.admin_recovery_public_key,
		);
		action().setServerInfo(serverCheck.info!, serverCheck.verify_key, "");
		arm(emergencyCode, serverCheck as HostCheckResult);
	};

	const approveNewServer = () => {
		return approveHost();
	};

	const disapproveNewServer = () => {
		setView("default");
		setErrors([]);
	};

	const armEmergencyCode = () => {
		setErrors([]);
		action().setServerUrl(server);
		action().setServerInfo({}, undefined);

		const parsedUrl = helperService.parseUrl(server);
		const fullUsername = helperService.formFullUsername(
			username,
			domain || parsedUrl["full_domain_without_www"]!,
		);
		const test_result = helperService.isValidUsername(fullUsername);
		if (test_result) {
			setErrors([test_result]);
			return;
		}

		let localEmergencyCode: string;
		try {
			localEmergencyCode = words.trim()
				? emergencyCodeFromWords(words)
				: emergencyCodeFromInput(code);
		} catch {
			setErrors(["AT_LEAST_ONE_CODE_INCORRECT"]);
			return;
		}

		setEmergencyCode(localEmergencyCode);

		const onError = () => {
			setErrors(["SERVER_OFFLINE"]);
		};

		const onSuccess = (serverCheck: HostCheckResult) => {
			setServerCheck(serverCheck);
			action().setServerInfo(serverCheck.info, serverCheck.verify_key, "");
			if (serverCheck.status === "matched") {
				arm(localEmergencyCode, serverCheck);
			} else if (
				[
					"new_server",
					"signature_changed",
					"admin_recovery_public_key_changed",
					"unsupported_server_version",
				].includes(serverCheck.status)
			) {
				setView(serverCheck.status);
			} else {
				setView("default");
				setErrors([
					serverCheck.status === "invalid_signature"
						? "INVALID_SERVER_SIGNATURE"
						: "RECEIVED_MALFORMED_RESPONSE",
				]);
			}
		};
		host.checkHost(server).then(onSuccess, onError);
	};

	let formContent: React.ReactNode;

	if (view === "default") {
		formContent = (
			<>
				<Grid container>
					<Grid item xs={12} sm={12} md={12}>
						<TextField
							className={classes.textField}
							variant="outlined"
							margin="dense"
							size="small"
							id="username"
							label={t("USERNAME")}
							InputProps={{
								endAdornment:
									domain && !username.includes("@") ? (
										<InputAdornment position="end">
											<span className={classes.inputAdornment}>
												{"@" + domain}
											</span>
										</InputAdornment>
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
						<TextField
							className={classes.textField}
							variant="outlined"
							margin="dense"
							size="small"
							id="code"
							placeholder="DdSLuiDcPuY2F-Dsxf82sKQdqPs"
							name="code"
							autoComplete="off"
							value={code}
							onChange={(event) => {
								setCode(event.target.value);
							}}
						/>
					</Grid>
					<Grid item xs={12} sm={12} md={12}>
						<TextField
							className={classes.textField}
							variant="outlined"
							margin="dense"
							size="small"
							id="words"
							placeholder={t("OR_WORDLIST")}
							name="words"
							autoComplete="off"
							value={words}
							onChange={(event) => {
								setWords(event.target.value);
							}}
						/>
					</Grid>
				</Grid>
				<Grid container>
					<Grid
						item
						xs={6}
						sm={6}
						md={6}
						style={{ marginTop: "5px", marginBottom: "5px" }}
					>
						<Button
							variant="contained"
							color="primary"
							onClick={armEmergencyCode}
							type="submit"
							disabled={(!words && !code) || !username}
						>
							{t("ACTIVATE_EMERGENCY_CODE")}
						</Button>
					</Grid>
				</Grid>
				<GridContainerErrors errors={errors} setErrors={setErrors} />
				{allowCustomServer && (
					<Grid container>
						<Grid item xs={12} sm={12} md={12}>
							<TextField
								className={classes.textField}
								variant="outlined"
								margin="dense"
								size="small"
								id="server"
								label={t("SERVER")}
								name="server"
								autoComplete="off"
								value={server}
								onChange={(event) => {
									setServer(event.target.value.trim());
									setDomain(
										helperService.getDomainWithoutWww(
											event.target.value.trim(),
										),
									);
								}}
							/>
						</Grid>
					</Grid>
				)}
			</>
		);
	}

	if (view === "started") {
		formContent = (
			<>
				<Grid container>
					<Grid item xs={12} sm={12} md={12}>
						<MuiAlert
							onClose={() => {
								setErrors([]);
							}}
							severity="success"
							style={{ marginBottom: "5px" }}
						>
							{t("EMERGENCY_CODE_ACTIVATED")} {remainingWaitingTime}{" "}
							{t("SECONDS")}
						</MuiAlert>
					</Grid>
					<Grid
						item
						xs={6}
						sm={6}
						md={6}
						style={{ marginTop: "5px", marginBottom: "5px" }}
					>
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

	if (view === "waiting") {
		formContent = (
			<>
				<Grid container>
					<Grid item xs={12} sm={12} md={12}>
						<MuiAlert
							onClose={() => {
								setErrors([]);
							}}
							severity="success"
							style={{ marginBottom: "5px" }}
						>
							{t("EMERGENCY_CODE_WAITING")} {remainingWaitingTime}{" "}
							{t("SECONDS")}
						</MuiAlert>
					</Grid>
					<Grid
						item
						xs={6}
						sm={6}
						md={6}
						style={{ marginTop: "5px", marginBottom: "5px" }}
					>
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
							margin="dense"
							size="small"
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
					<Grid
						item
						xs={12}
						sm={12}
						md={12}
						style={{ marginTop: "5px", marginBottom: "5px" }}
					>
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
							margin="dense"
							size="small"
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
							margin="dense"
							size="small"
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
				{serverCheck.admin_recovery_public_key_changed && (
					<AdminRecoveryKeyChanged
						serverCheck={serverCheck as HostCheckResult}
						textFieldClass={classes.textField}
						showActions={false}
					/>
				)}
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
					<Grid
						item
						xs={12}
						sm={12}
						md={12}
						style={{ marginTop: "5px", marginBottom: "5px" }}
					>
						<Button
							variant="contained"
							color="primary"
							onClick={disapproveNewServer}
							type="submit"
							style={{ marginRight: "10px" }}
						>
							{t("CANCEL")}
						</Button>

						<Button onClick={approveNewServer}>
							<span className={classes.regularButtonText}>
								{t("IGNORE_AND_CONTINUE")}
							</span>
						</Button>
					</Grid>
				</Grid>
				<GridContainerErrors errors={errors} setErrors={setErrors} />
			</>
		);
	}

	if (view === "admin_recovery_public_key_changed") {
		formContent = (
			<>
				<AdminRecoveryKeyChanged
					serverCheck={serverCheck as HostCheckResult}
					textFieldClass={classes.textField}
					regularButtonTextClass={classes.regularButtonText}
					onCancel={disapproveNewServer}
					onApprove={approveNewServer}
				/>
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
							{t(
								"THE_VERSION_OF_THE_SERVER_IS_TOO_OLD_AND_NOT_SUPPORTED_PLEASE_UPGRADE",
							)}
						</MuiAlert>
					</Grid>
				</Grid>
				<Grid container>
					<Grid
						item
						xs={12}
						sm={12}
						md={12}
						style={{ marginTop: "5px", marginBottom: "5px" }}
					>
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

	if (view === "success") {
		formContent = (
			<Grid container>
				<Grid item xs={12} sm={12} md={12} style={{ textAlign: "center" }}>
					<ThumbUpIcon style={{ fontSize: 160 }} />
				</Grid>
				<Grid
					item
					xs={6}
					sm={6}
					md={6}
					style={{ marginTop: "5px", marginBottom: "5px" }}
				>
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
		);
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
			}}
			name="emergencyCodeForm"
			autoComplete="off"
		>
			{formContent}
			<div className="box-footer">
				<FooterLinks />
			</div>
		</form>
	);
};

export default EmergencyCodeViewForm;
