import React from "react";
import { differenceInSeconds } from "date-fns";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Drawer from "@material-ui/core/Drawer";
import Hidden from "@material-ui/core/Hidden";
import HomeIcon from "@material-ui/icons/Home";
import ShareIcon from "@material-ui/icons/Share";
import PersonIcon from "@material-ui/icons/Person";
import GroupIcon from "@material-ui/icons/Group";
import AssignmentIcon from "@material-ui/icons/Assignment";
import LinkIcon from "@material-ui/icons/Link";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Badge from "@material-ui/core/Badge";
import ListSubheader from "@material-ui/core/ListSubheader";

import FontAwesome from "react-fontawesome";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";

import browserClient from "../services/browser-client";

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
        minHeight: "50px",
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
            backgroundColor: "#2dbb93",
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
            backgroundColor: "#2dbb93",
            color: "#fff",
            "& .MuiListItemIcon-root": {
                color: "#fff",
            },
        },
    },
    listItemText: {
        fontSize: "14px",
        "& .MuiBadge-badge": {
            fontSize: "0.50rem",
            height: "15px",
            minWidth: "15px",
            color: "#fff",
            backgroundColor: "#777",
            right: "-8px",
        },
    },
    listItemIcon: {
        color: "#b1b6c1",
        minWidth: "36px",
    },
    listItemIconSelected: {
        color: "#fff",
        minWidth: "36px",
    },
    icon: {
        fontSize: "18px",
    },
    subHeader: {
        color: "#b1b6c1",
    },
    version: {
        color: "#444851",
        margin: "10px",
        position: "absolute",
        bottom: "0",
    },
}));

const Sidebar = (props) => {
    const { t } = useTranslation();
    const { mobileOpen, setMobileOpen } = props;
    const serverStatus = useSelector((state) => state.server.status);
    const recurrenceInterval = useSelector((state) => state.server.complianceCentralSecurityReportsRecurrenceInterval);
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
    if (recurrenceInterval > 0) {
        if (
            serverStatus.hasOwnProperty("data") &&
            serverStatus.data.hasOwnProperty("last_security_report_created") &&
            serverStatus.data.last_security_report_created !== null
        ) {
            const lastSecurityReportAgeSeconds = differenceInSeconds(new Date(), new Date(serverStatus.data.last_security_report_created));
            if (lastSecurityReportAgeSeconds > recurrenceInterval) {
                newSecurityReport = "REQUIRED";
            }
        } else {
            newSecurityReport = "REQUIRED";
        }
    }

    const drawer = (
        <div>
            <Hidden xsDown>
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
                    <ListItemIcon className={`${isSelected(/^\/$/) ? classes.listItemIconSelected : classes.listItemIcon}`}>
                        <HomeIcon className={classes.icon} />
                    </ListItemIcon>
                    <ListItemText classes={{ primary: classes.listItemText }} primary={t("HOME")} />
                </ListItem>
                <ListItem
                    button
                    component={Link}
                    to="/share/pendingshares"
                    classes={{ root: isSelected(/^\/share\/pendingshares$/) ? classes.listItemRootActive : classes.listItemRoot }}
                    selected={isSelected(/^\/share\/pendingshares$/)}
                >
                    <ListItemIcon className={`${isSelected(/^\/share\/pendingshares$/) ? classes.listItemIconSelected : classes.listItemIcon}`}>
                        <ShareIcon className={classes.icon} />
                    </ListItemIcon>
                    <ListItemText
                        classes={{ primary: classes.listItemText }}
                        primary={<Badge badgeContent={serverStatus.data ? serverStatus.data.unaccepted_shares_count : 0}>{t("PENDING_REQUESTS")}</Badge>}
                    />
                </ListItem>
                <ListItem
                    button
                    component={Link}
                    to="/share/users"
                    classes={{ root: isSelected(/^\/share\/users$/) ? classes.listItemRootActive : classes.listItemRoot }}
                    selected={isSelected(/^\/share\/users$/)}
                >
                    <ListItemIcon className={`${isSelected(/^\/share\/users$/) ? classes.listItemIconSelected : classes.listItemIcon}`}>
                        <PersonIcon className={classes.icon} />
                    </ListItemIcon>
                    <ListItemText classes={{ primary: classes.listItemText }} primary={t("TRUSTED_USERS")} />
                </ListItem>
                <ListItem
                    button
                    component={Link}
                    to="/groups"
                    classes={{ root: isSelected(/^\/groups$/) ? classes.listItemRootActive : classes.listItemRoot }}
                    selected={isSelected(/^\/groups$/)}
                >
                    <ListItemIcon className={`${isSelected(/^\/groups$/) ? classes.listItemIconSelected : classes.listItemIcon}`}>
                        <GroupIcon className={classes.icon} />
                    </ListItemIcon>
                    <ListItemText
                        classes={{ primary: classes.listItemText }}
                        primary={<Badge badgeContent={serverStatus.data ? serverStatus.data.unaccepted_groups_count : 0}>{t("GROUPS")}</Badge>}
                    />
                </ListItem>
                <ListItem
                    button
                    component={Link}
                    to="/security-report"
                    classes={{ root: isSelected(/^\/security-report$/) ? classes.listItemRootActive : classes.listItemRoot }}
                    selected={isSelected(/^\/security-report$/)}
                >
                    <ListItemIcon className={`${isSelected(/^\/security-report$/) ? classes.listItemIconSelected : classes.listItemIcon}`}>
                        <AssignmentIcon className={classes.icon} />
                    </ListItemIcon>
                    <ListItemText
                        classes={{ primary: classes.listItemText }}
                        primary={<Badge badgeContent={newSecurityReport === "REQUIRED" ? "!" : 0}>{t("SECURITY_REPORT")}</Badge>}
                    />
                </ListItem>
                <ListItem
                    button
                    component={Link}
                    to="/active-link-shares"
                    classes={{ root: isSelected(/^\/active-link-shares/) ? classes.listItemRootActive : classes.listItemRoot }}
                    selected={isSelected(/^\/active-link-shares$/)}
                >
                    <ListItemIcon className={`${isSelected(/^\/active-link-shares$/) ? classes.listItemIconSelected : classes.listItemIcon}`}>
                        <LinkIcon className={classes.icon} />
                    </ListItemIcon>
                    <ListItemText classes={{ primary: classes.listItemText }} primary={t("ACTIVE_LINK_SHARES")} />
                </ListItem>
            </List>
            {moreLinks && (
                <>
                    <ListSubheader className={classes.subHeader}>{t("MORE")}</ListSubheader>
                    <List>
                        {moreLinks.map((link, index) => (
                            <ListItem button key={index} component="a" href={link.href} classes={{ root: classes.listItemRoot }}>
                                <ListItemIcon className={classes.listItemIcon}>
                                    <FontAwesome name={link.class.slice(3)} />
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
            <Hidden xsDown>
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
