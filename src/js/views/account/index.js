import React from "react";
import PropTypes from "prop-types";
import AppBar from "@material-ui/core/AppBar";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { Link, useLocation } from "react-router-dom";
import { compose } from "redux";
import { withTranslation } from "react-i18next";

import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Box from "@material-ui/core/Box";

import store from "../../services/store";
import Base from "../../containers/base";
import BaseTitle from "../../containers/base-title";
import BaseContent from "../../containers/base-content";
import actionCreators from "../../actions/action-creators";
import AccountOverviewView from "./overview";
import MultifactorAuthenticationView from "./multifactor-authentication";
import AccountEmergencyCodesView from "./emergency-codes";
import AccountPasswordRecoveryCodesView from "./password-recovery-codes";
import AccountDeleteAccountView from "./delete-account";

const useStyles = makeStyles((theme) => ({}));

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div role="tabpanel" hidden={value !== index} id={`scrollable-auto-tabpanel-${index}`} aria-labelledby={`scrollable-auto-tab-${index}`} {...other}>
            {value === index && <Box p={3}>{children}</Box>}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};

const AccountView = (props) => {
    const { t } = props;
    const classes = useStyles();
    let location = useLocation();
    const [value, setValue] = React.useState(location.pathname);

    return (
        <Base {...props}>
            <BaseTitle>{t("ACCOUNT_DETAILS")}</BaseTitle>
            <BaseContent>
                <Paper square>
                    <AppBar elevation={0} position="static" color="default">
                        <Tabs variant="scrollable" scrollButtons="auto" value={value} aria-label="scrollable auto tabs example">
                            <Tab
                                label={t("OVERVIEW")}
                                value="/account/overview"
                                component={Link}
                                to={"/account/overview"}
                                onClick={() => setValue("/account/overview")}
                            />
                            {store.getState().user.authentication === "AUTHKEY" && (
                                <Tab
                                    label={t("CHANGE_E_MAIL")}
                                    value="/account/change-email"
                                    component={Link}
                                    to={"/account/change-email"}
                                    onClick={() => setValue("/account/change-email")}
                                />
                            )}
                            {store.getState().user.authentication === "AUTHKEY" && (
                                <Tab
                                    label={t("CHANGE_PASSWORD")}
                                    value="/account/change-password"
                                    component={Link}
                                    to={"/account/change-password"}
                                    onClick={() => setValue("/account/change-password")}
                                />
                            )}
                            {store.getState().server.allowedSecondFactors.length !== 0 && (
                                <Tab
                                    label={t("MULTIFACTOR_AUTHENTICATION")}
                                    value="/account/multifactor-authentication"
                                    component={Link}
                                    to={"/account/multifactor-authentication"}
                                    onClick={() => setValue("/account/multifactor-authentication")}
                                />
                            )}
                            {!store.getState().server.complianceDisableEmergencyCodes && (
                                <Tab
                                    label={t("EMERGENCY_CODES")}
                                    value="/account/emergency-codes"
                                    component={Link}
                                    to={"/account/emergency-codes"}
                                    onClick={() => setValue("/account/emergency-codes")}
                                />
                            )}
                            {!store.getState().server.complianceDisableRecoveryCodes && (
                                <Tab
                                    label={t("GENERATE_PASSWORD_RECOVERY")}
                                    value="/account/recovery-codes"
                                    component={Link}
                                    to={"/account/recovery-codes"}
                                    onClick={() => setValue("/account/recovery-codes")}
                                />
                            )}
                            {!store.getState().server.complianceDisableDeleteAccount && (
                                <Tab
                                    label={t("DELETE_ACCOUNT")}
                                    value="/account/delete-account"
                                    component={Link}
                                    to={"/account/delete-account"}
                                    onClick={() => setValue("/account/delete-account")}
                                />
                            )}
                        </Tabs>
                    </AppBar>
                    <TabPanel value={value} index={"/account/overview"}>
                        <AccountOverviewView {...props} />
                    </TabPanel>
                    <TabPanel value={value} index={"/account/change-email"}>
                        Item Two
                    </TabPanel>
                    <TabPanel value={value} index={"/account/change-password"}>
                        Item Three
                    </TabPanel>
                    <TabPanel value={value} index={"/account/multifactor-authentication"}>
                        <MultifactorAuthenticationView {...props} />
                    </TabPanel>
                    <TabPanel value={value} index={"/account/emergency-codes"}>
                        <AccountEmergencyCodesView {...props} />
                    </TabPanel>
                    <TabPanel value={value} index={"/account/recovery-codes"}>
                        <AccountPasswordRecoveryCodesView {...props} />
                    </TabPanel>
                    <TabPanel value={value} index={"/account/delete-account"}>
                        <AccountDeleteAccountView {...props} />
                    </TabPanel>
                </Paper>
            </BaseContent>
        </Base>
    );
};

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default compose(withTranslation(), connect(mapStateToProps, mapDispatchToProps))(AccountView);
