import React, { useState } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { bindActionCreators } from "redux";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
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
import yubikeyOtp from "../../services/yubikey-otp";
import GridContainerErrors from "../../components/grid-container-errors";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
}));

const MultifactorAuthenticatorYubikeyOtp = (props) => {
    const { open, onClose } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [title, setTitle] = React.useState("");
    const [view, setView] = React.useState("default");
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
    const create = () => {
        yubikeyOtp.createYubikeyOtp(title, yubikeyOtpCode).then(
            function (ga) {
                loadYubikeyOtps();
                setView("default");
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

        const onSuccess = function (successful) {
            loadYubikeyOtps();
        };

        const onError = function (error) {
            console.log(error);
        };

        return yubikeyOtp.deleteYubikeyOtp(rowData[0]).then(onSuccess, onError);
    };
    const onCreate = () => {
        setView("create_step0");
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
            {view === "default" && (
                <DialogContent>
                    <Table data={yubikeyOtps} columns={columns} options={options} onCreate={onCreate} />
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
                        <GridContainerErrors errors={errors} setErrors={setErrors} />
                        <Grid item xs={12} sm={12} md={12}>
                            <Button variant="contained" color="primary" onClick={create} disabled={!title || !yubikeyOtpCode}>
                                {t("CREATE")}
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
export default connect(mapStateToProps, mapDispatchToProps)(MultifactorAuthenticatorYubikeyOtp);
