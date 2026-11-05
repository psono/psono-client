import CloudOffIcon from "@mui/icons-material/CloudOff";
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	IconButton,
	Snackbar,
	Tooltip,
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { cacheStatus } from "../services/offline-cache";
import offlineCache from "../services/offline-cache";

export default function CacheStatusIndicator() {
	const { t } = useTranslation();
	const loggedIn = useSelector((state) => state.user.isLoggedIn);
	const offlineMode = useSelector((state) => state.client.offlineMode);
	const [, render] = React.useReducer((value) => value + 1, 0);
	const [details, setDetails] = React.useState(false);
	React.useEffect(() => cacheStatus.subscribe(render), []);
	const status = cacheStatus.getSnapshot();
	const offline = status.offline || offlineMode;
	if (!loggedIn || (!status.refreshing && !offline)) return null;
	const label = status.entryRefreshing
		? t("ENTRY_REFRESHING")
		: status.datastoreRefreshing
			? t("DATASTORE_REFRESHING")
			: status.refreshing
				? t("CACHE_REFRESHING")
				: t("OFFLINE_CACHE_ACTIVE");
	const retry = () => {
		setDetails(false);
		cacheStatus.retryAll();
		void offlineCache.incrementalUpdate(true).catch(() => {});
	};
	return (
		<>
			<Box
				role="status"
				aria-live="polite"
				sx={{
					position: "fixed",
					top: 8,
					right: 8,
					zIndex: (theme) => theme.zIndex.modal + 1,
				}}
			>
				<Tooltip title={label}>
					<IconButton
						size="small"
						aria-label={`${label}`}
						onClick={() => setDetails(true)}
						sx={{
							width: 28,
							height: 28,
							bgcolor: "background.paper",
							boxShadow: 1,
							color: status.refreshing ? "primary.main" : "warning.dark",
							"&:hover": { bgcolor: "background.paper" },
						}}
					>
						{status.refreshing ? (
							<CircularProgress
								size={14}
								thickness={5}
								color="inherit"
								aria-label={`${label}`}
							/>
						) : (
							<CloudOffIcon fontSize="small" />
						)}
					</IconButton>
				</Tooltip>
			</Box>
			<Snackbar
				open={details}
				autoHideDuration={8000}
				onClose={() => setDetails(false)}
			>
				<Alert
					severity={status.refreshing ? "info" : "warning"}
					onClose={() => setDetails(false)}
					action={
						!status.refreshing && (
							<Button color="inherit" onClick={retry}>
								{t("RETRY")}
							</Button>
						)
					}
				>
					{status.refreshing
						? t("BACKGROUND_REFRESH_DETAILS")
						: t("OFFLINE_CACHE_ACTIVE_DETAILS")}
				</Alert>
			</Snackbar>
		</>
	);
}
