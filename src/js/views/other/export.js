import React from "react";
import { useTranslation } from "react-i18next";
import Divider from "@material-ui/core/Divider";
import { Grid } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";
import MenuItem from "@material-ui/core/MenuItem";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import Box from "@material-ui/core/Box";
import LinearProgress from "@material-ui/core/LinearProgress";
import Select from "@material-ui/core/Select";
import MuiAlert from "@material-ui/lab/Alert";
import { BarLoader } from "react-spinners";

import exportService from "../../services/export";
import GridContainerErrors from "../../components/grid-container-errors";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
        [theme.breakpoints.up("md")]: {
            width: "440px",
        },
    },
}));

const OtherExportView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const [exportFormat, setExportFormat] = React.useState("json");
    const [percentageComplete, setPercentageComplete] = React.useState(0);
    const [processing, setProcessing] = React.useState(false);
    const [errors, setErrors] = React.useState([]);
    const [messages, setMessages] = React.useState([]);

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
            setMessages([]);
            setErrors(data.errors);
        };

        exportService.exportDatastore(exportFormat).then(onSuccess, onError);
    };

    return (
        <Grid container>
            <Grid item xs={12} sm={12} md={12}>
                <h2>{t("EXPORT")}</h2>
                <p>{t("EXPORT_DESCRIPTION")}</p>
                <Divider style={{ marginBottom: "20px" }} />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <FormControl variant="outlined" margin="dense" className={classes.textField} required>
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
                        <MenuItem value={"csv"}>{t("CSV")}</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={12} style={{ marginBottom: "8px", marginTop: "8px" }}>
                <Button variant="contained" color="primary" onClick={exportPasswords} disabled={processing}>
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
                    {errors.map((prop, index) => {
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
