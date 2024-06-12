import React from "react";
import AppBar from "@mui/material/AppBar";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Grid } from "@mui/material";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Paper from "@mui/material/Paper";

import { getStore } from "../../services/store";
import Base from "../../components/base";
import BaseTitle from "../../components/base-title";
import BaseContent from "../../components/base-content";
import AccountOverviewView from "./server-info";
import MultifactorAuthenticationView from "./multifactor-authentication";
import AccountEmergencyCodesView from "./emergency-codes";
import AccountPasswordRecoveryCodesView from "./password-recovery-codes";
import AccountDeleteAccountView from "./delete-account";
import AccountChangeEmailView from "./change-email";
import ProfilePicture from "./profile-picture";
import AccountChangePasswordView from "./change-password";
import TabPanel from "../../components/tab-panel";

const AccountView = (props) => {
    const { t } = useTranslation();
    let location = useLocation();
    const [value, setValue] = React.useState(location.pathname);

    return (
        <Base {...props}>
            <BaseTitle>{t("ACCOUNT_DETAILS")}</BaseTitle>
            <BaseContent>
                <Grid container>
                    <Grid item xs={12} sm={6} md={4} lg={3}>

                        <Paper square style={{ height: '100%' }}>
                            <ProfilePicture />
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={8} lg={9}>
                        <Paper square style={{ height: '100%' }}>
                            <AppBar elevation={0} position="static" color="default">
                                <Tabs
                                    variant="scrollable"
                                    scrollButtons="auto"
                                    value={value}
                                    aria-label="scrollable auto tabs example"
                                >
                                    <Tab
                                        label={t("SERVER_INFO")}
                                        value="/account/server-info"
                                        component={Link}
                                        to={"/account/server-info"}
                                        onClick={() => setValue("/account/server-info")}
                                    />
                                    {getStore().getState().user.authentication === "AUTHKEY" && (
                                        <Tab
                                            label={t("CHANGE_E_MAIL")}
                                            value="/account/change-email"
                                            component={Link}
                                            to={"/account/change-email"}
                                            onClick={() => setValue("/account/change-email")}
                                        />
                                    )}
                                    {getStore().getState().user.authentication === "AUTHKEY" && (
                                        <Tab
                                            label={t("CHANGE_PASSWORD")}
                                            value="/account/change-password"
                                            component={Link}
                                            to={"/account/change-password"}
                                            onClick={() => setValue("/account/change-password")}
                                        />
                                    )}
                                    {getStore().getState().server.allowedSecondFactors.length !== 0 && (
                                        <Tab
                                            label={t("MULTIFACTOR_AUTHENTICATION")}
                                            value="/account/multifactor-authentication"
                                            component={Link}
                                            to={"/account/multifactor-authentication"}
                                            onClick={() => setValue("/account/multifactor-authentication")}
                                        />
                                    )}
                                    {!getStore().getState().server.complianceDisableEmergencyCodes && (
                                        <Tab
                                            label={t("EMERGENCY_CODES")}
                                            value="/account/emergency-codes"
                                            component={Link}
                                            to={"/account/emergency-codes"}
                                            onClick={() => setValue("/account/emergency-codes")}
                                        />
                                    )}
                                    {!getStore().getState().server.complianceDisableRecoveryCodes && (
                                        <Tab
                                            label={t("GENERATE_PASSWORD_RECOVERY")}
                                            value="/account/recovery-codes"
                                            component={Link}
                                            to={"/account/recovery-codes"}
                                            onClick={() => setValue("/account/recovery-codes")}
                                        />
                                    )}
                                    {!getStore().getState().server.complianceDisableDeleteAccount && (
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
                            <TabPanel value={value} index={"/account/server-info"}>
                                <AccountOverviewView {...props} />
                            </TabPanel>
                            {getStore().getState().user.authentication === "AUTHKEY" && (
                                <TabPanel value={value} index={"/account/change-email"}>
                                    <AccountChangeEmailView {...props} />
                                </TabPanel>
                            )}
                            {getStore().getState().user.authentication === "AUTHKEY" && (
                                <TabPanel value={value} index={"/account/change-password"}>
                                    <AccountChangePasswordView {...props} />
                                </TabPanel>
                            )}
                            {getStore().getState().server.allowedSecondFactors.length !== 0 && (
                                <TabPanel value={value} index={"/account/multifactor-authentication"}>
                                    <MultifactorAuthenticationView {...props} />
                                </TabPanel>
                            )}
                            {!getStore().getState().server.complianceDisableEmergencyCodes && (
                                <TabPanel value={value} index={"/account/emergency-codes"}>
                                    <AccountEmergencyCodesView {...props} />
                                </TabPanel>
                            )}
                            {!getStore().getState().server.complianceDisableRecoveryCodes && (
                                <TabPanel value={value} index={"/account/recovery-codes"}>
                                    <AccountPasswordRecoveryCodesView {...props} />
                                </TabPanel>
                            )}
                            {!getStore().getState().server.complianceDisableDeleteAccount && (
                                <TabPanel value={value} index={"/account/delete-account"}>
                                    <AccountDeleteAccountView {...props} />
                                </TabPanel>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

            </BaseContent>
        </Base>
    );
};

export default AccountView;
