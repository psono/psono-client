import { Alert, Button, Divider, LinearProgress } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import hostService from "../services/host";
import { useOfflineMode } from "./use-offline-mode";
import linkCleanup, {
	LinkCleanupError,
	type LinkCleanupProgress,
	type LinkCleanupResult,
} from "../services/secret-link";

const LinkCleanup = () => {
	const { t } = useTranslation();
	const offline = useOfflineMode();
	const supported = useSelector((state) =>
		hostService.supportsSecretLinkCleanup(state.server),
	);
	const [busy, setBusy] = React.useState(false);
	const [progress, setProgress] = React.useState<LinkCleanupProgress>();
	const [result, setResult] = React.useState<LinkCleanupResult>();
	const [error, setError] = React.useState<string>();
	const [details, setDetails] = React.useState<string>();
	const mounted = React.useRef(true);
	const running = React.useRef(false);
	React.useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);
	const cleanup = async () => {
		if (running.current || offline || !supported) return;
		running.current = true;
		setBusy(true);
		setResult(undefined);
		setError(undefined);
		setDetails(undefined);
		setProgress(undefined);
		try {
			const completed = await linkCleanup.cleanup((value) => {
				if (mounted.current) setProgress(value);
			});
			if (mounted.current) setResult(completed);
		} catch (failure) {
			if (mounted.current) {
				setError(
					failure instanceof LinkCleanupError
						? failure.message
						: "LINK_CLEANUP_FAILED",
				);
				if (failure instanceof LinkCleanupError) {
					setResult(failure.result);
					setDetails(failure.details);
				}
			}
		} finally {
			running.current = false;
			if (mounted.current) setBusy(false);
		}
	};
	if (!supported) return null;
	return (
		<section>
			<h2>{t("LINK_CLEANUP")}</h2>
			<p>{t("LINK_CLEANUP_DESCRIPTION")}</p>
			<Divider sx={{ marginBottom: 2 }} />
			<Button
				variant="contained"
				color="primary"
				disabled={busy || offline}
				onClick={cleanup}
			>
				{t("CLEAN_UP_LINKS")}
			</Button>
			{busy && (
				<>
					<p role="status">
						{progress?.phase === "repair"
							? t("LINK_CLEANUP_REPAIR_PROGRESS", {
									completed: progress.completed,
									total: progress.total,
								})
							: t("LINK_CLEANUP_SCAN_PROGRESS", {
									completed: progress?.completed ?? 0,
								})}
					</p>
					<LinearProgress />
				</>
			)}
			{error && (
				<Alert severity="error" sx={{ marginTop: 2 }}>
					{t(error, { defaultValue: t("LINK_CLEANUP_FAILED") })}
					{details && <div>{details}</div>}
				</Alert>
			)}
			{result && (
				<Alert severity={error ? "info" : "success"} sx={{ marginTop: 2 }}>
					{t("LINK_CLEANUP_RESULT", { ...result })}
				</Alert>
			)}
		</section>
	);
};

export default LinkCleanup;
