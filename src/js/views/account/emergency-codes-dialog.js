import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import InputAdornment from '@material-ui/core/InputAdornment';
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import { Grid } from "@material-ui/core";
import TextField from "@material-ui/core/TextField";

import Table from "../../components/table";
import emergencyCode from "../../services/emmergency-code";
import store from "../../services/store";
import MuiAlert from "@material-ui/lab/Alert";
import Divider from "@material-ui/core/Divider";
import ContentCopy from "../../components/icons/ContentCopy";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
    code: {
        fontFamily: "'Fira Code', monospace",
        textAlign: "center",
    },
}));

const LEAD_TIME_MIN = 0;
const LEAD_TIME_MAX = Math.floor(2147483647/3600);

const EmergencyCodesDialog = (props) => {
    const { open, onClose } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [value, setValue] = React.useState(0);
    const [person, setPerson] = React.useState("");
    const [leadTime, setLeadTime] = React.useState(24);
    const [newEmergencyCode, setNewEmergencyCode] = React.useState({});
    const [view, setView] = React.useState("default");
    const [emergencyCodes, setEmergencyCodes] = React.useState([]);
    const [errors, setErrors] = useState([]);

    React.useEffect(() => {
        loadEmergencyCodes();
    }, []);

    const loadEmergencyCodes = () => {
        emergencyCode.readEmergencyCodes().then(
            function (codes) {
                setEmergencyCodes(
                    codes.map((code, index) => {
                        return [
                            code.id,
                            code.description,
                            code.activation_delay / 3600,
                            code.activation_date === null ? t("NO") : code.activation_date,
                        ];
                    })
                );
            },
            function (error) {
                console.log(error);
            }
        );
    };

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };
    const generate = () => {
        emergencyCode.createEmergencyCode(person, leadTime * 3600).then(
            function (createdEmergencyCode) {
                createdEmergencyCode["url"] = store.getState().server.webClient + "/emergency-code.html";
                setNewEmergencyCode(createdEmergencyCode);
                setView("step2");
                setPerson("");
                setLeadTime(24);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    const onDelete = (rowData) => {
        setErrors([]);

        const onSuccess = function (successful) {
            loadEmergencyCodes();
        };

        const onError = function (error) {
            console.log(error);
        };

        return emergencyCode.deleteEmergencyCode(rowData[0]).then(onSuccess, onError);
    };
    const onCreate = () => {
        setView("create_step0");
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("PERSON") },
        { name: t("LEAD_TIME_IN_HOURS") },
        { name: t("ACTIVATED") },
        {
            name: t("DELETE"),
            options: {
                filter: true,
                sort: false,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                onDelete(tableMeta.rowData);
                            }}
                        >
                            <DeleteIcon />
                        </IconButton>
                    );
                },
            },
        },
    ];

    const options = {
        filterType: "checkbox",
    };

    return (
        <Dialog
            fullWidth
            maxWidth={"sm"}
            open={open}
            onClose={() => {
                setView("default");
                onClose();
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{t("EMERGENCY_CODES")}</DialogTitle>
            {view === "default" && (
                <DialogContent>
                    <Table data={emergencyCodes} columns={columns} options={options} onCreate={onCreate} />
                </DialogContent>
            )}
            {view === "create_step0" && (
                <DialogContent>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="person"
                                label={t("PERSON")}
                                name="person"
                                autoComplete="person"
                                required
                                value={person}
                                onChange={(event) => {
                                    setPerson(event.target.value);
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="leadTime"
                                label={t("LEAD_TIME_IN_HOURS")}
                                helperText={t("LEAD_TIME_IN_HOURS_PLACEHOLDER")}
                                name="leadTime"
                                autoComplete="leadTime"
                                required
                                value={leadTime}
                                InputProps={{
                                    inputProps: {
                                        min: LEAD_TIME_MIN,
                                        max: LEAD_TIME_MAX,
                                        step: 12,
                                    },
                                    endAdornment: (
                                        <InputAdornment position="end">{t('hours')}</InputAdornment>
                                    ),
                                }}
                                type="number"
                                onChange={(event) => {
                                    let value = event.target.value;
                                    if (value > LEAD_TIME_MAX) value = LEAD_TIME_MAX;
                                    if (value < LEAD_TIME_MIN) value = LEAD_TIME_MIN;
                                    setLeadTime(value);
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <Button variant="contained" color="primary" onClick={generate} disabled={!person}>
                                {t("CREATE")}
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>
            )}
            {view === "step2" && (
                <DialogContent>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <p>{t("SEND_THIS_EMERGENCY_INFORMATION_INFO")}</p>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <Divider />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <p>{t("INFO_FOR_EMERGENCY_CODE")}</p>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <strong>{t("URL")}</strong>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12} className={classes.code}>
                            <p>{newEmergencyCode.url}</p>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <strong>{t("USERNAME")}</strong>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12} className={classes.code}>
                            <p>{newEmergencyCode.username}</p>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <strong>{t("CODE")}</strong>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12} className={classes.code}>
                            <p>{newEmergencyCode.emergency_password}</p>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <strong>{t("OR")}</strong>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12} className={classes.code}>
                            <p>{newEmergencyCode.emergency_words}</p>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <MuiAlert
                                severity="warning"
                                style={{
                                    marginBottom: "5px",
                                    marginTop: "5px",
                                }}
                            >
                                {t("WARNING_OF_EMERGENCY_CODE")}
                            </MuiAlert>
                        </Grid>
                    </Grid>
                </DialogContent>
            )}
            <DialogActions>
                <Button
                    onClick={() => {
                        setView("default");
                        onClose();
                    }}
                    autoFocus
                >
                    {t("CLOSE")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

EmergencyCodesDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default EmergencyCodesDialog;
