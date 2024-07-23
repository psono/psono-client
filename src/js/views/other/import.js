import React from "react";
import { useTranslation } from "react-i18next";
import Divider from "@mui/material/Divider";
import { Grid } from "@mui/material";
import Button from "@mui/material/Button";
import { makeStyles } from '@mui/styles';
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Select from "@mui/material/Select";
import MuiAlert from '@mui/material/Alert'
import { BarLoader } from "react-spinners";

import importService from "../../services/import";
import GridContainerErrors from "../../components/grid-container-errors";
import TextFieldPassword from "../../components/text-field/password";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
        [theme.breakpoints.up("md")]: {
            width: "440px",
        },
    },
}));

const OtherImportView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const [exportFormat, setExportFormat] = React.useState("psono_pw_json");
    const [encoding, setEncoding] = React.useState("utf-8");
    const [fileContent, setFileContent] = React.useState("");
    const [fileName, setFileName] = React.useState("");
    const [percentageComplete, setPercentageComplete] = React.useState(0);
    const [processing, setProcessing] = React.useState(false);
    const [errors, setErrors] = React.useState([]);
    const [messages, setMessages] = React.useState([]);
    const [password, setPassword] = React.useState("");

    let openRequests = 0;
    let closedRequest = 0;

    React.useEffect(() => {
        importService.on("import-started", function () {
            setProcessing(true);
        });

        importService.on("create-secret-started", function () {
            openRequests = openRequests + 1;
            setPercentageComplete(Math.round((closedRequest / openRequests) * 1000) / 10);
        });

        importService.on("create-secret-complete", function () {
            closedRequest = closedRequest + 1;
            setPercentageComplete(Math.round((closedRequest / openRequests) * 1000) / 10);
        });

        importService.on("import-complete", function () {
            openRequests = 0;
            closedRequest = 0;
            setProcessing(false);
        });
    }, []);

    const importPasswords = (event) => {
        setMessages([]);
        setErrors([]);

        const onSuccess = function (data) {
            setMessages(data.msgs);
            setErrors([]);
        };
        const onError = function (data) {
            console.log(data);
            setMessages([]);
            if (data.hasOwnProperty('errors')) {
                if (data.errors[0] === 'RESSOURCE_NOT_FOUND') {
                    setErrors(['FEATURE_NOT_SUPPORTED_SERVER_REQUIRES_UPGRADE'])
                } else {
                    setErrors(data.errors);
                }
            }
            openRequests = 0;
            closedRequest = 0;
            setProcessing(false);
        };

        importService.importDatastore(exportFormat, fileContent, password).then(onSuccess, onError);
    };

    const onFileChange = (event) => {
        event.preventDefault();

        setFileName(event.target.files[0].name);
        const reader = new FileReader();
        reader.onload = function (e) {
            setFileContent(e.target.result);
        };
        reader.readAsText(event.target.files[0], encoding);
    };

    const getHelpText = importService.getImporterHelp(exportFormat);

    return (
        <Grid container>
            <Grid item xs={12} sm={12} md={12}>
                <h2>{t("IMPORT")}</h2>
                <p>{t("IMPORT_DESCRIPTION")}</p>
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
                        {importService.getImporter().map((importer, index) => {
                            return (
                                <MenuItem key={index} value={importer["value"]}>
                                    {importer["name"]}
                                </MenuItem>
                            );
                        })}
                    </Select>
                </FormControl>
            </Grid>
            {exportFormat === 'psono_pw_json' && (<Grid item xs={12} sm={12} md={12}>
                <TextFieldPassword
                    className={classes.textField}
                    variant="outlined"
                    margin="dense" size="small"
                    id="password"
                    label={t("PASSWORD")}
                    helperText={t("ENTER_PASSWORD_IF_YOUR_EXPORT_IS_ENCRYPTED")}
                    name="password"
                    autoComplete="off"
                    value={password}
                    onChange={(event) => {
                        setPassword(event.target.value);
                    }}
                />
            </Grid>)}
            <Grid item xs={12} sm={12} md={12}>
                <FormControl variant="outlined" margin="dense" size="small" className={classes.textField} required>
                    <InputLabel id="export-encoding-select-label-label">{t("ENCODING")}</InputLabel>
                    <Select
                        labelId="export-encoding-select-label-label"
                        id="export-encoding-select-label"
                        value={encoding}
                        onChange={(event) => {
                            setEncoding(event.target.value);
                        }}
                        label={t("ENCODING")}
                    >
                        {[
                            "utf-8",
                            "utf-16",
                            "iso-8859-2",
                            "iso-8859-3",
                            "iso-8859-4",
                            "iso-8859-5",
                            "iso-8859-6",
                            "iso-8859-7",
                            "iso-8859-8",
                            "iso-8859-8-i",
                            "iso-8859-10",
                            "iso-8859-13",
                            "iso-8859-14",
                            "iso-8859-15",
                            "iso-8859-16",
                            "windows-874",
                            "windows-1250",
                            "windows-1251",
                            "windows-1252",
                            "windows-1254",
                            "windows-1255",
                            "windows-1256",
                            "windows-1257",
                            "windows-1258",
                        ].map((encoding, index) => (
                            <MenuItem key={index} value={encoding}>
                                {encoding}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={12} style={{ marginBottom: "8px", marginTop: "8px" }}>
                <Button variant="contained" disabled={processing} component="label">
                    {fileName ? fileName : t("FILE")}
                    <input type="file" hidden onChange={onFileChange} />
                </Button>
            </Grid>
            <Grid item xs={12} sm={12} md={12} style={{ marginBottom: "8px", marginTop: "8px" }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={importPasswords}
                    disabled={processing || !fileName}
                >
                    <span style={!processing ? {} : { display: "none" }}>{t("IMPORT")}</span>
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
            {getHelpText && (
                <MuiAlert
                    severity="info"
                    style={{
                        marginBottom: "5px",
                        marginTop: "5px",
                    }}
                >
                    {getHelpText()}
                </MuiAlert>
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

export default OtherImportView;
