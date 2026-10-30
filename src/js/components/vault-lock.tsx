import {
	Alert,
	Button,
	FormControlLabel,
	GlobalStyles,
	MenuItem,
	Stack,
	Switch,
	TextField,
	Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { BarLoader } from "react-spinners";
import vaultLock, {
	LOCK_REQUIRED_UNAVAILABLE,
	LOCK_UNAVAILABLE,
	type LockSupport,
} from "../services/vault-lock";
import user, { isLogoutPage } from "../services/user";
import offlineCache from "../services/offline-cache";
import DialogChangeAccount from "./dialogs/change-account";
import ConfigLogo from "./config-logo";
import DarkBox from "./dark-box";
import AuthenticationInTab from "./authentication-in-tab";
import { normalizeTimeoutAction } from "../../types/locking";
import type { TimeoutAction } from "../../types/locking";

const useStyles = makeStyles((theme) => ({
	box: {
		width: "340px",
		padding: theme.spacing(2.5),
		position: "absolute",
		top: "40%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		borderRadius: "4px",
		[theme.breakpoints.up("sm")]: {
			width: "540px",
		},
	},
	popupBox: {
		paddingBottom: "16px",
	},
	form: {
		"& .MuiButton-text": {
			color: theme.palette.lightGreyText.main,
		},
		"& .MuiInputBase-root, & .MuiInputLabel-root, & .MuiFormHelperText-root": {
			color: theme.palette.lightGreyText.main,
		},
		"& .MuiInputBase-input.Mui-disabled": {
			color: theme.palette.lightGreyText.main,
			WebkitTextFillColor: theme.palette.lightGreyText.main,
		},
		"& .MuiSelect-icon": { color: theme.palette.lightGreyText.main },
		"& .MuiOutlinedInput-notchedOutline": {
			borderColor: theme.palette.greyText.main,
		},
		"& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
			borderColor: theme.palette.lightGreyText.main,
		},
		"& .MuiFormControlLabel-label.Mui-disabled": {
			color: theme.palette.lightGreyText.main,
		},
		"& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track": {
			backgroundColor: theme.palette.lightGreyText.main,
		},
	},
}));

function useLock() {
	const [, render] = React.useReducer((value) => value + 1, 0);
	React.useEffect(() => vaultLock.subscribe(render), []);
	return vaultLock.getConfiguration();
}

export function LockSettings({
	required = false,
	setup = false,
}: {
	required?: boolean;
	setup?: boolean;
}) {
	const { t } = useTranslation();
	const config = useLock();
	const server = useSelector((state) => state.server);
	const username = useSelector((state) => state.user.username);
	const [support, setSupport] = React.useState<LockSupport | null>(null);
	const [supported, setSupported] = React.useState<boolean | null>(null);
	const [timeout, setTimeout] = React.useState(config?.timeout ?? 300);
	const [timeoutAction, setTimeoutAction] = React.useState<TimeoutAction>(() =>
		normalizeTimeoutAction(config?.timeoutAction),
	);
	const [busy, setBusy] = React.useState(false);
	const [error, setError] = React.useState("");
	const [diagnostic, setDiagnostic] = React.useState("");
	const mounted = React.useRef(false);
	const saving = React.useRef(false);
	React.useEffect(() => {
		mounted.current = true;
		vaultLock.getSupport().then((value) => {
			if (mounted.current) {
				setSupport(value);
				setSupported(value.supported);
			}
		});
		return () => {
			mounted.current = false;
		};
	}, []);
	const enforce = required || server.complianceEnforceLocking === true;
	const setupMode = setup || required;
	const save = async (enabled: boolean) => {
		if (saving.current) return;
		saving.current = true;
		setError("");
		setDiagnostic("");
		setBusy(true);
		const nextTimeout = enabled ? timeout : (config?.timeout ?? 300);
		try {
			if (enabled && !config?.enabled) {
				const rpId =
					TARGET === "chrome" || TARGET === "firefox"
						? new URL(server.webClient!).hostname
						: window.location.hostname;
				await vaultLock.enable(
					username,
					rpId,
					nextTimeout,
					server.complianceMaxLockTimeout,
					timeoutAction,
				);
			} else
				await vaultLock.update(
					enabled,
					nextTimeout,
					enforce,
					server.complianceMaxLockTimeout,
					timeoutAction,
				);
			if (mounted.current) {
				setTimeout(vaultLock.getConfiguration()?.timeout ?? 300);
				setTimeoutAction(
					normalizeTimeoutAction(vaultLock.getConfiguration()?.timeoutAction),
				);
				if (enabled) offlineCache.incrementalUpdate(true).catch(() => {});
			}
		} catch (error) {
			if (!mounted.current) return;
			setError(error instanceof Error ? error.message : String(error));
			const detail =
				error instanceof Error && "lockDiagnostic" in error
					? String(error.lockDiagnostic)
					: error instanceof Error
						? `${error.name}: ${error.message}`
						: String(error);
			setDiagnostic(detail);
			console.warn("Psono automatic locking setup failed:", detail);
			if (
				(error instanceof Error && error.message === LOCK_UNAVAILABLE) ||
				(error instanceof DOMException &&
					["NotSupportedError", "SecurityError"].includes(error.name))
			)
				setSupported(false);
		} finally {
			saving.current = false;
			if (mounted.current) setBusy(false);
		}
	};
	const description = (
		<>
			<Typography>{t("AUTOMATIC_LOCKING_DESCRIPTION")}</Typography>
			{diagnostic && (
				<Alert severity="info">
					<strong>{t("LOCK_ENROLLMENT_DIAGNOSTIC")}</strong>
					<Typography
						component="pre"
						variant="body2"
						sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
					>
						{diagnostic}
					</Typography>
				</Alert>
			)}
		</>
	);
	const continueButton = !enforce && (
		<Button variant="text" disabled={busy} onClick={() => save(false)}>
			{t("CONTINUE_WITHOUT_LOCKING")}
		</Button>
	);
	if (supported === false && !config?.enabled && setupMode) {
		if (enforce)
			return (
				<Stack spacing={2}>
					{description}
					<Alert severity="error">{t(LOCK_REQUIRED_UNAVAILABLE)}</Alert>
				</Stack>
			);
		return (
			<Stack spacing={2} sx={{ my: 2 }}>
				{description}
				<Alert severity="info">{t("OPTIONAL_LOCKING_UNAVAILABLE")}</Alert>
				{error && <Alert severity="error">{t(error)}</Alert>}
				{continueButton}
			</Stack>
		);
	}
	if (supported === null) return null;
	return (
		<Stack spacing={2} sx={{ my: 2 }}>
			{!setupMode && (
				<Typography variant="h6">{t("AUTOMATIC_LOCKING")}</Typography>
			)}
			{description}
			{supported === false && (
				<Alert severity="warning">
					{t(enforce ? LOCK_REQUIRED_UNAVAILABLE : LOCK_UNAVAILABLE)}
				</Alert>
			)}
			{!setupMode && support && (
				<details>
					<summary>{t("LOCK_SUPPORT_DETAILS")}</summary>
					<Typography variant="body2">
						{t("LOCK_SUPPORT_DETAILS_DESCRIPTION")}
					</Typography>
					<ul>
						{support.checks.map((check) => (
							<li key={check.name}>
								{t(check.name)}:{" "}
								{t(`LOCK_SUPPORT_${check.status.toUpperCase()}`)}
								{check.error && ` (${check.error})`}
							</li>
						))}
					</ul>
				</details>
			)}
			{enforce && <Alert severity="info">{t("LOCKING_REQUIRED")}</Alert>}
			{!setupMode && (
				<FormControlLabel
					label={t("AUTOMATIC_LOCKING")}
					control={
						<Switch
							checked={config?.enabled ?? false}
							disabled={
								supported === false || busy || (enforce && !!config?.enabled)
							}
							onChange={(_, enabled) => save(enabled)}
						/>
					}
				/>
			)}
			<TextField
				type="number"
				label={t("LOCK_TIMEOUT")}
				value={timeout}
				inputProps={{ min: 1, max: server.complianceMaxLockTimeout }}
				disabled={busy || supported === false}
				helperText={
					server.complianceMaxLockTimeout
						? t("LOCK_TIMEOUT_MAXIMUM", {
								seconds: server.complianceMaxLockTimeout,
							})
						: ""
				}
				onChange={(event) => setTimeout(Number(event.target.value))}
			/>
			<TextField
				select
				label={t("TIMEOUT_ACTION")}
				value={timeoutAction}
				disabled={busy || supported === false}
				onChange={(event) =>
					setTimeoutAction(normalizeTimeoutAction(event.target.value))
				}
			>
				<MenuItem value="LOCK">{t("LOCK")}</MenuItem>
				<MenuItem value="LOGOUT">{t("LOGOUT")}</MenuItem>
			</TextField>
			{setupMode && (
				<Stack direction="row" spacing={1}>
					<Button
						variant="contained"
						color="primary"
						disabled={busy || supported === false}
						aria-busy={busy}
						aria-label={`${t("ENABLE_AUTOMATIC_LOCKING")}`}
						onClick={() => save(true)}
						sx={{ minHeight: 36 }}
					>
						<span style={{ visibility: busy ? "hidden" : "visible" }}>
							{t("ENABLE_AUTOMATIC_LOCKING")}
						</span>
						{busy && (
							<span
								role="progressbar"
								aria-label={`${t("ENABLING_AUTOMATIC_LOCKING")}`}
								style={{
									position: "absolute",
									inset: 0,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<BarLoader color="#FFF" height={17} width={37} loading={busy} />
							</span>
						)}
					</Button>
					{continueButton}
				</Stack>
			)}
			{!setupMode && config?.enabled && (
				<Stack direction="row" spacing={1}>
					<Button
						variant="contained"
						color="primary"
						disabled={busy || supported === false}
						onClick={() => save(true)}
					>
						{t("SAVE")}
					</Button>
				</Stack>
			)}
			{error && <Alert severity="error">{t(error)}</Alert>}
		</Stack>
	);
}

export function VaultGate({ children }: { children: React.ReactNode }) {
	const { t } = useTranslation();
	const location = useLocation();
	const loggingOut = isLogoutPage(location.pathname);
	const classes = useStyles();
	const popup = window.location.pathname.endsWith("/default_popup.html");
	const config = useLock();
	const loggedIn = useSelector((state) => state.user.isLoggedIn);
	const required = useSelector(
		(state) => state.server.complianceEnforceLocking,
	);
	const maximum = useSelector((state) => state.server.complianceMaxLockTimeout);
	const [error, setError] = React.useState("");
	const [busy, setBusy] = React.useState(false);
	const [accounts, setAccounts] = React.useState(false);
	const locked = !loggingOut && vaultLock.isLocked();
	const unlockInTab = TARGET === "firefox" && popup;
	React.useEffect(() => {
		document.body.classList.remove("loading");
	}, []);
	React.useEffect(() => {
		const activity = (event: Event) => {
			if (event.isTrusted) vaultLock.touch();
		};
		for (const event of [
			"pointerdown",
			"pointermove",
			"keydown",
			"wheel",
			"touchstart",
			"input",
		]) {
			window.addEventListener(event, activity, {
				capture: true,
				passive: true,
			});
		}
		return () => {
			for (const event of [
				"pointerdown",
				"pointermove",
				"keydown",
				"wheel",
				"touchstart",
				"input",
			])
				window.removeEventListener(event, activity, true);
		};
	}, []);
	React.useEffect(() => {
		if (
			!loggingOut &&
			config?.enabled &&
			maximum &&
			maximum > 0 &&
			config.timeout > maximum &&
			!locked
		) {
			vaultLock
				.update(true, maximum, !!required, maximum)
				.catch(() => vaultLock.lock());
		}
	}, [config?.timeout, maximum, locked, required, loggingOut]);
	React.useEffect(() => {
		if (loggingOut || !loggedIn || locked || (required && !config?.enabled))
			return;
		const refresh = () => offlineCache.incrementalUpdate().catch(() => {});
		const reconnect = () =>
			offlineCache.incrementalUpdate(true).catch(() => {});
		refresh();
		const timer = window.setInterval(refresh, 5 * 60 * 1000);
		window.addEventListener("online", reconnect);
		return () => {
			window.clearInterval(timer);
			window.removeEventListener("online", reconnect);
		};
	}, [loggedIn, locked, config?.enabled, required, loggingOut]);
	const unlock = async () => {
		setError("");
		setBusy(true);
		try {
			await vaultLock.unlock();
		} catch (error) {
			setError(error instanceof Error ? error.message : String(error));
		} finally {
			setBusy(false);
		}
	};
	const restoring = config?.enabled && !locked && !loggedIn;
	if (
		loggingOut ||
		(!locked &&
			!restoring &&
			!(loggedIn && (required || config?.requested) && !config?.enabled))
	)
		return <>{children}</>;
	return (
		<>
			{popup && (
				<GlobalStyles
					styles={(theme) => ({
						body: { backgroundColor: theme.palette.blueBackground.main },
					})}
				/>
			)}
			<DarkBox className={popup ? classes.popupBox : classes.box}>
				<ConfigLogo configKey="logo" defaultLogo="img/logo.png" height="100%" />
				<a
					href="https://psono.com/"
					aria-label={`${t("INFO")}: Psono`}
					target="_blank"
					rel="noopener"
					className="infolabel"
				>
					<i className="fa fa-info-circle" aria-hidden="true" />
				</a>
				<div className={classes.form}>
					<Typography variant="h5" gutterBottom>
						{locked || restoring
							? t("VAULT_LOCKED")
							: t("CONFIGURE_AUTOMATIC_LOCKING")}
					</Typography>
					{restoring ? (
						<Typography>{t("LOADING")}</Typography>
					) : locked ? (
						<Stack spacing={2}>
							<Typography>{t("UNLOCK_DEVICE_DESCRIPTION")}</Typography>
							{unlockInTab ? (
								<AuthenticationInTab>{t("UNLOCK")}</AuthenticationInTab>
							) : (
								<Button variant="contained" disabled={busy} onClick={unlock}>
									{t("UNLOCK")}
								</Button>
							)}
							{error && <Alert severity="error">{t(error)}</Alert>}
						</Stack>
					) : (
						<LockSettings required={!!required} setup />
					)}
					<Stack direction="row" spacing={1} sx={{ mt: 2 }}>
						<Button disabled={busy} onClick={() => setAccounts(true)}>
							{t("CHANGE_ACCOUNT")}
						</Button>
						<Button
							disabled={busy}
							onClick={() => user.logout().then(() => window.location.reload())}
						>
							{t("LOGOUT")}
						</Button>
					</Stack>
					{accounts && (
						<DialogChangeAccount open onClose={() => setAccounts(false)} />
					)}
				</div>
			</DarkBox>
		</>
	);
}
