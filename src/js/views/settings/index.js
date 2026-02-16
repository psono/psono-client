import React from "react";
import AppBar from "@mui/material/AppBar";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Paper from "@mui/material/Paper";

import Base from "../../components/base";
import BaseTitle from "../../components/base-title";
import BaseContent from "../../components/base-content";
import SettingsPasswordGeneratorView from "./password-generator";
import SettingsEntryTypesView from "./entry-types";
import SettingsNotificationView from "./notification";
import SettingsGpgView from "./gpg";
import SettingsGeneralView from "./general";
import SettingsDomainSynonymsView from "./domain-synonyms";
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
                        <Tabs
                            variant="scrollable"
                            scrollButtons="auto"
                            value={value}
                            aria-label="scrollable auto tabs example"
                        >
                            <Tab
                                label={t("PASSWORD_GENERATOR")}
                                value="/settings/password-generator"
                                component={Link}
                                to={"/settings/password-generator"}
                                onClick={() => setValue("/settings/password-generator")}
                            />
                            <Tab
                                label={t("ENTRY_TYPES")}
                                value="/settings/entry-types"
                                component={Link}
                                to={"/settings/entry-types"}
                                onClick={() => setValue("/settings/entry-types")}
                            />
                            <Tab
                                label={t("NOTIFICATIONS")}
                                value="/settings/notification"
                                component={Link}
                                to={"/settings/notification"}
                                onClick={() => setValue("/settings/notification")}
                            />
                            <Tab
                                label={t("GPG")}
                                value="/settings/gpg"
                                component={Link}
                                to={"/settings/gpg"}
                                onClick={() => setValue("/settings/gpg")}
                            />
                            <Tab
                                label={t("DOMAIN_SYNONYMS")}
                                value="/settings/domain-synonyms"
                                component={Link}
                                to={"/settings/domain-synonyms"}
                                onClick={() => setValue("/settings/domain-synonyms")}
                            />
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
                    <TabPanel value={value} index={"/settings/entry-types"}>
                        <SettingsEntryTypesView {...props} />
                    </TabPanel>
                    <TabPanel value={value} index={"/settings/notification"}>
                        <SettingsNotificationView {...props} />
                    </TabPanel>
                    <TabPanel value={value} index={"/settings/gpg"}>
                        <SettingsGpgView {...props} />
                    </TabPanel>
                    <TabPanel value={value} index={"/settings/domain-synonyms"}>
                        <SettingsDomainSynonymsView {...props} />
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
