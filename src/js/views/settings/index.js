import React from "react";
import AppBar from "@material-ui/core/AppBar";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Paper from "@material-ui/core/Paper";

import Base from "../../containers/base";
import BaseTitle from "../../containers/base-title";
import BaseContent from "../../containers/base-content";
import SettingsPasswordGeneratorView from "./password-generator";
import SettingsNotificationView from "./notification";
import SettingsGpgView from "./gpg";
import SettingsGeneralView from "./general";
import TabPanel from "../../components/tab-panel";

const SettingsView = (props) => {
    const { t } = useTranslation();
    let location = useLocation();
    const [value, setValue] = React.useState(location.pathname);

    return (
        <Base {...props}>
            <BaseTitle>{t("SETTINGS")}</BaseTitle>
            <BaseContent>
                <Paper square>
                    <AppBar elevation={0} position="static" color="default">
                        <Tabs variant="scrollable" scrollButtons="auto" value={value} aria-label="scrollable auto tabs example">
                            <Tab
                                label={t("PASSWORD_GENERATOR")}
                                value="/settings/password-generator"
                                component={Link}
                                to={"/settings/password-generator"}
                                onClick={() => setValue("/settings/password-generator")}
                            />
                            <Tab
                                label={t("NOTIFICATIONS")}
                                value="/settings/notification"
                                component={Link}
                                to={"/settings/notification"}
                                onClick={() => setValue("/settings/notification")}
                            />
                            <Tab label={t("GPG")} value="/settings/gpg" component={Link} to={"/settings/gpg"} onClick={() => setValue("/settings/gpg")} />
                            <Tab
                                label={t("GENERAL")}
                                value="/settings/general"
                                component={Link}
                                to={"/settings/general"}
                                onClick={() => setValue("/settings/general")}
                            />
                        </Tabs>
                    </AppBar>
                    <TabPanel value={value} index={"/settings/password-generator"}>
                        <SettingsPasswordGeneratorView {...props} />
                    </TabPanel>
                    <TabPanel value={value} index={"/settings/notification"}>
                        <SettingsNotificationView {...props} />
                    </TabPanel>
                    <TabPanel value={value} index={"/settings/gpg"}>
                        <SettingsGpgView {...props} />
                    </TabPanel>
                    <TabPanel value={value} index={"/settings/general"}>
                        <SettingsGeneralView {...props} />
                    </TabPanel>
                </Paper>
            </BaseContent>
        </Base>
    );
};

export default SettingsView;
