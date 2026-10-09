import { Check } from "@mui/icons-material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import EditIcon from "@mui/icons-material/Edit";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Checkbox, FormControlLabel, Grid } from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { makeStyles } from "@mui/styles";
import type { ChartData } from "chart.js";
import type { MUIDataTableColumn, MUIDataTableOptions } from "mui-datatables";
import React, { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AuthErrorData } from "../../../types/auth";
import type { AnalyzedPassword, SecurityAnalysis } from "../../../types/vault";
import AlertSecurityReport from "../../components/alert/security-report";
import Base from "../../components/base";
import BaseContent from "../../components/base-content";
import BaseTitle from "../../components/base-title";
import GridContainerErrors from "../../components/grid-container-errors";
import Table from "../../components/table";
import TextFieldColored from "../../components/text-field/colored";
import browserClient from "../../services/browser-client";
import cryptoLibrary from "../../services/crypto-library";
import securityReportService from "../../services/security-report";
import { getStore } from "../../services/store";

const LazyDoughnut = React.lazy(
	() =>
		import(/* webpackChunkName: "security-report-charts" */ "./doughnut-chart"),
);

const Doughnut = (props: { data: ChartData<"doughnut"> }) => (
	<Suspense fallback={<LinearProgress />}>
		<LazyDoughnut {...props} />
	</Suspense>
);

const useStyles = makeStyles((theme) => ({
	toolbarRoot: {
		backgroundColor: theme.palette.baseTitleBackground.main,
	},
	root: {
		display: "flex",
		padding: "15px",
	},
	textField: {
		width: "100%",
		[theme.breakpoints.up("md")]: {
			width: "440px",
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
	muiWarning: {
		marginTop: theme.spacing(2),
	},
	downloadingPasswords: {
		marginTop: theme.spacing(2),
	},
	muiInfo: {
		marginBottom: theme.spacing(1),
	},
	securityReportAlert: {
		marginBottom: theme.spacing(1),
	},
	doughnutContainer: {
		padding: theme.spacing(2),
	},
	doughnutSubText: {
		textAlign: "center",
	},
	doughnutHeader: {
		marginBottom: theme.spacing(1),
	},
	passwordField: {
		fontFamily: "'Fira Code', monospace",
	},
	passwordContainer: {
		"& .MuiInputBase-input": {
			fontSize: "0.8125rem",
		},
	},
}));

type ReportResult = Awaited<
	ReturnType<typeof securityReportService.generateSecurityReport>
>;
type ReportRow = [
	id: number,
	name: AnalyzedPassword["name"],
	password: AnalyzedPassword["password"],
	rating: number,
	writeAge: number,
	passwordLength: number,
	variationCount: number,
	breached: boolean,
	duplicate: boolean,
	advice: string,
	passwordData: AnalyzedPassword,
];

interface ReportError extends AuthErrorData {
	errors?: string[];
}

const SecurityReportView = (
	props: Omit<React.ComponentProps<typeof Base>, "children">,
) => {
	const classes = useStyles();
	const { t } = useTranslation();
	const [password, setPassword] = useState("");
	const [passwordTouched, setPasswordTouched] = useState(false);
	const userAuthentication = getStore().getState().user.authentication;
	const passwordSha1Prefix = getStore().getState().user.passwordSha1Prefix;
	const hideSendToServer =
		getStore().getState().server.disableCentralSecurityReports;
	const showRecoveryCodeAdvise =
		!getStore().getState().server.complianceDisableRecoveryCodes;
	const disableSendToSeverChoice =
		getStore().getState().server.disableCentralSecurityReports ||
		getStore().getState().server.complianceEnforceCentralSecurityReports;
	const requireMasterPassword =
		["LDAP", "AUTHKEY"].indexOf(userAuthentication) !== -1;
	const passwordMismatch =
		Boolean(password) &&
		Boolean(passwordSha1Prefix) &&
		cryptoLibrary.sha1(password).substring(0, 2) !== passwordSha1Prefix;
	const [passwordStrengthData, setPasswordStrengthData] = React.useState<
		Partial<ChartData<"doughnut">>
	>({});
	const [passwordDuplicateData, setPasswordDuplicateData] = React.useState<
		Partial<ChartData<"doughnut">>
	>({});
	const [passwordAverageScoreData, setPasswordAverageScoreData] =
		React.useState<Partial<ChartData<"doughnut">>>({});
	const [passwordAgeData, setPasswordAgeData] = React.useState<
		Partial<ChartData<"doughnut">>
	>({});
	const [haveibeenpwnedProcessing, setHaveibeenpwnedProcessing] =
		React.useState(true);
	const [errors, setErrors] = useState<string[]>([]);
	const [msgs, setMsgs] = useState<string[]>([]);
	const [reportComplete, setReportComplete] = useState(false);
	const [visiblePasswordId, setVisiblePasswordId] = useState<number | null>(
		null,
	);

	const [checkHaveibeenpwned, setCheckHaveibeenpwned] = useState(
		getStore().getState().server.complianceEnforceBreachDetection,
	);
	const [analysis, setAnalysis] = useState<SecurityAnalysis>({
		passwords: [],
	});
	const [
		haveibeenpwnedPercentageComplete,
		setHaveibeenpwnedPercentageComplete,
	] = React.useState(0);

	const [sendToServer, setSendToServer] = useState(
		getStore().getState().server.complianceEnforceCentralSecurityReports &&
			!getStore().getState().server.disableCentralSecurityReports,
	);

	let openSecretRequests = 0;
	let closedSecretRequests = 0;
	let openHaveibeenpwnedRequests = 0;
	let closedHaveibeenpwnedRequests = 0;

	let isSubscribed = true;

	React.useEffect(() => {
		iniatiateState();

		securityReportService.on("get-secret-started", () => {
			if (!isSubscribed) {
				return;
			}
			openSecretRequests = openSecretRequests + 1;
		});

		securityReportService.on("get-secret-complete", () => {
			if (!isSubscribed) {
				return;
			}
			closedSecretRequests = closedSecretRequests + 1;
		});

		securityReportService.on("generation-complete", () => {
			if (!isSubscribed) {
				return;
			}
			openSecretRequests = 0;
			closedSecretRequests = 0;
		});

		securityReportService.on("check-haveibeenpwned-started", () => {
			if (!isSubscribed) {
				return;
			}
			setHaveibeenpwnedProcessing(true);
		});

		securityReportService.on("get-haveibeenpwned-started", () => {
			if (!isSubscribed) {
				return;
			}
			openHaveibeenpwnedRequests = openHaveibeenpwnedRequests + 1;
			setHaveibeenpwnedPercentageComplete(
				openHaveibeenpwnedRequests
					? Math.round(
							(closedHaveibeenpwnedRequests / openHaveibeenpwnedRequests) *
								1000,
						) / 10
					: 0,
			);
		});

		securityReportService.on("get-haveibeenpwned-complete", () => {
			if (!isSubscribed) {
				return;
			}
			closedHaveibeenpwnedRequests = closedHaveibeenpwnedRequests + 1;
			setHaveibeenpwnedPercentageComplete(
				openHaveibeenpwnedRequests
					? Math.round(
							(closedHaveibeenpwnedRequests / openHaveibeenpwnedRequests) *
								1000,
						) / 10
					: 0,
			);
		});

		securityReportService.on("check-haveibeenpwned-complete", () => {
			if (!isSubscribed) {
				return;
			}
			openHaveibeenpwnedRequests = 0;
			closedHaveibeenpwnedRequests = 0;
			setHaveibeenpwnedProcessing(false);
			setHaveibeenpwnedPercentageComplete(
				openHaveibeenpwnedRequests
					? Math.round(
							(closedHaveibeenpwnedRequests / openHaveibeenpwnedRequests) *
								1000,
						) / 10
					: 0,
			);
		});

		return () => {
			isSubscribed = false;
		};
	}, []);

	function iniatiateState() {
		if (!isSubscribed) {
			return;
		}
		setReportComplete(false);
		setHaveibeenpwnedProcessing(false);
		openHaveibeenpwnedRequests = 0;
		closedHaveibeenpwnedRequests = 0;
		openSecretRequests = 0;
		closedSecretRequests = 0;
		setErrors([]);
		setMsgs([]);
	}

	const generateSecurityReport = () => {
		if (
			requireMasterPassword &&
			(!password || !passwordSha1Prefix || passwordMismatch)
		) {
			return;
		}
		const masterPassword = password;

		setErrors([]);
		setMsgs([]);
		setPassword("");
		setPasswordTouched(false);

		const onSuccess = (data: ReportResult) => {
			setErrors([]);
			setMsgs(data.msgs);
			setAnalysis(data.analysis!);
			// Generation has run both summary stages before resolving this callback.
			const summary = data.analysis!.password_summary!;
			setPasswordStrengthData({
				labels: [t("WEAK"), t("GOOD"), t("STRONG")],
				datasets: [
					{
						label: t("PASSWORD_STRENGTH"),
						data: [summary["weak"], summary["good"], summary["strong"]],
						backgroundColor: ["#ff7a55", "#ffb855", "#00aaaa"],
					},
				],
			});
			setPasswordDuplicateData({
				labels: [t("DUPLICATES"), t("UNIQUE")],
				datasets: [
					{
						label: t("DUPLICATES"),
						data: [summary["duplicate"], summary["no_duplicate"]],
						backgroundColor: ["#ff7a55", "#00aaaa"],
					},
				],
			});
			setPasswordAverageScoreData({
				labels: [t("AVERAGE_SCORE"), ""],
				datasets: [
					{
						label: t("PASSWORD_STRENGTH"),
						data: [summary["average_rating"], 100 - summary["average_rating"]],
						backgroundColor: ["#00aaaa", "#FFFFFF"],
					},
				],
			});
			setPasswordAgeData({
				labels: [
					t("OLDER_THAN_180_DAYS"),
					t("OLDER_THAN_90_DAYS"),
					t("NEWER_THAN_90_DAYS"),
				],
				datasets: [
					{
						label: t("PASSWORD_AGE"),
						data: [
							summary["update_older_than_180_days"],
							summary["update_older_than_90_days"],
							summary["update_newer_than_90_days"],
						],
						backgroundColor: ["#ff7a55", "#ffb855", "#00aaaa"],
					},
				],
			});
			setReportComplete(true);

			const onSuccess = () => {
				// server accepted security report
			};

			const onError = (data: AuthErrorData) => {
				setMsgs([]);
				console.log(data);
				if (Object.hasOwn(data, "non_field_errors")) {
					if (data.non_field_errors![0] === "PASSWORD_INCORRECT") {
						setErrors(["PASSWORD_INCORRECT_SERVER_DECLINED_SECURITY_REPORT"]);
					} else {
						setErrors(data.non_field_errors!);
					}
				} else {
					console.log(data);
					alert("Error, should not happen.");
				}
			};

			if (sendToServer) {
				return securityReportService
					.sendToServer(data.analysis!, checkHaveibeenpwned, masterPassword)
					.then(onSuccess, onError);
			}
		};

		const onError = (data: ReportError) => {
			setMsgs([]);
			console.log(data);

			if (Object.hasOwn(data, "errors")) {
				if (data.errors![0] === "RESOURCE_NOT_FOUND") {
					setErrors(["FEATURE_NOT_SUPPORTED_SERVER_REQUIRES_UPGRADE"]);
				} else {
					setErrors(data.errors!);
				}
			}
		};

		iniatiateState();

		securityReportService
			.generateSecurityReport(masterPassword, checkHaveibeenpwned)
			.then(onSuccess, onError);
	};

	const columns: MUIDataTableColumn[] = [
		{ name: t("ID"), options: { display: false } },
		{ name: t("NAME") },
		{
			name: t("PASSWORD"),
			options: {
				filter: false,
				sort: false,
				empty: false,
				customBodyRender: (value, tableMeta, updateValue) => {
					const row = tableMeta.rowData as ReportRow;
					const rowId = row[0];
					const showPassword = visiblePasswordId === rowId;

					return (
						<div className={classes.passwordContainer}>
							<TextFieldColored
								key={rowId}
								className={classes.textField}
								variant="outlined"
								margin="dense"
								size="small"
								label={t("PASSWORD")}
								name="websitePasswordPassword"
								autoComplete="off"
								value={row[2]}
								InputProps={{
									readOnly: true,
									type: showPassword ? "text" : "password",
									classes: {
										input: classes.passwordField,
									},
									endAdornment: (
										<InputAdornment position="end">
											<IconButton
												aria-label="toggle password visibility"
												onClick={() =>
													setVisiblePasswordId(showPassword ? null : rowId)
												}
												edge="end"
												size="large"
											>
												{showPassword ? (
													<Visibility fontSize="small" />
												) : (
													<VisibilityOff fontSize="small" />
												)}
											</IconButton>
										</InputAdornment>
									),
								}}
							/>
						</div>
					);
				},
			},
		},
		{ name: t("RATING") },
		{
			name: t("AGE"),
			options: {
				filter: false,
				sort: true,
				empty: false,
				customBodyRender: (value, tableMeta, updateValue) => {
					return (
						<React.Fragment>
							{(tableMeta.rowData as ReportRow)[4]} {t("DAYS")}
						</React.Fragment>
					);
				},
			},
		},
		{
			name: t("PASSWORD_LENGTH"),
			options: {
				display: false,
				filter: false,
				sort: true,
				empty: false,
			},
		},
		{
			name: t("CHARACTER_GROUPS"),
			options: {
				display: false,
				filter: false,
				sort: true,
				empty: false,
			},
		},
		{
			name: t("BREACHED"),
			options: {
				display: checkHaveibeenpwned,
				filter: true,
				sort: true,
				empty: false,
				customBodyRender: (value, tableMeta, updateValue) => {
					return (tableMeta.rowData as ReportRow)[7] ? (
						<CheckBoxIcon />
					) : (
						<CheckBoxOutlineBlankIcon />
					);
				},
			},
		},
		{
			name: t("DUPLICATE"),
			options: {
				filter: true,
				sort: true,
				empty: false,
				customBodyRender: (value, tableMeta, updateValue) => {
					return (tableMeta.rowData as ReportRow)[8] ? (
						<CheckBoxIcon />
					) : (
						<CheckBoxOutlineBlankIcon />
					);
				},
			},
		},
		{ name: t("ADVICE"), options: { filter: false } },
		{
			name: t("EDIT"),
			options: {
				customBodyRender: (value, tableMeta, updateValue) => {
					const row = tableMeta.rowData as ReportRow;
					return (
						<IconButton
							onClick={() => {
								browserClient.openTab(
									"index.html#!/datastore/edit/" +
										row[10].type +
										"/" +
										row[10].secret_id,
								);
							}}
							disabled={!row[10].secret_id}
						>
							<EditIcon />
						</IconButton>
					);
				},
			},
		},
	];

	const options: MUIDataTableOptions = {
		filterType: "checkbox",
	};

	const data = analysis.passwords.map((pw, index): ReportRow => {
		return [
			index,
			pw.name,
			pw.password,
			pw.rating,
			pw.write_age,
			pw.password_length,
			pw.variation_count,
			// The API may return a numeric string. Keep the existing > coercion.
			(pw.breached as number) > 0,
			pw.duplicate,
			t(pw.advice, pw),
			pw,
		];
	});

	return (
		<Base {...props}>
			<BaseTitle>{t("SECURITY_REPORT")}</BaseTitle>
			<BaseContent>
				<Paper square>
					<AppBar elevation={0} position="static" color="default">
						<Toolbar className={classes.toolbarRoot}>
							{t("GENERATE_SECURITY_REPORT")}
						</Toolbar>
					</AppBar>
					{reportComplete && (
						<div className={classes.root}>
							<Grid container justifyContent="center">
								{!analysis.user_summary!.multifactor_auth_enabled && (
									<Grid
										item
										xs={12}
										sm={12}
										md={12}
										className={classes.muiInfo}
									>
										<MuiAlert severity="warning">
											{t("CONSIDER_ENABLING_MULTIFACTOR_AUTHENTICATION")}
										</MuiAlert>
									</Grid>
								)}
								{showRecoveryCodeAdvise &&
									!analysis.user_summary!.recovery_code_enabled && (
										<Grid
											item
											xs={12}
											sm={12}
											md={12}
											className={classes.muiInfo}
										>
											<MuiAlert severity="warning">
												{t("CONSIDER_ENABLING_RECOVERY_CODES")}
											</MuiAlert>
										</Grid>
									)}
								<GridContainerErrors errors={errors} setErrors={setErrors} />
								<GridContainerErrors
									errors={msgs}
									setErrors={setMsgs}
									severity="info"
								/>
								<Grid
									item
									xs={6}
									sm={3}
									md={3}
									lg={2}
									className={classes.doughnutContainer}
								>
									<Typography
										variant="body2"
										noWrap
										className={classes.doughnutHeader}
									>
										{t("PASSWORD_STRENGTH")}
									</Typography>
									<Doughnut
										data={passwordStrengthData as ChartData<"doughnut">}
									/>
									{Boolean(analysis.password_summary!.weak) && (
										<Typography
											variant="body2"
											className={classes.doughnutSubText}
										>
											{analysis.password_summary!.weak} {t("WEAK_PASSWORDS")}
										</Typography>
									)}
									{!analysis.password_summary!.weak && (
										<Typography
											variant="body2"
											className={classes.doughnutSubText}
										>
											{t("NO_WEAK_PASSWORDS")}
										</Typography>
									)}
								</Grid>
								<Grid
									item
									xs={6}
									sm={3}
									md={3}
									lg={2}
									className={classes.doughnutContainer}
								>
									<Typography
										variant="body2"
										noWrap
										className={classes.doughnutHeader}
									>
										{t("DUPLICATES")}
									</Typography>
									<Doughnut
										data={passwordDuplicateData as ChartData<"doughnut">}
									/>
									{Boolean(analysis.password_summary!.duplicate) && (
										<Typography
											variant="body2"
											className={classes.doughnutSubText}
										>
											{analysis.password_summary!.duplicate} {t("DUPLICATES")}
										</Typography>
									)}
									{!analysis.password_summary!.duplicate && (
										<Typography
											variant="body2"
											className={classes.doughnutSubText}
										>
											{t("NO_DUPLICATES")}
										</Typography>
									)}
								</Grid>
								<Grid
									item
									xs={6}
									sm={3}
									md={3}
									lg={2}
									className={classes.doughnutContainer}
								>
									<Typography
										variant="body2"
										noWrap
										className={classes.doughnutHeader}
									>
										{t("AVERAGE_SCORE")}
									</Typography>
									<Doughnut
										data={passwordAverageScoreData as ChartData<"doughnut">}
									/>
									<Typography
										variant="body2"
										className={classes.doughnutSubText}
									>
										{analysis.password_summary!.average_rating}% {t("SCORE")}
									</Typography>
								</Grid>
								<Grid
									item
									xs={6}
									sm={3}
									md={3}
									lg={2}
									className={classes.doughnutContainer}
								>
									<Typography
										variant="body2"
										noWrap
										className={classes.doughnutHeader}
									>
										{t("PASSWORD_AGE")}
									</Typography>
									<Doughnut data={passwordAgeData as ChartData<"doughnut">} />
									<Typography
										variant="body2"
										className={classes.doughnutSubText}
									>
										{analysis.password_summary!.average_update_age} {t("DAYS")}
									</Typography>
								</Grid>
								<Grid item xs={12} sm={12} md={12}>
									<Table data={data} columns={columns} options={options} />
								</Grid>
							</Grid>
						</div>
					)}
					{!reportComplete && (
						<div className={classes.root}>
							<Grid container>
								<Grid item xs={12} sm={12} md={12} className={classes.muiInfo}>
									<AlertSecurityReport
										className={classes.securityReportAlert}
									/>
									<MuiAlert severity="info">
										{t("SECURITY_REPORT_GOAL")}
									</MuiAlert>
								</Grid>
								{requireMasterPassword && (
									<Grid
										item
										xs={12}
										sm={12}
										md={12}
										className={classes.muiInfo}
									>
										<Typography variant="body2">
											{t("SECURITY_REPORT_PASSWORD_EXPLANATION")}
										</Typography>
										{!passwordSha1Prefix && (
											<MuiAlert severity="info" className={classes.muiWarning}>
												{t("SECURITY_REPORT_SIGN_IN_AGAIN")}
											</MuiAlert>
										)}
										<TextField
											className={classes.textField}
											variant="outlined"
											margin="dense"
											size="small"
											id="password"
											label={t("YOUR_PASSWORD")}
											name="password"
											autoComplete="off"
											disabled={!passwordSha1Prefix}
											value={password}
											onChange={(event) => {
												setPassword(event.target.value);
											}}
											onBlur={() => setPasswordTouched(true)}
											error={passwordTouched && passwordMismatch}
											helperText={
												passwordTouched && passwordMismatch
													? t("SECURITY_REPORT_PASSWORD_MISMATCH")
													: undefined
											}
											InputProps={{
												type: "password",
											}}
										/>
									</Grid>
								)}
								<Grid item xs={12} sm={12} md={12}>
									<FormControlLabel
										label={t("SECURITY_REPORT_CHECK_BREACHES")}
										control={
											<Checkbox
												checked={checkHaveibeenpwned}
												onChange={(event) =>
													setCheckHaveibeenpwned(event.target.checked)
												}
												disabled={
													getStore().getState().server
														.complianceEnforceBreachDetection
												}
												checkedIcon={<Check className={classes.checkedIcon} />}
												icon={<Check className={classes.uncheckedIcon} />}
												classes={{
													checked: classes.checked,
												}}
											/>
										}
									/>
									<Typography variant="body2">
										{t("SECURITY_REPORT_BREACH_CHECK_DETAILS")}{" "}
										<a
											href="https://haveibeenpwned.com/Passwords"
											target="_blank"
											rel="noopener"
										>
											haveibeenpwned.com
										</a>
										.
									</Typography>
								</Grid>
								{!hideSendToServer && (
									<Grid item xs={12} sm={12} md={12}>
										<FormControlLabel
											label={t("SECURITY_REPORT_SEND_SUMMARY")}
											control={
												<Checkbox
													checked={sendToServer}
													disabled={disableSendToSeverChoice}
													onChange={(event) => {
														setSendToServer(event.target.checked);
													}}
													checkedIcon={
														<Check className={classes.checkedIcon} />
													}
													icon={<Check className={classes.uncheckedIcon} />}
													classes={{
														checked: classes.checked,
													}}
												/>
											}
										/>
										<Typography variant="body2">
											{t("SECURITY_REPORT_SEND_DETAILS")}
										</Typography>
									</Grid>
								)}
								<Grid item xs={12} sm={12} md={12}>
									<Button
										variant="contained"
										color="primary"
										onClick={() => {
											generateSecurityReport();
										}}
										disabled={
											requireMasterPassword &&
											(!password || !passwordSha1Prefix || passwordMismatch)
										}
									>
										{t("START_ANALYSIS")}
									</Button>
								</Grid>

								<GridContainerErrors
									errors={errors}
									setErrors={setErrors}
									className={classes.muiWarning}
								/>
								<GridContainerErrors
									errors={msgs}
									setErrors={setMsgs}
									severity="info"
									className={classes.muiWarning}
								/>
								{haveibeenpwnedProcessing && (
									<Grid item xs={12} sm={12} md={12}>
										<Typography
											variant="body2"
											className={classes.downloadingPasswords}
										>
											{t("HAVEIBEENPWND_ANALYSIS")}:
										</Typography>
										<Box display="flex" alignItems="center">
											<Box width="100%" mr={1}>
												<LinearProgress
													variant="determinate"
													value={haveibeenpwnedPercentageComplete}
												/>
											</Box>
											<Box minWidth={35}>
												<span
													style={{
														color: "white",
														whiteSpace: "nowrap",
													}}
												>
													{haveibeenpwnedPercentageComplete} %
												</span>
											</Box>
										</Box>
									</Grid>
								)}

								<Grid
									item
									xs={12}
									sm={12}
									md={12}
									className={classes.muiWarning}
								>
									<MuiAlert severity="warning">
										{t("ANALYSIS_CAN_TAKE_SEVERAL_MINUTES")}
									</MuiAlert>
								</Grid>
							</Grid>
						</div>
					)}
				</Paper>
			</BaseContent>
		</Base>
	);
};

export default SecurityReportView;
