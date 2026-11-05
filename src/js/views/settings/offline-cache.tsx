import RefreshIcon from "@mui/icons-material/Refresh";
import {
	Alert,
	Button,
	Divider,
	Grid,
	IconButton,
	LinearProgress,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Tooltip,
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { SettingsViewProps } from "../../../types/settings-ui";
import offlineCache from "../../services/offline-cache";
import vaultLock from "../../services/vault-lock";

const SettingsOfflineCacheView = (_props: SettingsViewProps) => {
	const { t } = useTranslation();
	const disabledByServer = useSelector(
		(state) => state.server.complianceDisableOfflineMode,
	);
	const [, render] = React.useReducer((value) => value + 1, 0);
	const [endpoints, setEndpoints] = React.useState<string[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [refreshing, setRefreshing] = React.useState<string | null>(null);
	const [message, setMessage] = React.useState<"success" | "error" | null>(
		null,
	);
	const [page, setPage] = React.useState(0);
	const [rowsPerPage, setRowsPerPage] = React.useState(10);
	const mounted = React.useRef(true);
	const available = offlineCache.canUse();
	const busy = loading || refreshing !== null;

	React.useEffect(() => {
		mounted.current = true;
		const unsubscribe = vaultLock.subscribe(render);
		return () => {
			mounted.current = false;
			unsubscribe();
		};
	}, []);
	const loadEndpoints = React.useCallback(async () => {
		const entries = await offlineCache.listEndpoints();
		if (mounted.current) setEndpoints(entries);
	}, []);
	React.useEffect(() => {
		setLoading(true);
		loadEndpoints()
			.catch(() => {
				if (mounted.current) setMessage("error");
			})
			.finally(() => {
				if (mounted.current) setLoading(false);
			});
	}, [available, loadEndpoints]);
	React.useEffect(() => {
		if (!message) return;
		const timer = window.setTimeout(() => setMessage(null), 5000);
		return () => window.clearTimeout(timer);
	}, [message]);

	const refresh = async (endpoint?: string) => {
		if (busy || !offlineCache.canUse()) return;
		setRefreshing(endpoint ?? "all");
		setMessage(null);
		try {
			if (endpoint) await offlineCache.refreshEndpoint(endpoint);
			else await offlineCache.incrementalUpdate(true);
			if (mounted.current) setMessage("success");
		} catch {
			if (mounted.current) setMessage("error");
		} finally {
			try {
				await loadEndpoints();
			} catch {
				if (mounted.current) setMessage("error");
			}
			if (mounted.current) setRefreshing(null);
		}
	};
	const currentPage = Math.min(
		page,
		Math.max(0, Math.ceil(endpoints.length / rowsPerPage) - 1),
	);

	return (
		<Grid container spacing={2}>
			<Grid item xs={12}>
				<h2>{t("OFFLINE_CACHE")}</h2>
				<p>{t("OFFLINE_CACHE_DESCRIPTION")}</p>
				<Divider />
			</Grid>
			<Grid item xs={12}>
				<Button
					variant="contained"
					color="primary"
					startIcon={<RefreshIcon />}
					disabled={busy || !available}
					onClick={() => refresh()}
				>
					{t("REFRESH_OFFLINE_CACHE")}
				</Button>
			</Grid>
			{disabledByServer ? (
				<Grid item xs={12}>
					<Alert severity="info">{t("OFFLINE_CACHE_DISABLED_BY_SERVER")}</Alert>
				</Grid>
			) : (
				!available && (
					<Grid item xs={12}>
						<Alert severity="info">
							{t("OFFLINE_CACHE_REQUIRES_LOCKING")}{" "}
							<Link to="/settings/general">{t("GENERAL")}</Link>
						</Alert>
					</Grid>
				)
			)}
			{message && (
				<Grid item xs={12}>
					<Alert severity={message} onClose={() => setMessage(null)}>
						{message === "success"
							? t("SUCCESS_CACHE_UPDATED")
							: t("ERROR_CACHE_NOT_UPDATED")}
					</Alert>
				</Grid>
			)}
			{busy && (
				<Grid item xs={12}>
					<LinearProgress />
				</Grid>
			)}
			{available && (
				<Grid item xs={12}>
					<TableContainer>
						<Table size="small" aria-label={`${t("OFFLINE_CACHE")}`}>
							<TableHead>
								<TableRow>
									<TableCell>{t("ENDPOINT")}</TableCell>
									<TableCell align="right">{t("REFRESH")}</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{endpoints
									.slice(
										currentPage * rowsPerPage,
										(currentPage + 1) * rowsPerPage,
									)
									.map((endpoint) => (
										<TableRow key={endpoint}>
											<TableCell sx={{ overflowWrap: "anywhere" }}>
												{endpoint}
											</TableCell>
											<TableCell align="right">
												<Tooltip title={t("REFRESH")}>
													<span>
														<IconButton
															aria-label={`${t("REFRESH")}: ${endpoint}`}
															disabled={busy}
															onClick={() => refresh(endpoint)}
															size="small"
														>
															<RefreshIcon />
														</IconButton>
													</span>
												</Tooltip>
											</TableCell>
										</TableRow>
									))}
								{!loading && endpoints.length === 0 && (
									<TableRow>
										<TableCell colSpan={2}>
											{t("OFFLINE_CACHE_EMPTY")}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableContainer>
					<TablePagination
						component="div"
						count={endpoints.length}
						page={currentPage}
						rowsPerPage={rowsPerPage}
						rowsPerPageOptions={[10, 25, 50]}
						onPageChange={(_, value) => setPage(value)}
						onRowsPerPageChange={(event) => {
							setRowsPerPage(Number(event.target.value));
							setPage(0);
						}}
					/>
				</Grid>
			)}
		</Grid>
	);
};

export default SettingsOfflineCacheView;
