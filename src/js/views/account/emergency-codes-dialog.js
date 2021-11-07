import React, { useState } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { bindActionCreators } from "redux";
import { compose } from "redux";
import { withTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Box from "@material-ui/core/Box";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import CheckIcon from "@material-ui/icons/Check";
import { Grid } from "@material-ui/core";
import TextField from "@material-ui/core/TextField";

import actionCreators from "../../actions/action-creators";
import Table from "../../components/table";
import emergencyCode from "../../services/emmergency-code";
import store from "../../services/store";
import MuiAlert from "@material-ui/lab/Alert";
import Divider from "@material-ui/core/Divider";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
}));

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
            {value === index && <Box p={3}>{children}</Box>}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};

const EmergencyCodesDialog = (props) => {
    const { t, open, onClose } = props;
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
                        return [code.id, code.description, code.activation_delay, code.activation_date === null ? t("NO") : code.activation_date];
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
        emergencyCode.createEmergencyCode(person, leadTime).then(
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

        var onSuccess = function (successful) {
            loadEmergencyCodes();
        };

        var onError = function (error) {
            console.log(error);
        };

        return emergencyCode.deleteEmergencyCode(rowData[0]).then(onSuccess, onError);
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
                    <Tabs value={value} onChange={handleChange} aria-label="simple tabs example">
                        <Tab label={t("EXISTING_EMERGENCY_CODES")} id="simple-tab-0" aria-controls="simple-tabpanel-0" />
                        <Tab label={t("NEW_EMERGENCY_CODES")} id="simple-tab-1" aria-controls="simple-tabpanel-1" />
                    </Tabs>
                    <TabPanel value={value} index={0}>
                        <Table data={emergencyCodes} columns={columns} options={options} />;
                    </TabPanel>
                    <TabPanel value={value} index={1}>
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
                                            min: 0,
                                            step: 12,
                                        },
                                    }}
                                    type="number"
                                    onChange={(event) => {
                                        setLeadTime(event.target.value);
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={12} md={12}>
                                <Button variant="contained" color="primary" onClick={generate} disabled={!person}>
                                    {t("CREATE")}
                                </Button>
                            </Grid>
                        </Grid>
                    </TabPanel>
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
                        <Grid item xs={12} sm={12} md={12} className="text-center monospace">
                            <p>{newEmergencyCode.url}</p>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <strong>{t("USERNAME")}</strong>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12} className="text-center monospace">
                            <p>{newEmergencyCode.username}</p>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <strong>{t("CODE")}</strong>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12} className="text-center monospace">
                            <p>{newEmergencyCode.emergency_password}</p>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <strong>{t("OR")}</strong>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12} className="text-center monospace">
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
                    color="primary"
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

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default compose(withTranslation(), connect(mapStateToProps, mapDispatchToProps))(EmergencyCodesDialog);
