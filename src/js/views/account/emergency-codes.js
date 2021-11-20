import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { compose } from "redux";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import { Grid } from "@material-ui/core";
import Divider from "@material-ui/core/Divider";

import actionCreators from "../../actions/action-creators";
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

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default connect(mapStateToProps, mapDispatchToProps)(AccountEmergencyCodesView);
