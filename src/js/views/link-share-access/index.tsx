import { Grid } from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import type { AuthErrorData } from "../../../types/auth";
import type { ClientConfiguration } from "../../../types/browser";
import type { HostCheckResult } from "../../../types/host";
import type { EntryItem } from "../../../types/entry-ui";
import action from "../../actions/bound-action-creators";
import AdminRecoveryKeyChanged from "../../components/admin-recovery-key-changed";
import ConfigLogo from "../../components/config-logo";
import DialogEditEntry from "../../components/dialogs/edit-entry";
import GridContainerErrors from "../../components/grid-container-errors";
import TextFieldPassword from "../../components/text-field/password";
import browserClient from "../../services/browser-client";
import converter from "../../services/converter";
import fileTransferService from "../../services/file-transfer";
import hostService from "../../services/host";
import host from "../../services/host";
import linkShareService from "../../services/link-share";
import { getStore } from "../../services/store";

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
	progressBox: {
		width: "340px",
		padding: "20px",
		position: "absolute",
		top: "50%",
		left: "50%",
		margin: "-70px 0 0 -170px",
		borderRadius: "4px",
		backgroundColor: theme.palette.blueBackground.main,
		color: theme.palette.lightGreyText.main,
	},
}));

type LinkShareAccessResult = Awaited<
	ReturnType<typeof linkShareService.linkShareAccessRead>
>;
type LinkShareView = "default" | HostCheckResult["status"];

const LinkShareAccessView = () => {
	const { t } = useTranslation();
	const classes = useStyles();
	const [percentageComplete, setPercentageComplete] = useState(0);
	const [server, setServer] = useState(getStore().getState().server.url);
	const [nextStep, setNextStep] = useState("");
	const [allowCustomServer, setAllowCustomServer] = useState(false);
	const [serverCheck, setServerCheck] = useState<Partial<HostCheckResult>>({});
	const [processing, setProcessing] = useState(false);
	const [passphrase, setPassphrase] = useState("");
	const [passphraseRequired, setPassphraseRequired] = useState(false);
	const [view, setView] = useState<LinkShareView>("default");
	const [errors, setErrors] = useState<string[]>([]);
	const creditBuyAddress = getStore().getState().server.credit_buy_address;
	const { linkShareId, linkShareSecret, backendServerUrl, verifyKey } =
		useParams<{
			linkShareId: string;
			linkShareSecret: string;
			backendServerUrl?: string;
			verifyKey?: string;
		}>();

	const [editEntryOpen, setEditEntryOpen] = useState(false);
	const [editEntryData, setEditEntryData] = useState<
		Partial<Exclude<LinkShareAccessResult, void>>
	>({});

	let openRequests = 0;
	let closedRequest = 0;

	React.useEffect(() => {
		action().setServerInfo({}, undefined);
		const onSuccess = (config: ClientConfiguration) => {
			let serverUrl = config["backend_servers"][0]["url"]!;

			setAllowCustomServer(config.allow_custom_server);

			if (config.allow_custom_server && backendServerUrl) {
				serverUrl = converter.decodeUtf8(
					converter.fromBase58(backendServerUrl),
				);
			}
			setServer(serverUrl);
			initiateLinkShareAccess(serverUrl);
		};

		const onError = (data: unknown) => {
			console.log(data);
		};

		browserClient.getConfig().then(onSuccess, onError);

		fileTransferService.register("download_started", (max) => {
			setProcessing(true);
			openRequests = max + 1;
		});

		fileTransferService.register("download_step_complete", (newNextStep) => {
			closedRequest = closedRequest + 1;
			setPercentageComplete(
				Math.round((closedRequest / openRequests) * 1000) / 10,
			);
			setNextStep(newNextStep);
		});

		fileTransferService.register("download_complete", () => {
			closedRequest = closedRequest + 1;
			setPercentageComplete(100);
			setProcessing(true);
			setNextStep("DOWNLOAD_COMPLETED");
		});
	}, []);

	function initiateLinkShareAccess(serverUrl: string) {
		// The standalone share page uses a private, non-persisted store.
		action().setServerUrl(serverUrl);
		action().setServerInfo({}, undefined);
		const onError = () => {
			setErrors(["SERVER_OFFLINE"]);
		};

		const onSuccess = (serverCheck: HostCheckResult) => {
			setServerCheck(serverCheck);
			action().setServerInfo(serverCheck.info, serverCheck.verify_key, "");
			if (serverCheck.status === "matched") {
				return linkShareAccess();
			}
			if (
				[
					"new_server",
					"signature_changed",
					"admin_recovery_public_key_changed",
					"unsupported_server_version",
				].includes(serverCheck.status)
			) {
				setView(serverCheck.status);
				return;
			}

			setView("default");
			setErrors([
				serverCheck.status === "invalid_signature"
					? "INVALID_SERVER_SIGNATURE"
					: "RECEIVED_MALFORMED_RESPONSE",
			]);
		};
		hostService.checkHost(serverUrl, verifyKey).then(onSuccess, onError);
	}
	function linkShareAccess() {
		setErrors([]);

		openRequests = 1;
		closedRequest = 0;
		setPercentageComplete(0);
		setNextStep("DECRYPTING");
		setProcessing(true);

		const onSuccess = (secret: LinkShareAccessResult) => {
			openRequests = 1;
			closedRequest = 1;
			setPercentageComplete(100);
			setNextStep("DOWNLOAD_COMPLETED");
			if (secret) {
				setEditEntryData(secret);
				setEditEntryOpen(true);
			}
		};
		const onError = (data: AuthErrorData | string) => {
			reset();
			if (Object.hasOwn(data as object, "non_field_errors")) {
				const nonFieldErrors = (data as AuthErrorData).non_field_errors!;
				if (
					nonFieldErrors.length === 1 &&
					nonFieldErrors[0] === "PASSPHRASE_REQUIRED"
				) {
					setPassphraseRequired(true);
					return;
				}

				setErrors(nonFieldErrors);
				setNextStep("");
				setProcessing(false);
			} else {
				console.log(data);
				setErrors([data as string]);
			}
		};
		return linkShareService
			.linkShareAccessRead(linkShareId, linkShareSecret, passphrase)
			.then(onSuccess, onError);
	}

	function reset() {
		openRequests = 0;
		closedRequest = 0;
		setPercentageComplete(0);
		setNextStep("");
		setProcessing(false);
	}

	const approveHost = () => {
		host.approveHost(
			serverCheck.server_url!,
			serverCheck.verify_key!,
			serverCheck.admin_recovery_public_key!,
		);
		action().setServerInfo(serverCheck.info!, serverCheck.verify_key, "");
		setView("default");
		return linkShareAccess();
	};

	const cancel = () => {
		window.location.href = "index.html";
	};

	return (
		<div className={classes.progressBox}>
			<ConfigLogo
				configKey={"logo"}
				defaultLogo={"img/logo.png"}
				height="100%"
			/>
			<a
				href="https://psono.com/"
				target="_blank"
				rel="noopener"
				className="infolabel"
			>
				<i className="fa fa-info-circle" aria-hidden="true" />
			</a>
			{view === "default" && (
				<React.Fragment>
					{!processing && (
						<React.Fragment>
							<Grid container>
								<Grid item xs={12} sm={12} md={12}>
									<TextFieldPassword
										className={classes.textField}
										variant="outlined"
										margin="dense"
										size="small"
										id="passphrase"
										label={t("PASSPHRASE")}
										name="passphrase"
										autoComplete="off"
										value={passphrase}
										onChange={(event) => {
											setPassphrase(event.target.value);
										}}
									/>
								</Grid>
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
										onClick={() => initiateLinkShareAccess(server)}
										type="submit"
										style={{ marginRight: "10px" }}
									>
										{t("SEND")}
									</Button>
								</Grid>
								{allowCustomServer && (
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
											}}
										/>
									</Grid>
								)}
							</Grid>
						</React.Fragment>
					)}
					{processing && (
						<React.Fragment>
							<Box display="flex" alignItems="center">
								<Box width="100%" mr={1}>
									<LinearProgress
										variant="determinate"
										value={percentageComplete}
									/>
								</Box>
								<Box minWidth={35}>
									<span style={{ color: "white", whiteSpace: "nowrap" }}>
										{percentageComplete} %
									</span>
								</Box>
							</Box>
							<span>{t(nextStep)}</span>
						</React.Fragment>
					)}
				</React.Fragment>
			)}
			{view === "new_server" && (
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
							<Button variant="contained" onClick={cancel}>
								{t("CANCEL")}
							</Button>
						</Grid>
					</Grid>
					<GridContainerErrors errors={errors} setErrors={setErrors} />
				</>
			)}
			{view === "signature_changed" && (
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
								onClick={cancel}
								type="submit"
								style={{ marginRight: "10px" }}
							>
								{t("CANCEL")}
							</Button>
							<Button variant="contained" onClick={approveHost}>
								{t("IGNORE_AND_CONTINUE")}
							</Button>
						</Grid>
					</Grid>
					<GridContainerErrors errors={errors} setErrors={setErrors} />
				</>
			)}
			{view === "admin_recovery_public_key_changed" && (
				<>
					<AdminRecoveryKeyChanged
						serverCheck={serverCheck as HostCheckResult}
						textFieldClass={classes.textField}
						onCancel={cancel}
						onApprove={approveHost}
					/>
					<GridContainerErrors errors={errors} setErrors={setErrors} />
				</>
			)}

			{view === "unsupported_server_version" && (
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
			)}

			{errors.length > 0 && (
				<div className="form-group alert alert-danger" ng-repeat="e in errors">
					<strong>{t("ERROR")}:</strong>

					{errors.map((prop, index) => {
						return (
							<MuiAlert
								onClose={() => {
									setErrors([]);
								}}
								key={index}
								severity="error"
								style={{ marginBottom: "5px" }}
							>
								{(prop !== "INSUFFICIENT_FUNDS" || !creditBuyAddress) && (
									<span>{t(prop)}</span>
								)}
								{prop === "INSUFFICIENT_FUNDS" && creditBuyAddress && (
									<span>{t("INSUFFICIENT_FUNDS_WITH_CREDIT_BUY_ADDRESS")}</span>
								)}
								{prop === "INSUFFICIENT_FUNDS" && creditBuyAddress && (
									<a
										href={creditBuyAddress}
										rel="nofollow noopener"
										target="_blank"
									>
										<span>{t("BUY")}</span>
									</a>
								)}
							</MuiAlert>
						);
					})}
				</div>
			)}
			{editEntryOpen && (
				<DialogEditEntry
					onCustomSave={(
						item,
						secretObject,
						callbackUrl,
						callbackUser,
						callbackPass,
					) => {
						const onSuccess = () => {
							setEditEntryOpen(false);
							setNextStep("SAVE_SUCCESS");
						};
						const onError = (data: unknown) => {
							// Should not happen
							console.log(data);
						};
						linkShareService
							.linkShareAccessWrite(
								linkShareId,
								linkShareSecret,
								item.secret_key!,
								secretObject,
								passphrase,
							)
							.then(onSuccess, onError);
					}}
					open={editEntryOpen}
					onClose={() => setEditEntryOpen(false)}
					item={editEntryData.item as EntryItem}
					data={editEntryData.data}
					hideLinkToEntry={true}
					hideShowHistory={true}
					hideAddTOTP={true}
					hideAddCustomField={true}
					hideAddTag={true}
					hideMoreMenu={true}
					linkDirectly={true}
					setDirty={() => {}}
				/>
			)}
		</div>
	);
};

export default LinkShareAccessView;
