import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { useTranslation } from "react-i18next";
import Divider from "@material-ui/core/Divider";
import { Grid } from "@material-ui/core";

import actionCreators from "../../actions/action-creators";

const SettingsPasswordGeneratorView = (props) => {
    const { t } = useTranslation();

    return (
        <Grid container>
            <Grid item xs={12} sm={12} md={12}>
                <h2>{t("PASSWORD_GENERATOR")}</h2>
                <p>{t("PASSWORD_GENERATOR_DESCRIPTION")}</p>
                <Divider style={{ marginBottom: "20px" }} />
            </Grid>
            Sessions
        </Grid>
    );
};

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default connect(mapStateToProps, mapDispatchToProps)(SettingsPasswordGeneratorView);
