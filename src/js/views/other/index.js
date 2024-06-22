import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Paper from "@mui/material/Paper";

import Base from "../../components/base";
import BaseTitle from "../../components/base-title";
import BaseContent from "../../components/base-content";
import OtherSessionsView from "./sessions";
import OtherDatastoresView from "./datastores";
import OtherApiKeysView from "./api-keys";
import OtherFileRepositoriesView from "./file-repositories";
import { getStore } from "../../services/store";
import OtherKnownHostsView from "./known-hosts";
import OtherExportView from "./export";
import OtherImportView from "./import";
import TabPanel from "../../components/tab-panel";

const OtherView = (props) => {
    const { t } = useTranslation();
    let location = useLocation();
    const [value, setValue] = React.useState(location.pathname);

    return (
        <Base {...props}>
            <BaseTitle>{t("OTHER")}</BaseTitle>
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
                                label={t("SESSIONS")}
                                value="/other/sessions"
                                component={Link}
                                to={"/other/sessions"}
                                onClick={() => setValue("/other/sessions")}
                            />
                            <Tab
                                label={t("DATASTORES")}
                                value="/other/data-stores"
                                component={Link}
                                to={"/other/data-stores"}
                                onClick={() => setValue("/other/data-stores")}
                            />
                            {!getStore().getState().server.complianceDisableApiKeys && (
                                <Tab
                                    label={t("API_KEYS")}
                                    value="/other/api-keys"
                                    component={Link}
                                    to={"/other/api-keys"}
                                    onClick={() => setValue("/other/api-keys")}
                                />
                            )}
                            {!getStore().getState().server.complianceDisableFileRepositories && (
                                <Tab
                                    label={t("FILE_REPOSITORIES")}
                                    value="/other/file-repositories"
                                    component={Link}
                                    to={"/other/file-repositories"}
                                    onClick={() => setValue("/other/file-repositories")}
                                />
                            )}
                            <Tab
                                label={t("KNOWN_HOSTS")}
                                value="/other/known-hosts"
                                component={Link}
                                to={"/other/known-hosts"}
                                onClick={() => setValue("/other/known-hosts")}
                            />
                            {!getStore().getState().server.complianceDisableExport && (
                                <Tab
                                    label={t("EXPORT")}
                                    value="/other/export"
                                    component={Link}
                                    to={"/other/export"}
                                    onClick={() => setValue("/other/export")}
                                />
                            )}
                            <Tab
                                label={t("IMPORT")}
                                value="/other/import"
                                component={Link}
                                to={"/other/import"}
                                onClick={() => setValue("/other/import")}
                            />
                        </Tabs>
                    </AppBar>
                    <TabPanel value={value} index={"/other/sessions"}>
                        <OtherSessionsView {...props} />
                    </TabPanel>
                    <TabPanel value={value} index={"/other/data-stores"}>
                        <OtherDatastoresView {...props} />
                    </TabPanel>
                    {!getStore().getState().server.complianceDisableApiKeys && (
                        <TabPanel value={value} index={"/other/api-keys"}>
                            <OtherApiKeysView {...props} />
                        </TabPanel>
                    )}
                    {!getStore().getState().server.complianceDisableFileRepositories && (
                        <TabPanel value={value} index={"/other/file-repositories"}>
                            <OtherFileRepositoriesView {...props} />
                        </TabPanel>
                    )}
                    <TabPanel value={value} index={"/other/known-hosts"}>
                        <OtherKnownHostsView {...props} />
                    </TabPanel>
                    {!getStore().getState().server.complianceDisableExport && (
                        <TabPanel value={value} index={"/other/export"}>
                            <OtherExportView {...props} />
                        </TabPanel>
                    )}
                    <TabPanel value={value} index={"/other/import"}>
                        <OtherImportView {...props} />
                    </TabPanel>
                </Paper>
            </BaseContent>
        </Base>
    );
};

export default OtherView;
