import React from "react";
import { differenceInSeconds } from "date-fns";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Drawer from "@mui/material/Drawer";
import Hidden from "@mui/material/Hidden";
import HomeIcon from "@mui/icons-material/Home";
import ShareIcon from "@mui/icons-material/Share";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import LinkIcon from "@mui/icons-material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useTheme } from "@mui/material/styles";
import { makeStyles } from '@mui/styles';
import Badge from "@mui/material/Badge";
import ListSubheader from "@mui/material/ListSubheader";

import FontAwesome from "react-fontawesome";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";

import RuleIcon from "./icons/Rule";
import browserClient from "../services/browser-client";
import deviceService from "../services/device";

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
    drawer: {
        [theme.breakpoints.up("sm")]: {
            width: drawerWidth,
            flexShrink: 0,
        },
        backgroundColor: "#151f2b",
    },
    // necessary for content to be below app bar
    toolbar: {
        minHeight: deviceService.hasTitlebar() ? "82px" : "50px",
    },
    drawerPaper: {
        width: drawerWidth,
        backgroundColor: "#151f2b",
        color: "#b1b6c1",
    },
    listItemRootActive: {
        "&:hover": {
            backgroundColor: "#fff",
            color: "#151f2b",
        },
        "&.Mui-selected": {
            backgroundColor: theme.palette.primary.main,
            color: "#fff",
            "& .MuiListItemIcon-root": {
                color: "#fff",
            },
        },
    },
    listItemRoot: {
        "&:hover": {
            backgroundColor: "#fff",
            color: "#151f2b",
            "& .MuiListItemIcon-root": {
                color: "#151f2b",
            },
        },
        "&.Mui-selected": {
            backgroundColor: theme.palette.primary.main,
            color: "#fff",
            "& .MuiListItemIcon-root": {
                color: "#fff",
            },
        },
    },
    listItemText: {
        fontSize: "0.875rem",
        "& .MuiBadge-badge": {
            fontSize: "0.75rem",
            height: "15px",
            minWidth: "15px",
            color: "#fff",
            backgroundColor: "#777",
            right: "-8px",
        },
    },
    listItemIcon: {
        color: "#b1b6c1",
        minWidth: theme.spacing(4),
    },
    listItemIconSelected: {
        color: "#fff",
        minWidth: theme.spacing(4),
    },
    icon: {
        fontSize: "18px",
    },
    subHeader: {
        color: "#b1b6c1",
        backgroundColor: 'transparent',
    },
    version: {
        color: "#444851",
        margin: "10px",
        position: "absolute",
        bottom: "0",
        fontSize: "14px",
    },
}));

const Sidebar = (props) => {
    const { t } = useTranslation();
    const { mobileOpen, setMobileOpen } = props;
    const serverStatus = useSelector((state) => state.server.status);
    const offlineMode = useSelector((state) => state.client.offlineMode);
    const recurrenceInterval = useSelector((state) => state.server.complianceCentralSecurityReportsRecurrenceInterval);
    const disableCentralSecurityReports = useSelector((state) => state.server.disableCentralSecurityReports);
    const classes = useStyles();
    const theme = useTheme();
    const [moreLinks, setMoreLinks] = React.useState([]);
    const [version, setVersion] = React.useState("");
    let location = useLocation();

    React.useEffect(() => {
        browserClient.getConfig().then(onNewConfigLoaded);

        browserClient.loadVersion().then(function (version) {
            setVersion(version);
        });
    }, []);

    const onNewConfigLoaded = (configJson) => {
        setMoreLinks(configJson.more_links);
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const isSelected = (regexMatch) => {
        return regexMatch.test(location.pathname);
    };

    let newSecurityReport = "NOT_REQUIRED";
    if (recurrenceInterval > 0 && !disableCentralSecurityReports) {
        if (
            serverStatus.hasOwnProperty("data") &&
            serverStatus.data.hasOwnProperty("last_security_report_created") &&
            serverStatus.data.last_security_report_created !== null
        ) {
            const lastSecurityReportAgeSeconds = differenceInSeconds(
                new Date(),
                new Date(serverStatus.data.last_security_report_created)
            );
            if (lastSecurityReportAgeSeconds > recurrenceInterval) {
                newSecurityReport = "REQUIRED";
            }
        } else {
            newSecurityReport = "REQUIRED";
        }
    }

    const drawer = (
        <div>
            <Hidden smDown>
                <div className={classes.toolbar} />
            </Hidden>
            <List>
                <ListSubheader className={classes.subHeader}>{t("NAVIGATION")}</ListSubheader>
                <ListItem
                    button
                    component={Link}
                    to="/"
                    classes={{ root: isSelected(/^\/$/) ? classes.listItemRootActive : classes.listItemRoot }}
                    selected={isSelected(/^\/$/)}
                >
                    <ListItemIcon
                        className={`${isSelected(/^\/$/) ? classes.listItemIconSelected : classes.listItemIcon}`}
                    >
                        <HomeIcon className={classes.icon} />
                    </ListItemIcon>
                    <ListItemText classes={{ primary: classes.listItemText }} primary={t("HOME")} />
                </ListItem>
                {!offlineMode && (
                    <ListItem
                        button
                        component={Link}
                        to="/share/pendingshares"
                        classes={{
                            root: isSelected(/^\/share\/pendingshares$/)
                                ? classes.listItemRootActive
                                : classes.listItemRoot,
                        }}
                        selected={isSelected(/^\/share\/pendingshares$/)}
                    >
                        <ListItemIcon
                            className={`${
                                isSelected(/^\/share\/pendingshares$/)
                                    ? classes.listItemIconSelected
                                    : classes.listItemIcon
                            }`}
                        >
                            <ShareIcon className={classes.icon} />
                        </ListItemIcon>
                        <ListItemText
                            classes={{ primary: classes.listItemText }}
                            primary={
                                <Badge badgeContent={serverStatus.data ? serverStatus.data.unaccepted_shares_count : 0}>
                                    {t("PENDING_REQUESTS")}
                                </Badge>
                            }
                        />
                    </ListItem>
                )}
                {!offlineMode && (
                    <ListItem
                        button
                        component={Link}
                        to="/share/users"
                        classes={{
                            root: isSelected(/^\/share\/users$/) ? classes.listItemRootActive : classes.listItemRoot,
                        }}
                        selected={isSelected(/^\/share\/users$/)}
                    >
                        <ListItemIcon
                            className={`${
                                isSelected(/^\/share\/users$/) ? classes.listItemIconSelected : classes.listItemIcon
                            }`}
                        >
                            <PersonIcon className={classes.icon} />
                        </ListItemIcon>
                        <ListItemText classes={{ primary: classes.listItemText }} primary={t("TRUSTED_USERS")} />
                    </ListItem>
                )}
                {!offlineMode && (
                    <ListItem
                        button
                        component={Link}
                        to="/groups"
                        classes={{ root: isSelected(/^\/groups$/) ? classes.listItemRootActive : classes.listItemRoot }}
                        selected={isSelected(/^\/groups$/)}
                    >
                        <ListItemIcon
                            className={`${
                                isSelected(/^\/groups$/) ? classes.listItemIconSelected : classes.listItemIcon
                            }`}
                        >
                            <GroupIcon className={classes.icon} />
                        </ListItemIcon>
                        <ListItemText
                            classes={{ primary: classes.listItemText }}
                            primary={
                                <Badge badgeContent={serverStatus.data ? serverStatus.data.unaccepted_groups_count : 0}>
                                    {t("GROUPS")}
                                </Badge>
                            }
                        />
                    </ListItem>
                )}
                {!offlineMode && (
                    <ListItem
                        button
                        component={Link}
                        to="/security-report"
                        classes={{
                            root: isSelected(/^\/security-report$/) ? classes.listItemRootActive : classes.listItemRoot,
                        }}
                        selected={isSelected(/^\/security-report$/)}
                    >
                        <ListItemIcon
                            className={`${
                                isSelected(/^\/security-report$/) ? classes.listItemIconSelected : classes.listItemIcon
                            }`}
                        >
                            <RuleIcon className={classes.icon} />
                        </ListItemIcon>
                        <ListItemText
                            classes={{ primary: classes.listItemText }}
                            primary={
                                <Badge badgeContent={newSecurityReport === "REQUIRED" ? "!" : 0}>
                                    {t("SECURITY_REPORT")}
                                </Badge>
                            }
                        />
                    </ListItem>
                )}
                {!offlineMode && (
                    <ListItem
                        button
                        component={Link}
                        to="/active-link-shares"
                        classes={{
                            root: isSelected(/^\/active-link-shares/)
                                ? classes.listItemRootActive
                                : classes.listItemRoot,
                        }}
                        selected={isSelected(/^\/active-link-shares$/)}
                    >
                        <ListItemIcon
                            className={`${
                                isSelected(/^\/active-link-shares$/)
                                    ? classes.listItemIconSelected
                                    : classes.listItemIcon
                            }`}
                        >
                            <LinkIcon className={classes.icon} />
                        </ListItemIcon>
                        <ListItemText classes={{ primary: classes.listItemText }} primary={t("ACTIVE_LINK_SHARES")} />
                    </ListItem>
                )}
            </List>
            {moreLinks && moreLinks.length > 0 && (
                <>
                    <ListSubheader className={classes.subHeader}>{t("MORE")}</ListSubheader>
                    <List>
                        {moreLinks.map((link, index) => (
                            <ListItem
                                button
                                key={index}
                                component="a"
                                href={link.href}
                                classes={{ root: classes.listItemRoot }}
                            >
                                <ListItemIcon className={classes.listItemIcon}>
                                    {link.class && (<FontAwesome name={link.class.slice(3)}/>)}
                                </ListItemIcon>
                                <ListItemText classes={{ primary: classes.listItemText }} primary={t(link.title)} />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
            <div className={classes.version}>PSONO: {version}</div>
        </div>
    );

    return (
        <nav className={classes.drawer} aria-label="mailbox folders">
            <Hidden smUp>
                <Drawer
                    variant="temporary"
                    anchor={theme.direction === "rtl" ? "right" : "left"}
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    classes={{
                        paper: classes.drawerPaper,
                    }}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                >
                    {drawer}
                </Drawer>
            </Hidden>
            <Hidden smDown>
                <Drawer
                    classes={{
                        paper: classes.drawerPaper,
                    }}
                    variant="permanent"
                    open
                >
                    {drawer}
                </Drawer>
            </Hidden>
        </nav>
    );
};

Sidebar.propTypes = {
    mobileOpen: PropTypes.bool.isRequired,
    setMobileOpen: PropTypes.func.isRequired,
};

export default Sidebar;
