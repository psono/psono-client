import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import {CircularProgress, TextField, Grid,Box,IconButton, Button, DialogTitle, Dialog, DialogContent, DialogActions, Autocomplete } from "@mui/material";
import { makeStyles } from "@mui/styles";
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon  from '@mui/icons-material/Check';
import Table from "../../components/table";
import ivalt from "../../services/ivalt";
import GridContainerErrors from "../../components/grid-container-errors";
import countries from "../../countries";


const FlagImage = ({ option }) => {
    const flagW20 = `img/flags/${option.code.toLowerCase()}.png`;

    return (
        <img
            loading='lazy'
            width='20'
            src={flagW20}
            srcSet={`${flagW20} 2x`}
            alt=''
        />
    );
}

function CountryCodeSelect({ onSelect, selected = '1', t }) {
    const selectedCountry = countries.filter((value) => value.phone === selected);
    return (
        <Autocomplete
            className={
                'MuiFormControl-root MuiTextField-root css-1pzfvze-MuiFormControl-root-MuiTextField-root'
            }
            id='country-select'
            options={countries}
            autoHighlight
            defaultValue={selectedCountry[0]}
            onChange={(event, newValue) => {
                if(newValue !== null){
                    onSelect(newValue.phone);
                }
            }}
            getOptionLabel={(option) => t(option.label) + " +" + option.phone}
            renderOption={(props,option) => (
                <Box
                    onClick={() => onSelect(option.phone)}
                    component='li'
                    sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                    {...props}
                >
                    <FlagImage option={option} />
                    {t(option.label)} ({option.code}) +{option.phone}
                </Box>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={t('CHOOSE_COUNTRY')}
                    inputProps={{
                        ...params.inputProps,
                        autoComplete: 'new-password', // disable autocomplete and autofill
                    }}
                />
            )}
        />
    );
}


const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
    container: {
        background: 'gray',
        position: 'relative',
        display: 'inline-block',
    },
    image: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
    },
    progress: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 0,
    },
}));

const defaultTimer = 2 * 60


const MultifactorAuthenticatorIvalt = (props) => {
    const { open, onClose } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [mobile, setMobile] = useState("");
    const [view, setView] = useState("default");
    const [ivalts, setIvalts] = useState([]);
    const [errors, setErrors] = useState([]);
    const [ivaltLoading, setIvaltLoading] = useState(false)
    const [timer, setTimer] = useState(defaultTimer)
    const [countryCode, setCountryCode] = useState("1")
    const [createdId, setCreatedId] = useState(null);
    const [errorsResponses, setErrorsResponses] = useState({
        'AUTHENTICATION_FAILED': t("IVALT_AUTH_FAILED"),
        'BIOMETRIC_AUTH_REQUEST_SUCCESSFULLY_SENT': t("IVALT_AUTH_REQUEST_SENT"),
        'INVALID_TIMEZONE': t("IVALT_INVALID_TIMEZONE"),
        'INVALID_GEOFENCE': t("IVALT_INVALID_GEOFENCE"),
    });

    const getIvaltMobile = () => {
        return `+${countryCode}${mobile}`
    }

    useEffect(() => {
        loadivalts();
    }, []);

    useEffect(() => {

        let timerInterval;
        let timeout;

        if (ivaltLoading) {
            timerInterval = setInterval(() => {
                if (timer <= 0) {
                    clearInterval(timerInterval)
                    setErrors([t("IVALT_AUTH_FAILED")])
                    timeout = setTimeout(() => {
                        onClose()
                    }, 2000);

                    return
                }
                if (timer % 2 == 0) {
                    validateIvalt()
                }
                setTimer(prevTimer => prevTimer - 1)
            }, 1000)

        }

        return () => {
            clearInterval(timerInterval);
            clearTimeout(timeout)
        };
    }, [ivaltLoading, timer]);

    const loadivalts = () => {
        ivalt.readIvalt().then(
            function (keys) {
                setIvalts(
                    keys.map((key, index) => {
                        return [key.id, key.mobile, key.active];
                    })
                );
            },
            function (error) {
                console.error(error);
            }
        );
    };

    const validateIvalt = () => {
        ivalt.validateIvalt(
            getIvaltMobile() || undefined,
        ).then((res) => {
            onClose();
        }, (error, res) => {
            if (errorsResponses[error.non_field_errors[0]] !== undefined && error.non_field_errors[0] !== 'AUTHENTICATION_FAILED') {
                ivalt.deleteIvalt(createdId).then(() => {
                    setErrors([errorsResponses[error.non_field_errors[0]]]);
                    setIvaltLoading(false);
                    setCreatedId(null);
                });
            }
        });
    }

    const createIvalt = () => {
        setIvaltLoading(true)
        setTimer(defaultTimer)
        ivalt.createIvalt(
            getIvaltMobile() || undefined,
        ).then(
            (createdIvalt) => {
                setCreatedId(createdIvalt.id);
                validateIvalt();
            },
            function (error) {
                setIvaltLoading(false)
                setTimer(defaultTimer)
                if (error.hasOwnProperty("non_field_errors")) {
                    setErrors(error.non_field_errors);
                } else {
                    console.error(error);
                }
            }
        );
    }

    const onDelete = (rowData) => {
        setErrors([]);

        const onSuccess = function (successful) {
            loadivalts();
        };

        const onError = function (error) {
            console.error(error);
        };

        return ivalt.deleteIvalt(rowData[0]).then(onSuccess, onError);
    };
    const onCreate = () => {
        setView("create_step0");
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("MOBILE") },
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
                setIvaltLoading(false)
                onClose();
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">iVALT</DialogTitle>
            {view === "default" && (
                <DialogContent>
                    <Table data={ivalts} columns={columns} options={options} onCreate={onCreate} />
                </DialogContent>
            )}

            {view === "create_step0" && (
                <DialogContent>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            {t("ENTER_MOBILE_NUMBER_REGISTERED_WITH_IVALT")}
                        </Grid>
                        <Grid item xs={12} sm={4} md={4}>
                            <CountryCodeSelect onSelect={(val) => setCountryCode(val)} selected={countryCode} t={t} />
                        </Grid>
                        <Grid item xs={12} sm={8} md={8}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                id="mobile"
                                label={t("MOBILE")}
                                name="mobile"
                                autoComplete="off"
                                required
                                fullWidth={true}
                                value={mobile}
                                onChange={(event) => {
                                    setMobile(event.target.value);
                                }}
                            />
                        </Grid>
                        {errors.length > 0 && <GridContainerErrors errors={errors} setErrors={setErrors} />}

                        <Grid item xs={12} sm={12} md={12}>
                            {ivaltLoading ? (
                                <div style={{ display: 'flex', justifyContent: 'space-around' }}>

                                    <div className={classes.container}>
                                        <img width={45} height={45} src={"img/sc-logo.png"} alt="Loading" className={classes.image} />
                                        <CircularProgress size={60} className={classes.progress} style={{ animation: 'unset', zIndex: 2 }} />
                                    </div>

                                    <div>
                                        <p>{t("IVALT_REQUEST_SENT_TO_APP")}</p>
                                        <p>{timer}</p>
                                    </div>

                                </div>

                            ) : (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={createIvalt}
                                    disabled={!mobile || mobile.length < 4}
                                >
                                    {t("SETUP")}
                                </Button>
                            )}

                        </Grid>
                    </Grid>
                </DialogContent>
            )}


            <DialogActions>
                <Button
                    onClick={() => {
                        setIvaltLoading(false)
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

MultifactorAuthenticatorIvalt.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default MultifactorAuthenticatorIvalt;
