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
import yubikeyOtp from "../../services/yubikey-otp";

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

const MultifactorAuthenticatorYubikeyOtp = (props) => {
    const { t, open, onClose } = props;
    const classes = useStyles();
    const [value, setValue] = React.useState(0);
    const [title, setTitle] = React.useState("");
    const [yubikeyOtpCode, setYubikeyOtpCode] = React.useState("");
    const [yubikeyOtps, setYubikeyOtps] = React.useState([]);
    const [errors, setErrors] = useState([]);

    React.useEffect(() => {
        loadYubikeyOtps();
    }, []);

    const loadYubikeyOtps = () => {
        yubikeyOtp.readYubikeyOtp().then(
            function (keys) {
                setYubikeyOtps(
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
    const create = () => {
        yubikeyOtp.createYubikeyOtp(title, yubikeyOtpCode).then(
            function (ga) {
                loadYubikeyOtps();
                setValue(0);
                setTitle("");
                setYubikeyOtpCode("");
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
            loadYubikeyOtps();
        };

        var onError = function (error) {
            console.log(error);
        };

        return yubikeyOtp.deleteYubikeyOtp(rowData[0]).then(onSuccess, onError);
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
                onClose();
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{t("YUBIKEY_OTP")}</DialogTitle>
            <DialogContent>
                <Tabs value={value} onChange={handleChange} aria-label="simple tabs example">
                    <Tab label={t("EXISTING_YUBIKEYS")} id="simple-tab-0" aria-controls="simple-tabpanel-0" />
                    <Tab label={t("NEW_YUBIKEYS")} id="simple-tab-1" aria-controls="simple-tabpanel-1" />
                </Tabs>
                <TabPanel value={value} index={0}>
                    <Table data={yubikeyOtps} columns={columns} options={options} />;
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
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="yubikeyOtpCode"
                                label={t("YUBIKEY_OTP")}
                                name="yubikeyOtpCode"
                                autoComplete="yubikeyOtpCode"
                                helperText={t("ONE_OF_YOUR_YUBIKEY_OTPS")}
                                required
                                value={yubikeyOtpCode}
                                onChange={(event) => {
                                    setYubikeyOtpCode(event.target.value);
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
                            <Button variant="contained" color="primary" onClick={create} disabled={!title || !yubikeyOtpCode}>
                                {t("CREATE")}
                            </Button>
                        </Grid>
                    </Grid>
                </TabPanel>
            </DialogContent>
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

MultifactorAuthenticatorYubikeyOtp.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default compose(withTranslation(), connect(mapStateToProps, mapDispatchToProps))(MultifactorAuthenticatorYubikeyOtp);
