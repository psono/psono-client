import React from "react";
import { useTranslation } from "react-i18next";
import Divider from "@mui/material/Divider";
import { Grid, Checkbox } from "@mui/material";
import Button from "@mui/material/Button";
import { makeStyles } from '@mui/styles';
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Select from "@mui/material/Select";
import MuiAlert from '@mui/material/Alert'
import { Check } from "@mui/icons-material";
import { BarLoader } from "react-spinners";

import { getStore } from "../../services/store";
import exportService from "../../services/export";
import GridContainerErrors from "../../components/grid-container-errors";
import TextFieldPassword from "../../components/text-field/password";

const useStyles = makeStyles((theme) => ({
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
}));

const OtherExportView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const [exportFormat, setExportFormat] = React.useState("json");
    const [percentageComplete, setPercentageComplete] = React.useState(0);
    const [processing, setProcessing] = React.useState(false);
    const [includeTrashBinItems, setIncludeTrashBinItems] = React.useState(false);
    const [includeSharedItems, setIncludeSharedItems] = React.useState(true);
    const [errors, setErrors] = React.useState([]);
    const [messages, setMessages] = React.useState([]);
    const [password, setPassword] = React.useState("");
    const [passwordRepeat, setPasswordRepeat] = React.useState("");
    const [selectedColumns, setSelectedColumns] = React.useState({});
    const [showColumnSelection, setShowColumnSelection] = React.useState(false);

    const csvColumns = [
        { key: "path", label: t("PATH") },
        { key: "type", label: t("TYPE") },
        { key: "callback_user", label: t("CALLBACK_USER") },
        { key: "callback_url", label: t("CALLBACK_URL") },
        { key: "callback_pass", label: t("CALLBACK_PASS") },
        { key: "urlfilter", label: t("DOMAIN_FILTER") },
        { key: "website_password_title", label: t("TITLE") },
        { key: "website_password_url", label: t("URL") },
        { key: "website_password_username", label: t("USERNAME") },
        { key: "website_password_password", label: t("PASSWORD") },
        { key: "website_password_notes", label: t("NOTES") },
        { key: "website_password_auto_submit", label: t("AUTO_SUBMIT") },
        { key: "website_password_url_filter", label: t("DOMAIN_FILTER") },
        { key: "website_password_totp_period", label: t("TOTP") + " " + t("PERIOD") },
        { key: "website_password_totp_algorithm", label: t("TOTP") + " " + t("ALGORITHM") },
        { key: "website_password_totp_digits", label: t("TOTP") + " " + t("DIGITS") },
        { key: "website_password_totp_code", label: t("TOTP_CODE") },
        { key: "application_password_title", label: t("TITLE") },
        { key: "application_password_username", label: t("USERNAME") },
        { key: "application_password_password", label: t("PASSWORD") },
        { key: "application_password_notes", label: t("NOTES") },
        { key: "passkey_title", label: t("TITLE") },
        { key: "passkey_rp_id", label: t("RP_ID") },
        { key: "passkey_id", label: t("ID") },
        { key: "passkey_public_key", label: t("PUBLIC_KEY") },
        { key: "passkey_private_key", label: t("PRIVATE_KEY") },
        { key: "passkey_user_handle", label: t("USER_HANDLE") },
        { key: "passkey_algorithm", label: t("ALGORITHM") },
        { key: "passkey_auto_submit", label: t("AUTO_SUBMIT") },
        { key: "passkey_url_filter", label: t("DOMAIN_FILTER") },
        { key: "totp_title", label: t("TOTP_TITLE") },
        { key: "totp_period", label: t("PERIOD") },
        { key: "totp_algorithm", label: t("ALGORITHM") },
        { key: "totp_digits", label: t("DIGITS") },
        { key: "totp_code", label: t("TOTP_CODE") },
        { key: "note_title", label: t("TITLE") },
        { key: "note_notes", label: t("NOTES") },
        { key: "environment_variables_title", label: t("TITLE") },
        { key: "environment_variables_variables", label: t("ENVIRONMENT_VARIABLES") },
        { key: "environment_variables_notes", label: t("NOTES") },
        { key: "ssh_own_key_title", label: t("TITLE") },
        { key: "ssh_own_key_email", label: t("EMAIL") },
        { key: "ssh_own_key_name", label: t("NAME") },
        { key: "ssh_own_key_public", label: t("PUBLIC_KEY") },
        { key: "ssh_own_key_private", label: t("PRIVATE_KEY") },
        { key: "ssh_own_key_notes", label: t("NOTES") },
        { key: "mail_gpg_own_key_title", label: t("TITLE") },
        { key: "mail_gpg_own_key_email", label: t("EMAIL") },
        { key: "mail_gpg_own_key_name", label: t("NAME") },
        { key: "mail_gpg_own_key_public", label: t("PUBLIC_KEY") },
        { key: "mail_gpg_own_key_private", label: t("PRIVATE_KEY") },
        { key: "credit_card_title", label: t("TITLE") },
        { key: "credit_card_number", label: t("CREDIT_CARD_NUMBER") },
        { key: "credit_card_name", label: t("NAME") },
        { key: "credit_card_cvc", label: t("CVC") },
        { key: "credit_card_pin", label: t("PIN") },
        { key: "credit_card_valid_through", label: t("VALID_THROUGH") },
        { key: "credit_card_notes", label: t("NOTES") },
        { key: "bookmark_title", label: t("TITLE") },
        { key: "bookmark_url", label: t("URL") },
        { key: "bookmark_notes", label: t("NOTES") },
        { key: "bookmark_url_filter", label: t("DOMAIN_FILTER") },
        { key: "identity_title", label: t("TITLE") },
        { key: "identity_first_name", label: t("FIRST_NAME") },
        { key: "identity_last_name", label: t("LAST_NAME") },
        { key: "identity_company", label: t("COMPANY") },
        { key: "identity_address", label: t("ADDRESS") },
        { key: "identity_city", label: t("CITY") },
        { key: "identity_postal_code", label: t("POSTAL_CODE") },
        { key: "identity_state", label: t("STATE") },
        { key: "identity_country", label: t("COUNTRY") },
        { key: "identity_phone_number", label: t("PHONE_NUMBER") },
        { key: "identity_email", label: t("EMAIL") },
        { key: "elster_certificate_title", label: t("TITLE") },
        { key: "elster_certificate_file_content", label: t("FILE_CONTENT") },
        { key: "elster_certificate_password", label: t("PASSWORD") },
        { key: "elster_certificate_retrieval_code", label: t("RETRIEVAL_CODE") },
        { key: "elster_certificate_notes", label: t("NOTES") },
        { key: "custom_fields", label: t("CUSTOM_FIELDS") },
        { key: "tags", label: t("TAGS") }
    ];

    let openRequests = 0;
    let closedRequest = 0;

    React.useEffect(() => {
        // Initialize all columns as selected by default
        const defaultSelection = {};
        csvColumns.forEach(column => {
            defaultSelection[column.key] = true;
        });
        setSelectedColumns(defaultSelection);
    }, []);

    React.useEffect(() => {
        exportService.on("export-started", function () {
            setProcessing(true);
        });

        exportService.on("get-secret-started", function () {
            openRequests = openRequests + 1;
            setPercentageComplete(Math.round((closedRequest / openRequests) * 1000) / 10);
        });

        exportService.on("get-secret-complete", function () {
            closedRequest = closedRequest + 1;
            setPercentageComplete(Math.round((closedRequest / openRequests) * 1000) / 10);
        });

        exportService.on("export-complete", function () {
            openRequests = 0;
            closedRequest = 0;
            setProcessing(false);
        });
    }, []);

    const exportPasswords = (event) => {
        setMessages([]);
        setErrors([]);

        const onSuccess = function (data) {
            setMessages(data.msgs);
            setErrors([]);
        };
        const onError = function (data) {
            console.log(data);

            if (data.hasOwnProperty('errors')) {
                if (data.errors[0] === 'RESOURCE_NOT_FOUND') {
                    setErrors(['FEATURE_NOT_SUPPORTED_SERVER_REQUIRES_UPGRADE'])
                } else {
                    setErrors(data.errors);
                }
            }
            setMessages([]);
        };

        const calculatedIncludeSharedItems = !getStore().getState().server.complianceDisableExportOfSharedItems && includeSharedItems;
        const csvColumnsToExport = exportFormat === 'csv' ? Object.keys(selectedColumns).filter(key => selectedColumns[key]) : undefined;

        exportService.exportDatastore(exportFormat, includeTrashBinItems, calculatedIncludeSharedItems, (exportFormat === 'json' || exportFormat === 'kdbxv4') ? password : '', csvColumnsToExport).then(onSuccess, onError);
    };

    const formHasError = (exportFormat === 'json' || exportFormat === 'kdbxv4') && Boolean(password) && password !== passwordRepeat;

    const handleColumnToggle = (columnKey) => {
        setSelectedColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    const handleSelectAll = () => {
        const allSelected = {};
        csvColumns.forEach(column => {
            allSelected[column.key] = true;
        });
        setSelectedColumns(allSelected);
    };

    const handleDeselectAll = () => {
        const allDeselected = {};
        csvColumns.forEach(column => {
            allDeselected[column.key] = false;
        });
        setSelectedColumns(allDeselected);
    };

    return (
        <Grid container>
            <Grid item xs={12} sm={12} md={12}>
                <h2>{t("EXPORT")}</h2>
                <p>{t("EXPORT_DESCRIPTION")}</p>
                <Divider style={{ marginBottom: "20px" }} />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <FormControl variant="outlined" margin="dense" size="small" className={classes.textField} required>
                    <InputLabel id="export-type-select-label-label">{t("TYPE")}</InputLabel>
                    <Select
                        labelId="export-type-select-label-label"
                        id="export-type-select-label"
                        value={exportFormat}
                        onChange={(event) => {
                            setExportFormat(event.target.value);
                        }}
                        label={t("TYPE")}
                    >
                        <MenuItem value={"json"}>{t("JSON_IMPORT_COMPATIBLE")}</MenuItem>
                        <MenuItem value={"kdbxv4"}>{t("KDBXV4")}</MenuItem>
                        <MenuItem value={"csv"}>{t("CSV")}</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            {exportFormat === 'csv' && (
                <Grid item xs={12} sm={12} md={12}>
                    <Box display="flex" alignItems="center" style={{ marginTop: '16px', marginBottom: '8px' }}>
                        <Button
                            variant="text"
                            color="primary"
                            onClick={() => setShowColumnSelection(!showColumnSelection)}
                            style={{ marginRight: '16px' }}
                        >
                            {showColumnSelection ? t('HIDE_COLUMN_SELECTION') : t('SHOW_COLUMN_SELECTION')}
                        </Button>
                        {showColumnSelection && (
                            <>
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={handleSelectAll}
                                    style={{ marginRight: '8px' }}
                                >
                                    {t('SELECT_ALL')}
                                </Button>
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={handleDeselectAll}
                                >
                                    {t('DESELECT_ALL')}
                                </Button>
                            </>
                        )}
                    </Box>
                    {showColumnSelection && (
                        <Box style={{ 
                            maxHeight: '300px', 
                            overflowY: 'auto', 
                            border: '1px solid #ccc', 
                            borderRadius: '4px', 
                            padding: '8px',
                            marginBottom: '16px'
                        }}>
                            <Grid container spacing={2}>
                                {[
                                    { category: t("GENERAL"), columns: csvColumns.filter(col => ['path', 'type', 'callback_user', 'callback_url', 'callback_pass', 'urlfilter', 'custom_fields', 'tags'].includes(col.key)) },
                                    { category: t("WEBSITE_PASSWORD"), columns: csvColumns.filter(col => col.key.startsWith('website_password_')) },
                                    { category: t("APPLICATION_PASSWORD"), columns: csvColumns.filter(col => col.key.startsWith('application_password_')) },
                                    { category: t("PASSKEY"), columns: csvColumns.filter(col => col.key.startsWith('passkey_')) },
                                    { category: t("TOTP"), columns: csvColumns.filter(col => col.key.startsWith('totp_')) },
                                    { category: t("NOTE"), columns: csvColumns.filter(col => col.key.startsWith('note_')) },
                                    { category: t("ENVIRONMENT_VARIABLES"), columns: csvColumns.filter(col => col.key.startsWith('environment_variables_')) },
                                    { category: t("SSH_KEY"), columns: csvColumns.filter(col => col.key.startsWith('ssh_own_key_')) },
                                    { category: t("GPG_KEY"), columns: csvColumns.filter(col => col.key.startsWith('mail_gpg_own_key_')) },
                                    { category: t("CREDIT_CARD"), columns: csvColumns.filter(col => col.key.startsWith('credit_card_')) },
                                    { category: t("BOOKMARK"), columns: csvColumns.filter(col => col.key.startsWith('bookmark_')) },
                                    { category: t("IDENTITY"), columns: csvColumns.filter(col => col.key.startsWith('identity_')) },
                                    { category: t("ELSTER_CERTIFICATE"), columns: csvColumns.filter(col => col.key.startsWith('elster_certificate_')) }
                                ].filter(group => group.columns.length > 0).map((group) => (
                                    <Grid item xs={12} key={group.category}>
                                        <Box style={{ marginBottom: '8px' }}>
                                            <strong style={{ fontSize: '0.875rem', color: '#666' }}>
                                                {group.category}
                                            </strong>
                                        </Box>
                                        <Grid container spacing={1}>
                                            {group.columns.sort((a, b) => a.label.localeCompare(b.label)).map((column) => (
                                                <Grid item xs={6} sm={4} md={3} key={column.key}>
                                                    <Box display="flex" alignItems="center">
                                                        <Checkbox
                                                            checked={selectedColumns[column.key] || false}
                                                            onChange={() => handleColumnToggle(column.key)}
                                                            checkedIcon={<Check className={classes.checkedIcon} />}
                                                            icon={<Check className={classes.uncheckedIcon} />}
                                                            classes={{
                                                                checked: classes.checked,
                                                            }}
                                                            size="small"
                                                        />
                                                        <span style={{ fontSize: '0.875rem', marginLeft: '4px' }}>
                                                            {column.label}
                                                        </span>
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                </Grid>
            )}
            {(exportFormat === 'json' || exportFormat === 'kdbxv4') && (<Grid item xs={12} sm={12} md={12}>
                <TextFieldPassword
                    className={classes.textField}
                    variant="outlined"
                    margin="dense" size="small"
                    id="password"
                    label={t("PASSWORD")}
                    helperText={t("ENTER_PASSWORD_TO_ENCRYPT_YOUR_EXPORT")}
                    name="password"
                    autoComplete="off"
                    value={password}
                    onChange={(event) => {
                        setPassword(event.target.value);
                    }}
                />
            </Grid>)}
            {(exportFormat === 'json' || exportFormat === 'kdbxv4') && Boolean(password) && (
                <Grid item xs={12} sm={12} md={12}>
                    <TextFieldPassword
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="passwordRepeat"
                        label={t("PASSWORD_REPEAT")}
                        name="passwordRepeat"
                        autoComplete="off"
                        error={
                            Boolean(password) &&
                            Boolean(passwordRepeat) &&
                            password !== passwordRepeat
                        }
                        value={passwordRepeat}
                        required
                        onChange={(event) => {
                            setPasswordRepeat(event.target.value);
                        }}
                    />
                </Grid>
            )}
            <Grid item xs={12} sm={12} md={12}>
                <Checkbox
                    tabIndex={1}
                    checked={includeTrashBinItems}
                    onChange={(event) => {
                        setIncludeTrashBinItems(event.target.checked);
                    }}
                    checkedIcon={<Check className={classes.checkedIcon} />}
                    icon={<Check className={classes.uncheckedIcon} />}
                    classes={{
                        checked: classes.checked,
                    }}
                />{" "}
                {t("INCLUDE_TRASH_BIN_ENTRIES")}
            </Grid>
            {!getStore().getState().server.complianceDisableExportOfSharedItems && (<Grid item xs={12} sm={12} md={12}>
                <Checkbox
                    tabIndex={1}
                    checked={includeSharedItems}
                    onChange={(event) => {
                        setIncludeSharedItems(event.target.checked);
                    }}
                    checkedIcon={<Check className={classes.checkedIcon} />}
                    icon={<Check className={classes.uncheckedIcon} />}
                    classes={{
                        checked: classes.checked,
                    }}
                />{" "}
                {t("INCLUDE_SHARED_ENTRIES")}
            </Grid>)}
            <Grid item xs={12} sm={12} md={12} style={{ marginBottom: "8px", marginTop: "8px" }}>
                <Button variant="contained" color="primary" onClick={exportPasswords} disabled={processing || formHasError}>
                    <span style={!processing ? {} : { display: "none" }}>{t("EXPORT")}</span>
                    <BarLoader color={"#FFF"} height={17} width={37} loading={processing} />
                </Button>
            </Grid>
            {processing && (
                <Grid item xs={12} sm={12} md={12} style={{ marginBottom: "8px", marginTop: "8px" }}>
                    <Box display="flex" alignItems="center">
                        <Box width="100%" mr={1}>
                            <LinearProgress variant="determinate" value={percentageComplete} />
                        </Box>
                        <Box minWidth={35}>
                            <span style={{ color: "white", whiteSpace: "nowrap" }}>{percentageComplete} %</span>
                        </Box>
                    </Box>
                </Grid>
            )}
            <GridContainerErrors errors={errors} setErrors={setErrors} />
            {messages && (
                <Grid item xs={12} sm={12} md={12}>
                    {messages.map((prop, index) => {
                        return (
                            <MuiAlert
                                key={index}
                                severity="info"
                                style={{
                                    marginBottom: "5px",
                                    marginTop: "5px",
                                }}
                            >
                                {t(prop)}
                            </MuiAlert>
                        );
                    })}
                </Grid>
            )}
        </Grid>
    );
};

export default OtherExportView;
