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

    let openRequests = 0;
    let closedRequest = 0;

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

        exportService.exportDatastore(exportFormat, includeTrashBinItems, calculatedIncludeSharedItems, (exportFormat === 'json' || exportFormat === 'kdbxv4') ? password : '').then(onSuccess, onError);
    };

    const formHasError = (exportFormat === 'json' || exportFormat === 'kdbxv4') && Boolean(password) && password !== passwordRepeat;

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
