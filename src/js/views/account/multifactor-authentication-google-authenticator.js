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
import MuiAlert from "@material-ui/lab/Alert";

import actionCreators from "../../actions/action-creators";
import Table from "../../components/table";
import googleAuthenticator from "../../services/google-authenticator";

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

const MultifactorAuthenticatorGoogleAuthenticator = (props) => {
    const { t, open, onClose } = props;
    const classes = useStyles();
    const [value, setValue] = React.useState(0);
    const [title, setTitle] = React.useState("");
    const [code, setCode] = React.useState("");
    const [newGa, setNewGa] = React.useState({});
    const [view, setView] = React.useState("default");
    const [googleAuthenticators, setGoogleAuthenticators] = React.useState([]);
    const [errors, setErrors] = useState([]);

    React.useEffect(() => {
        loadGoogleAuthenticators();
    }, []);

    const loadGoogleAuthenticators = () => {
        googleAuthenticator.readGa().then(
            function (authenticators) {
                setGoogleAuthenticators(
                    authenticators.map((authenticator, index) => {
                        return [authenticator.id, authenticator.title, authenticator.active];
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
        setView("create_step1");

        googleAuthenticator.createGa(title).then(
            function (ga) {
                setNewGa(ga);
                const QRCode = require("qrcode");
                const canvas = document.getElementById("canvas");
                setTitle("");

                QRCode.toCanvas(canvas, ga.uri, function (error) {
                    if (error) {
                        console.error(error);
                    }
                });
            },
            function (error) {
                console.log(error);
            }
        );
    };
    const showStep2 = () => {
        setView("create_step2");
    };
    const validate = () => {
        setErrors([]);

        var onSuccess = function (successful) {
            if (successful) {
                setNewGa({});
                setView("default");
                setValue(0);
                loadGoogleAuthenticators();
            } else {
                setErrors(["CODE_INCORRECT"]);
            }
        };

        var onError = function (error) {
            console.log(error);
        };

        return googleAuthenticator.activateGa(newGa.id, code).then(onSuccess, onError);
    };
    const onDelete = (rowData) => {
        setErrors([]);

        var onSuccess = function (successful) {
            loadGoogleAuthenticators();
        };

        var onError = function (error) {
            console.log(error);
        };

        return googleAuthenticator.deleteGa(rowData[0]).then(onSuccess, onError);
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("GA_TITLE") },
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
            <DialogTitle id="alert-dialog-title">{t("GOOGLE_AUTHENTICATOR")}</DialogTitle>
            {view === "default" && (
                <DialogContent>
                    <Tabs value={value} onChange={handleChange} aria-label="simple tabs example">
                        <Tab label={t("EXISTING_GAS")} id="simple-tab-0" aria-controls="simple-tabpanel-0" />
                        <Tab label={t("NEW_GA")} id="simple-tab-1" aria-controls="simple-tabpanel-1" />
                    </Tabs>
                    <TabPanel value={value} index={0}>
                        <Table data={googleAuthenticators} columns={columns} options={options} />;
                    </TabPanel>
                    <TabPanel value={value} index={1}>
                        <Grid container>
                            <Grid item xs={12} sm={12} md={12}>
                                <TextField
                                    className={classes.textField}
                                    variant="outlined"
                                    margin="dense"
                                    id="title"
                                    label={t("TITLE")}
                                    name="title"
                                    autoComplete="title"
                                    required
                                    value={title}
                                    onChange={(event) => {
                                        setTitle(event.target.value);
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={12} md={12}>
                                <Button variant="contained" color="primary" onClick={generate} disabled={!title}>
                                    {t("GENERATE")}
                                </Button>
                            </Grid>
                        </Grid>
                    </TabPanel>
                </DialogContent>
            )}
            {view === "create_step1" && (
                <DialogContent>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <canvas id="canvas" />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <Button variant="contained" color="primary" onClick={showStep2}>
                                {t("SCAN_THE_CODE_THEN_CLICK_HERE")}
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>
            )}
            {view === "create_step2" && (
                <DialogContent>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="code"
                                label={t("CODE")}
                                name="code"
                                autoComplete="code"
                                helperText={t("ONE_CODE_FOR_VALIDATION")}
                                required
                                value={code}
                                onChange={(event) => {
                                    setCode(event.target.value);
                                }}
                            />
                        </Grid>
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
                            <Button variant="contained" color="primary" onClick={validate} disabled={!code || code.length < 6}>
                                {t("VALIDATE")}
                            </Button>
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

MultifactorAuthenticatorGoogleAuthenticator.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default compose(withTranslation(), connect(mapStateToProps, mapDispatchToProps))(MultifactorAuthenticatorGoogleAuthenticator);
