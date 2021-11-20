import React from "react";
import PropTypes from "prop-types";
import AppBar from "@material-ui/core/AppBar";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { Link, useLocation } from "react-router-dom";
import { compose } from "redux";
import { useTranslation } from "react-i18next";

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
import SettingsPasswordGeneratorView from "./password-generator";
import SettingsNotificationView from "./notification";
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

const SettingsView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
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
                                label={t("LANGUAGE")}
                                value="/settings/language"
                                component={Link}
                                to={"/settings/language"}
                                onClick={() => setValue("/settings/language")}
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
                    <TabPanel value={value} index={"/settings/language"}>
                        Test
                    </TabPanel>
                    <TabPanel value={value} index={"/settings/notification"}>
                        <SettingsNotificationView {...props} />
                    </TabPanel>
                    <TabPanel value={value} index={"/settings/gpg"}>
                        Test
                    </TabPanel>
                    <TabPanel value={value} index={"/settings/general"}>
                        Test
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
export default connect(mapStateToProps, mapDispatchToProps)(SettingsView);
