import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import { Grid } from "@material-ui/core";
import Divider from "@material-ui/core/Divider";

import actionCreators from "../../actions/action-creators";
import PasswordRecoveryCodesDialog from "./password-recovery-codes-dialog";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
        [theme.breakpoints.up("md")]: {
            width: "440px",
        },
    },
}));

const AccountPasswordRecoveryCodesView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);

    const closeModal = () => {
        setOpen(false);
    };

    const onConfigurePasswordRecoveryCodes = (event) => {
        setOpen(true);
    };

    return (
        <>
            <Grid container>
                <Grid item xs={12} sm={12} md={12}>
                    <h2>{t("GENERATE_PASSWORD_RECOVERY")}</h2>
                    <p>{t("GENERATE_PASSWORD_RECOVERY_DESCRIPTION")}</p>
                    <Divider style={{ marginBottom: "20px" }} />
                </Grid>
            </Grid>
            <Grid container style={{ marginBottom: "8px" }}>
                <Grid item xs={6} sm={6} md={4} style={{ paddingTop: "8px" }}>
                    {t("NEW_PASSWORD_RECOVERY_CODE")}
                </Grid>
                <Grid item xs={6} sm={6} md={8}>
                    <Button variant="contained" color="primary" onClick={onConfigurePasswordRecoveryCodes}>
                        {t("GENERATE")}
                    </Button>
                </Grid>
                {open && <PasswordRecoveryCodesDialog {...props} open={open} onClose={closeModal} />}
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
export default connect(mapStateToProps, mapDispatchToProps)(AccountPasswordRecoveryCodesView);
