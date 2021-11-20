import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { useTranslation } from "react-i18next";
import Button from "@material-ui/core/Button";
import { Grid } from "@material-ui/core";
import Divider from "@material-ui/core/Divider";

import actionCreators from "../../actions/action-creators";
import DeleteAccountDialog from "./delete-account-dialog";

const AccountDeleteAccountView = (props) => {
    const { t } = useTranslation();
    const [open, setOpen] = React.useState(false);

    const closeModal = () => {
        setOpen(false);
    };

    const onDeleteAccount = (event) => {
        setOpen(true);
    };

    return (
        <>
            <Grid container>
                <Grid item xs={12} sm={12} md={12}>
                    <h2>{t("DELETE_ACCOUNT")}</h2>
                    <p>{t("DELETE_ACCOUNT_DESCRIPTION")}</p>
                    <Divider style={{ marginBottom: "20px" }} />
                </Grid>
            </Grid>
            <Grid container style={{ marginBottom: "8px" }}>
                <Grid item xs={6} sm={6} md={4} style={{ paddingTop: "8px" }}>
                    {t("DELETE_ACCOUNT")}
                </Grid>
                <Grid item xs={6} sm={6} md={8}>
                    <Button variant="contained" color="primary" onClick={onDeleteAccount}>
                        {t("DELETE")}
                    </Button>
                </Grid>
                {open && <DeleteAccountDialog {...props} open={open} onClose={closeModal} />}
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
export default connect(mapStateToProps, mapDispatchToProps)(AccountDeleteAccountView);
