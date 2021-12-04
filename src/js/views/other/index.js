import React from "react";
import PropTypes from "prop-types";
import AppBar from "@material-ui/core/AppBar";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Paper from "@material-ui/core/Paper";
import Box from "@material-ui/core/Box";

import Base from "../../containers/base";
import BaseTitle from "../../containers/base-title";
import BaseContent from "../../containers/base-content";
import OtherSessionsView from "./sessions";
import OtherDatastoresView from "./datastores";
import OtherApiKeysView from "./api-keys";
import OtherFileRepositoriesView from "./file-repositories";
import store from "../../services/store";
import OtherKnownHostsView from "./known-hosts";

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
                        <Tabs variant="scrollable" scrollButtons="auto" value={value} aria-label="scrollable auto tabs example">
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
                            {!store.getState().server.complianceDisableApiKeys && (
                                <Tab
                                    label={t("API_KEYS")}
                                    value="/other/api-keys"
                                    component={Link}
                                    to={"/other/api-keys"}
                                    onClick={() => setValue("/other/api-keys")}
                                />
                            )}
                            {!store.getState().server.complianceDisableFileRepositories && (
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
                            {!store.getState().server.complianceDisableExport && (
                                <Tab
                                    label={t("EXPORT")}
                                    value="/other/export"
                                    component={Link}
                                    to={"/other/export"}
                                    onClick={() => setValue("/other/export")}
                                />
                            )}
                            <Tab label={t("IMPORT")} value="/other/import" component={Link} to={"/other/import"} onClick={() => setValue("/other/import")} />
                        </Tabs>
                    </AppBar>
                    <TabPanel value={value} index={"/other/sessions"}>
                        <OtherSessionsView {...props} />
                    </TabPanel>
                    <TabPanel value={value} index={"/other/data-stores"}>
                        <OtherDatastoresView {...props} />
                    </TabPanel>
                    <TabPanel value={value} index={"/other/api-keys"}>
                        <OtherApiKeysView {...props} />
                    </TabPanel>
                    <TabPanel value={value} index={"/other/file-repositories"}>
                        <OtherFileRepositoriesView {...props} />
                    </TabPanel>
                    <TabPanel value={value} index={"/other/known-hosts"}>
                        <OtherKnownHostsView {...props} />
                    </TabPanel>
                    <TabPanel value={value} index={"/other/export"}>
                        Test
                    </TabPanel>
                    <TabPanel value={value} index={"/other/import"}>
                        Test
                    </TabPanel>
                </Paper>
            </BaseContent>
        </Base>
    );
};

export default OtherView;
