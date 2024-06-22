import React from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import Button from "@mui/material/Button";
import { Grid } from "@mui/material";
import Divider from "@mui/material/Divider";

import EmergencyCodesDialog from "./emergency-codes-dialog";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
        [theme.breakpoints.up("md")]: {
            width: "440px",
        },
    },
}));

const AccountEmergencyCodesView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);

    const closeModal = () => {
        setOpen(false);
    };

    const onConfigureEmergencyCodes = (event) => {
        setOpen(true);
    };

    return (
        <>
            <Grid container>
                <Grid item xs={12} sm={12} md={12}>
                    <h2>{t("EMERGENCY_CODES")}</h2>
                    <p>{t("EMERGENCY_CODES_DESCRIPTION")}</p>
                    <Divider style={{ marginBottom: "20px" }} />
                </Grid>
            </Grid>
            <Grid container style={{ marginBottom: "8px" }}>
                <Grid item xs={6} sm={6} md={4} style={{ paddingTop: "8px" }}>
                    {t("EMERGENCY_CODES")}
                </Grid>
                <Grid item xs={6} sm={6} md={8}>
                    <Button variant="contained" color="primary" onClick={onConfigureEmergencyCodes}>
                        {t("CONFIGURE")}
                    </Button>
                </Grid>
                {open && <EmergencyCodesDialog {...props} open={open} onClose={closeModal} />}
            </Grid>
        </>
    );
};

export default AccountEmergencyCodesView;
