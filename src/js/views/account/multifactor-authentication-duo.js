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
import MuiAlert from "@material-ui/lab/Alert";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import CheckIcon from "@material-ui/icons/Check";
import { Grid } from "@material-ui/core";
import TextField from "@material-ui/core/TextField";

import actionCreators from "../../actions/action-creators";
import Table from "../../components/table";
import duo from "../../services/duo";
import store from "../../services/store";

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

const MultifactorAuthenticatorDuo = (props) => {
    const { t, open, onClose } = props;
    const classes = useStyles();
    const [value, setValue] = React.useState(0);
    const [title, setTitle] = React.useState("");
    const [integrationKey, setIntegrationKey] = React.useState("");
    const [secretKey, setSecretKey] = React.useState("");
    const [host, setHost] = React.useState("");
    const [code, setCode] = React.useState("");
    const [newDuo, setNewDuo] = React.useState({});
    const [view, setView] = React.useState("default");
    const [duos, setDuos] = React.useState([]);
    const [errors, setErrors] = useState([]);

    React.useEffect(() => {
        loadDuos();
    }, []);

    const loadDuos = () => {
        duo.readDuo().then(
            function (keys) {
                setDuos(
                    keys.map((key, index) => {
                        return [key.id, key.title, key.active];
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

    const onDuoActivationSuccessful = (successful) => {
        if (successful) {
            setValue(0);
            setCode("");
            setNewDuo({});
            setView("default");
            loadDuos();
        } else {
            setErrors(["CODE_INCORRECT"]);
        }
    };

    const gotoStep3 = () => {
        setView("step3");
        duo.activateDuo(newDuo.id, undefined).then(onDuoActivationSuccessful, () => {
            // may fail for valid reasons, e.g. timeout and won't harm the activation as the user can still
            // manually activate the DUO
        });
    };

    const validate = () => {
        setErrors([]);
        duo.activateDuo(newDuo.id, code).then(onDuoActivationSuccessful, () => {
            // may fail for valid reasons, e.g. timeout and won't harm the activation as the user can still
            // manually activate the DUO
        });
    };

    const create = () => {
        duo.createDuo(
            store.getState().server.systemWideDuoExists,
            title || undefined,
            integrationKey || undefined,
            secretKey || undefined,
            host || undefined
        ).then(
            function (createdDuo) {
                setNewDuo(createdDuo);
                if (createdDuo.uri === "") {
                    duo.activateDuo(createdDuo.id, undefined).then(onDuoActivationSuccessful, () => {
                        // may fail for valid reasons, e.g. timeout and won't harm the activation as the user can still
                        // manually activate the DUO
                    });
                    setView("step3");
                    return;
                }
                setView("step2");
                const QRCode = require("qrcode");
                const canvas = document.getElementById("canvas");
                setTitle("");
                setIntegrationKey("");
                setSecretKey("");
                setHost("");

                QRCode.toCanvas(canvas, createdDuo.uri, function (error) {
                    if (error) {
                        console.error(error);
                    }
                });
            },
            function (error) {
                if (error.hasOwnProperty("yubikey_otp")) {
                    setErrors(error.yubikey_otp);
                } else {
                    console.log(error);
                }
            }
        );
    };

    const onDelete = (rowData) => {
        setErrors([]);

        var onSuccess = function (successful) {
            loadDuos();
        };

        var onError = function (error) {
            console.log(error);
        };

        return duo.deleteDuo(rowData[0]).then(onSuccess, onError);
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("YUBIKEY_TITLE") },
        {
            name: t("ACTIVE"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return <span>{tableMeta.rowData[2] && <CheckIcon />}</span>;
                },
            },
        },
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
            <DialogTitle id="alert-dialog-title">{t("DUO")}</DialogTitle>
            {view === "default" && (
                <DialogContent>
                    <Tabs value={value} onChange={handleChange} aria-label="simple tabs example">
                        <Tab label={t("EXISTING_DUOS")} id="simple-tab-0" aria-controls="simple-tabpanel-0" />
                        <Tab label={t("NEW_DUO")} id="simple-tab-1" aria-controls="simple-tabpanel-1" />
                    </Tabs>
                    <TabPanel value={value} index={0}>
                        <Table data={duos} columns={columns} options={options} />;
                    </TabPanel>
                    <TabPanel value={value} index={1}>
                        <Grid container>
                            {!store.getState().server.systemWideDuoExists && (
                                <Grid item xs={12} sm={12} md={12}>
                                    <TextField
                                        className={classes.textField}
                                        variant="outlined"
                                        margin="dense"
                                        id="title"
                                        label={t("TITLE")}
                                        helperText={t("TITLE_OF_YOUR_DUO")}
                                        name="title"
                                        autoComplete="title"
                                        required
                                        value={title}
                                        onChange={(event) => {
                                            setTitle(event.target.value);
                                        }}
                                    />
                                </Grid>
                            )}
                            {!store.getState().server.systemWideDuoExists && (
                                <Grid item xs={12} sm={12} md={12}>
                                    <TextField
                                        className={classes.textField}
                                        variant="outlined"
                                        margin="dense"
                                        id="integrationKey"
                                        label={t("INTEGRATION_KEY")}
                                        name="integrationKey"
                                        autoComplete="integrationKey"
                                        required
                                        value={integrationKey}
                                        onChange={(event) => {
                                            setIntegrationKey(event.target.value);
                                        }}
                                    />
                                </Grid>
                            )}
                            {!store.getState().server.systemWideDuoExists && (
                                <Grid item xs={12} sm={12} md={12}>
                                    <TextField
                                        className={classes.textField}
                                        variant="outlined"
                                        margin="dense"
                                        id="secretKey"
                                        label={t("SECRET_KEY")}
                                        name="secretKey"
                                        autoComplete="secretKey"
                                        required
                                        value={secretKey}
                                        onChange={(event) => {
                                            setSecretKey(event.target.value);
                                        }}
                                    />
                                </Grid>
                            )}
                            {!store.getState().server.systemWideDuoExists && (
                                <Grid item xs={12} sm={12} md={12}>
                                    <TextField
                                        className={classes.textField}
                                        variant="outlined"
                                        margin="dense"
                                        id="host"
                                        label={t("HOST")}
                                        name="host"
                                        autoComplete="host"
                                        required
                                        value={host}
                                        onChange={(event) => {
                                            setHost(event.target.value);
                                        }}
                                    />
                                </Grid>
                            )}
                            <Grid container>
                                {errors && (
                                    <Grid item xs={12} sm={12} md={12}>
                                        <>
                                            {errors.map((prop, index) => {
                                                return (
                                                    <MuiAlert
                                                        onClose={() => {
                                                            setErrors([]);
                                                        }}
                                                        key={index}
                                                        severity="error"
                                                        style={{ marginBottom: "5px" }}
                                                    >
                                                        {t(prop)}
                                                    </MuiAlert>
                                                );
                                            })}
                                        </>
                                    </Grid>
                                )}
                            </Grid>
                            <Grid item xs={12} sm={12} md={12}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={create}
                                    disabled={!store.getState().server.systemWideDuoExists && (!title || !integrationKey || !secretKey || !host)}
                                >
                                    {t("SETUP")}
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
                            <canvas id="canvas" />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <Button variant="contained" color="primary" onClick={gotoStep3}>
                                {t("SCAN_THE_CODE_THEN_CLICK_HERE")}
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>
            )}
            {view === "step3" && (
                <DialogContent>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="code"
                                label={t("CODE")}
                                helperText={t("ONE_CODE_FOR_VALIDATION")}
                                name="code"
                                autoComplete="code"
                                value={code}
                                onChange={(event) => {
                                    setCode(event.target.value);
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <Button variant="contained" color="primary" onClick={validate}>
                                {t("VALIDATE")}
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>
            )}
            <DialogActions>
                <Button
                    onClick={() => {
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

MultifactorAuthenticatorDuo.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default compose(withTranslation(), connect(mapStateToProps, mapDispatchToProps))(MultifactorAuthenticatorDuo);
