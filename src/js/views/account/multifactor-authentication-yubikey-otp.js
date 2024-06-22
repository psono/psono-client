import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import { Grid } from "@mui/material";
import TextField from "@mui/material/TextField";

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
                customHeadLabelRender: () => null,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                onDelete(tableMeta.rowData);
                            }}
                            size="large">
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
                                margin="dense" size="small"
                                id="title"
                                label={t("TITLE")}
                                name="title"
                                autoComplete="off"
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
                                margin="dense" size="small"
                                id="yubikeyOtpCode"
                                label={t("YUBIKEY_OTP")}
                                name="yubikeyOtpCode"
                                autoComplete="off"
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
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={create}
                                disabled={!title || !yubikeyOtpCode}
                            >
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

export default MultifactorAuthenticatorYubikeyOtp;
