import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import Paper from "@mui/material/Paper";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import MuiAlert from '@mui/material/Alert'
import { Checkbox, Grid } from "@mui/material";
import Typography from "@mui/material/Typography";
import { Check } from "@mui/icons-material";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import { Chart, ArcElement, Tooltip } from "chart.js";

import { Doughnut } from "react-chartjs-2";

import Base from "../../components/base";
import BaseTitle from "../../components/base-title";
import BaseContent from "../../components/base-content";
import { getStore } from "../../services/store";
import GridContainerErrors from "../../components/grid-container-errors";
import securityReportService from "../../services/security-report";
import Table from "../../components/table";
import TextFieldPassword from "../../components/text-field/password";
import AlertSecurityReport from "../../components/alert/security-report";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import browserClient from "../../services/browser-client";

Chart.register(ArcElement, Tooltip);

const useStyles = makeStyles((theme) => ({
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
}));

const SecurityReportView = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");
    const userAuthentication = getStore().getState().user.authentication;
    const hideSendToServer = getStore().getState().server.disableCentralSecurityReports;
    const showRecoveryCodeAdvise = !getStore().getState().server.complianceDisableRecoveryCodes;
    const disableSendToSeverChoice =
        getStore().getState().server.disableCentralSecurityReports ||
        getStore().getState().server.complianceEnforceCentralSecurityReports;
    const requireMasterPassword = ["LDAP", "AUTHKEY"].indexOf(userAuthentication) !== -1;
    const [passwordStrengthData, setPasswordStrengthData] = React.useState({});
    const [passwordDuplicateData, setPasswordDuplicateData] = React.useState({});
    const [passwordAverageScoreData, setPasswordAverageScoreData] = React.useState({});
    const [passwordAgeData, setPasswordAgeData] = React.useState({});
    const [processing, setProcessing] = React.useState(true);
    const [haveibeenpwnedProcessing, setHaveibeenpwnedProcessing] = React.useState(true);
    const [errors, setErrors] = useState([]);
    const [msgs, setMsgs] = useState([]);
    const [reportComplete, setReportComplete] = useState(false);
    const [checkHaveibeenpwned, setCheckHaveibeenpwned] = useState(false);
    const [analysis, setAnalysis] = useState({
        'passwords': []
    });
    const [percentageComplete, setPercentageComplete] = React.useState(0);
    const [haveibeenpwnedPercentageComplete, setHaveibeenpwnedPercentageComplete] = React.useState(0);

    const [sendToServer, setSendToServer] = useState(
        getStore().getState().server.complianceEnforceCentralSecurityReports &&
            !getStore().getState().server.disableCentralSecurityReports
    );

    let openSecretRequests = 0;
    let closedSecretRequests = 0;
    let openHaveibeenpwnedRequests = 0;
    let closedHaveibeenpwnedRequests = 0;

    let isSubscribed = true;

    React.useEffect(() => {
        iniatiateState();

        securityReportService.on("generation-started", function () {
            if (!isSubscribed) {
                return;
            }
            setProcessing(true);
        });

        securityReportService.on("get-secret-started", function () {
            if (!isSubscribed) {
                return;
            }
            openSecretRequests = openSecretRequests + 1;
            setPercentageComplete(openSecretRequests
                ? Math.round((closedSecretRequests / openSecretRequests) * 1000) / 10
                : 0)
        });

        securityReportService.on("get-secret-complete", function () {
            if (!isSubscribed) {
                return;
            }
            closedSecretRequests = closedSecretRequests + 1;
            setPercentageComplete(openSecretRequests
                ? Math.round((closedSecretRequests / openSecretRequests) * 1000) / 10
                : 0)
        });

        securityReportService.on("generation-complete", function () {
            if (!isSubscribed) {
                return;
            }
            openSecretRequests = 0;
            closedSecretRequests = 0;
            setProcessing(false);
            setPercentageComplete(openSecretRequests
                ? Math.round((closedSecretRequests / openSecretRequests) * 1000) / 10
                : 0)
        });

        securityReportService.on("check-haveibeenpwned-started", function () {
            if (!isSubscribed) {
                return;
            }
            setHaveibeenpwnedProcessing(true);
        });

        securityReportService.on("get-haveibeenpwned-started", function () {
            if (!isSubscribed) {
                return;
            }
            openHaveibeenpwnedRequests = openHaveibeenpwnedRequests + 1
            setHaveibeenpwnedPercentageComplete(openHaveibeenpwnedRequests
                ? Math.round((closedHaveibeenpwnedRequests / openHaveibeenpwnedRequests) * 1000) / 10
                : 0)
        });

        securityReportService.on("get-haveibeenpwned-complete", function () {
            if (!isSubscribed) {
                return;
            }
            closedHaveibeenpwnedRequests = closedHaveibeenpwnedRequests + 1
            setHaveibeenpwnedPercentageComplete(openHaveibeenpwnedRequests
                ? Math.round((closedHaveibeenpwnedRequests / openHaveibeenpwnedRequests) * 1000) / 10
                : 0)
        });

        securityReportService.on("check-haveibeenpwned-complete", function () {
            if (!isSubscribed) {
                return;
            }
            openHaveibeenpwnedRequests = 0
            closedHaveibeenpwnedRequests = 0
            setHaveibeenpwnedProcessing(false);
            setHaveibeenpwnedPercentageComplete(openHaveibeenpwnedRequests
                ? Math.round((closedHaveibeenpwnedRequests / openHaveibeenpwnedRequests) * 1000) / 10
                : 0)
        });

        return () => (isSubscribed = false);
    }, []);

    function iniatiateState() {
        if (!isSubscribed) {
            return;
        }
        setReportComplete(false);
        setProcessing(false);
        setHaveibeenpwnedProcessing(false);
        openHaveibeenpwnedRequests = 0
        closedHaveibeenpwnedRequests = 0
        openSecretRequests = 0;
        closedSecretRequests = 0;
        setErrors([]);
        setMsgs([]);
    }

    const generateSecurityReport = () => {
        const masterPassword = password;

        setErrors([]);
        setMsgs([]);
        setPassword("");
        setPasswordRepeat("");

        const onSuccess = function (data) {
            setErrors([]);
            setMsgs(data.msgs);
            setAnalysis(data.analysis);
            setPasswordStrengthData({
                labels: [t("WEAK"), t("GOOD"), t("STRONG")],
                datasets: [
                    {
                        label: t("PASSWORD_STRENGTH"),
                        data: [
                            data.analysis["password_summary"]["weak"],
                            data.analysis["password_summary"]["good"],
                            data.analysis["password_summary"]["strong"],
                        ],
                        backgroundColor: ["#ff7a55", "#ffb855", "#00aaaa"],
                    },
                ],
            });
            setPasswordDuplicateData({
                labels: [t("DUPLICATES"), t("UNIQUE")],
                datasets: [
                    {
                        label: t("DUPLICATES"),
                        data: [
                            data.analysis["password_summary"]["duplicate"],
                            data.analysis["password_summary"]["no_duplicate"],
                        ],
                        backgroundColor: ["#ff7a55", "#00aaaa"],
                    },
                ],
            });
            setPasswordAverageScoreData({
                labels: [t("AVERAGE_SCORE"), ""],
                datasets: [
                    {
                        label: t("PASSWORD_STRENGTH"),
                        data: [
                            data.analysis["password_summary"]["average_rating"],
                            100 - data.analysis["password_summary"]["average_rating"],
                        ],
                        backgroundColor: ["#00aaaa", "#FFFFFF"],
                    },
                ],
            });
            setPasswordAgeData({
                labels: [t("OLDER_THAN_180_DAYS"), t("OLDER_THAN_90_DAYS"), t("NEWER_THAN_90_DAYS")],
                datasets: [
                    {
                        label: t("PASSWORD_AGE"),
                        data: [
                            data.analysis["password_summary"]["update_older_than_180_days"],
                            data.analysis["password_summary"]["update_older_than_90_days"],
                            data.analysis["password_summary"]["update_newer_than_90_days"],
                        ],
                        backgroundColor: ["#ff7a55", "#ffb855", "#00aaaa"],
                    },
                ],
            });
            setReportComplete(true);

            const onSuccess = function (data) {
                // server accepted security report
            };

            const onError = function (data) {
                setMsgs([]);
                console.log(data);
                if (data.hasOwnProperty("non_field_errors")) {
                    if (data.non_field_errors[0] === "PASSWORD_INCORRECT") {
                        setErrors(["PASSWORD_INCORRECT_SERVER_DECLINED_SECURITY_REPORT"]);
                    } else {
                        setErrors(data.non_field_errors);
                    }
                } else {
                    console.log(data);
                    alert("Error, should not happen.");
                }
            };

            if (sendToServer) {
                return securityReportService
                    .sendToServer(data.analysis, checkHaveibeenpwned, masterPassword)
                    .then(onSuccess, onError);
            }
        };

        const onError = function (data) {
            setMsgs([]);
            console.log(data);

            if (data.hasOwnProperty('errors')) {
                if (data.errors[0] === 'RESOURCE_NOT_FOUND') {
                    setErrors(['FEATURE_NOT_SUPPORTED_SERVER_REQUIRES_UPGRADE'])
                } else {
                    setErrors(data.errors);
                }
            }
        };

        iniatiateState();

        securityReportService.generateSecurityReport(masterPassword, checkHaveibeenpwned).then(onSuccess, onError);
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("NAME") },
        {
            name: t("PASSWORD"),
            options: {
                filter: false,
                sort: false,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <TextFieldPassword
                            key={tableMeta.rowData[0]}
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            label={t("PASSWORD")}
                            name="websitePasswordPassword"
                            autoComplete="off"
                            value={tableMeta.rowData[2]}
                        />
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
                            {tableMeta.rowData[4]} {t("DAYS")}
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
                    return tableMeta.rowData[7] ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />;
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
                    return tableMeta.rowData[8] ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />;
                },
            },
        },
        { name: t("ADVICE"), options: { filter: false } },
        {
            name: t("EDIT"),
            options: {
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                browserClient.openTab("index.html#!/datastore/edit/" + tableMeta.rowData[10].type + "/" + tableMeta.rowData[10].secret_id);
                            }}
                            disabled={!tableMeta.rowData[10].secret_id}
                        >
                            <EditIcon />
                        </IconButton>
                    );
                },
            },
        },
    ];

    const options = {
        filterType: "checkbox",
    };

    const data = analysis.passwords.map((pw, index) => {
        return [
            index,
            pw.name,
            pw.password,
            pw.rating,
            pw.write_age,
            pw.password_length,
            pw.variation_count,
            pw.breached > 0,
            pw.duplicate,
            t(pw.advice, pw),
            pw
        ];
    });

    return (
        <Base {...props}>
            <BaseTitle>{t("SECURITY_REPORT")}</BaseTitle>
            <BaseContent>
                <Paper square>
                    <AppBar elevation={0} position="static" color="default">
                        <Toolbar
                            className={classes.toolbarRoot}>{t("GENERATE_SECURITY_REPORT")}</Toolbar>
                    </AppBar>
                    {reportComplete && (
                        <div className={classes.root}>
                            <Grid container justifyContent="center">
                                {!analysis.user_summary.multifactor_auth_enabled && (
                                    <Grid item xs={12} sm={12} md={12} className={classes.muiInfo}>
                                        <MuiAlert severity="warning">
                                            {t("CONSIDER_ENABLING_MULTIFACTOR_AUTHENTICATION")}
                                        </MuiAlert>
                                    </Grid>
                                )}
                                {showRecoveryCodeAdvise && !analysis.user_summary.recovery_code_enabled && (
                                    <Grid item xs={12} sm={12} md={12} className={classes.muiInfo}>
                                        <MuiAlert severity="warning">{t("CONSIDER_ENABLING_RECOVERY_CODES")}</MuiAlert>
                                    </Grid>
                                )}
                                <GridContainerErrors errors={errors} setErrors={setErrors} />
                                <GridContainerErrors
                                    errors={msgs}
                                    setErrors={setMsgs}
                                    severity="info"
                                />
                                <Grid item xs={6} sm={3} md={3} lg={2} className={classes.doughnutContainer}>
                                    <Typography variant="body2" noWrap className={classes.doughnutHeader}>
                                        {t("PASSWORD_STRENGTH")}
                                    </Typography>
                                    <Doughnut data={passwordStrengthData} />
                                    {Boolean(analysis.password_summary.weak) && (
                                        <Typography variant="body2" className={classes.doughnutSubText}>
                                            {analysis.password_summary.weak} {t("WEAK_PASSWORDS")}
                                        </Typography>
                                    )}
                                    {!Boolean(analysis.password_summary.weak) && (
                                        <Typography variant="body2" className={classes.doughnutSubText}>
                                            {t("NO_WEAK_PASSWORDS")}
                                        </Typography>
                                    )}
                                </Grid>
                                <Grid item xs={6} sm={3} md={3} lg={2} className={classes.doughnutContainer}>
                                    <Typography variant="body2" noWrap className={classes.doughnutHeader}>
                                        {t("DUPLICATES")}
                                    </Typography>
                                    <Doughnut data={passwordDuplicateData} />
                                    {Boolean(analysis.password_summary.duplicate) && (
                                        <Typography variant="body2" className={classes.doughnutSubText}>
                                            {analysis.password_summary.duplicate} {t("DUPLICATES")}
                                        </Typography>
                                    )}
                                    {!Boolean(analysis.password_summary.duplicate) && (
                                        <Typography variant="body2" className={classes.doughnutSubText}>
                                            {t("NO_DUPLICATES")}
                                        </Typography>
                                    )}
                                </Grid>
                                <Grid item xs={6} sm={3} md={3} lg={2} className={classes.doughnutContainer}>
                                    <Typography variant="body2" noWrap className={classes.doughnutHeader}>
                                        {t("AVERAGE_SCORE")}
                                    </Typography>
                                    <Doughnut data={passwordAverageScoreData} />
                                    <Typography variant="body2" className={classes.doughnutSubText}>
                                        {analysis.password_summary.average_rating}% {t("SCORE")}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} sm={3} md={3} lg={2} className={classes.doughnutContainer}>
                                    <Typography variant="body2" noWrap className={classes.doughnutHeader}>
                                        {t("PASSWORD_AGE")}
                                    </Typography>
                                    <Doughnut data={passwordAgeData} />
                                    <Typography variant="body2" className={classes.doughnutSubText}>
                                        {analysis.password_summary.average_update_age} {t("DAYS")}
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
                                    <AlertSecurityReport className={classes.securityReportAlert} />
                                    <MuiAlert severity="info">{t("SECURITY_REPORT_GOAL")}</MuiAlert>
                                </Grid>
                                {requireMasterPassword && (
                                    <Grid item xs={12} sm={12} md={12}>
                                        <TextField
                                            className={classes.textField}
                                            variant="outlined"
                                            margin="dense" size="small"
                                            id="password"
                                            label={t("YOUR_PASSWORD")}
                                            name="password"
                                            autoComplete="off"
                                            value={password}
                                            onChange={(event) => {
                                                setPassword(event.target.value);
                                            }}
                                            InputProps={{
                                                type: "password",
                                            }}
                                        />
                                    </Grid>
                                )}
                                {requireMasterPassword && password && (
                                    <Grid item xs={12} sm={12} md={12}>
                                        <TextField
                                            className={classes.textField}
                                            variant="outlined"
                                            margin="dense" size="small"
                                            id="passwordRepeat"
                                            label={t("PASSWORD_REPEAT")}
                                            name="passwordRepeat"
                                            autoComplete="off"
                                            value={passwordRepeat}
                                            onChange={(event) => {
                                                setPasswordRepeat(event.target.value);
                                            }}
                                            error={Boolean(passwordRepeat) && password !== passwordRepeat}
                                            InputProps={{
                                                type: "password",
                                            }}
                                        />
                                    </Grid>
                                )}
                                <Grid item xs={12} sm={12} md={12}>
                                    <Checkbox
                                        checked={checkHaveibeenpwned}
                                        onChange={(event) => {
                                            setCheckHaveibeenpwned(event.target.checked);
                                        }}
                                        checkedIcon={<Check className={classes.checkedIcon} />}
                                        icon={<Check className={classes.uncheckedIcon} />}
                                        classes={{
                                            checked: classes.checked,
                                        }}
                                    />{" "}
                                    {t("CHECK_AGAINST")}{" "}
                                    <a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="noopener">
                                        haveibeenpwned.com
                                    </a>{" "}
                                    (
                                    <a
                                        href="https://haveibeenpwned.com/API/v2#SearchingPwnedPasswordsByRange"
                                        target="_blank"
                                        rel="noopener"
                                    >
                                        /range API
                                    </a>
                                    )?
                                </Grid>
                                {!hideSendToServer && (
                                    <Grid item xs={12} sm={12} md={12}>
                                        <Checkbox
                                            checked={sendToServer}
                                            disabled={disableSendToSeverChoice}
                                            onChange={(event) => {
                                                setSendToServer(event.target.checked);
                                            }}
                                            checkedIcon={<Check className={classes.checkedIcon} />}
                                            icon={<Check className={classes.uncheckedIcon} />}
                                            classes={{
                                                checked: classes.checked,
                                            }}
                                        />{" "}
                                        {t("SEND_SECURITY_REPORT_TO_SERVER")}
                                    </Grid>
                                )}
                                <Grid item xs={12} sm={12} md={12}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => {
                                            generateSecurityReport();
                                        }}
                                        disabled={requireMasterPassword && (!password || password !== passwordRepeat)}
                                    >
                                        {t("START_ANALYSIS")}
                                    </Button>
                                </Grid>

                                <GridContainerErrors errors={errors} setErrors={setErrors} className={classes.muiWarning} />
                                <GridContainerErrors
                                    errors={msgs}
                                    setErrors={setMsgs}
                                    severity="info"
                                    className={classes.muiWarning}
                                />

                                {processing && (
                                    <Grid item xs={12} sm={12} md={12}>
                                        <Typography variant="body2" className={classes.downloadingPasswords}>
                                            {t("DOWNLOADING_PASSWORDS")}:
                                        </Typography>
                                        <Box display="flex" alignItems="center">
                                            <Box width="100%" mr={1}>
                                                <LinearProgress variant="determinate" value={percentageComplete} />
                                            </Box>
                                            <Box minWidth={35}>
                                                <span
                                                    style={{
                                                        color: "white",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {percentageComplete} %
                                                </span>
                                            </Box>
                                        </Box>
                                    </Grid>
                                )}
                                {haveibeenpwnedProcessing && (
                                    <Grid item xs={12} sm={12} md={12}>
                                        <Typography variant="body2" className={classes.downloadingPasswords}>
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

                                <Grid item xs={12} sm={12} md={12} className={classes.muiWarning}>
                                    <MuiAlert severity="warning">{t("ANALYSIS_CAN_TAKE_SEVERAL_MINUTES")}</MuiAlert>
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
