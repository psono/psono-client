import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import actionCreators from "../actions/action-creators";
import PropTypes from "prop-types";
import { compose } from "redux";
import { withTranslation } from "react-i18next";
import AppBar from "@material-ui/core/AppBar";
import Container from "@material-ui/core/Container";
import Divider from "@material-ui/core/Divider";
import Hidden from "@material-ui/core/Hidden";
import IconButton from "@material-ui/core/IconButton";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import MenuIcon from "@material-ui/icons/Menu";
import AccountCircleIcon from "@material-ui/icons/AccountCircle";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import AccountTreeIcon from "@material-ui/icons/AccountTree";
import SettingsIcon from "@material-ui/icons/Settings";
import AirplanemodeActiveIcon from "@material-ui/icons/AirplanemodeActive";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import TuneIcon from "@material-ui/icons/Tune";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import { Link } from "react-router-dom";

import store from "../services/store";
import user from "../services/user";
import offlineCache from "../services/offline-cache";

const useStyles = makeStyles((theme) => ({
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
        [theme.breakpoints.up("sm")]: {
            width: `calc(100% - 0px)`,
            marginLeft: 0,
        },
        backgroundColor: "#fff",
        color: "#777",
        borderColor: "rgb(231, 231, 231)",
        borderStyle: "solid",
        borderWidth: "1px",
        boxShadow: "none",
    },
    topLogo: {
        padding: "10px",
        height: "100%",
    },
    menuButton: {
        marginRight: theme.spacing(2),
        [theme.breakpoints.up("sm")]: {
            display: "none",
        },
    },
    listItemIcon: {
        minWidth: theme.spacing(4),
    },
    icon: {
        fontSize: "18px",
    },
    topMenuButton: {
        textTransform: "none",
    },
}));

const Topbar = (props) => {
    const { t, mobileOpen, setMobileOpen } = props;
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const openTopMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const closeTopMenu = () => {
        setAnchorEl(null);
    };
    const goOffline = () => {
        // TODO implement
        console.log("GO OFFLINE!");
    };
    const goOnline = () => {
        // TODO implement
        console.log("GO Online!");
    };
    const logout = () => {
        user.logout();
    };

    return (
        <AppBar position="fixed" className={classes.appBar}>
            <Container maxWidth="lg">
                <Toolbar>
                    <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} className={classes.menuButton}>
                        <MenuIcon />
                    </IconButton>
                    <a className={classes.topLogo} href="#">
                        <img alt="Psono" src="img/logo-inverse.png" height="100%" />
                    </a>
                    <div style={{ width: "100%" }}>
                        <div style={{ float: "right" }}>
                            <Hidden smUp>
                                <IconButton variant="contained" onClick={openTopMenu} color="primary" className={classes.topMenuButton}>
                                    <AccountCircleIcon />
                                </IconButton>
                            </Hidden>
                            <Hidden xsDown>
                                <div className={"signintext"}>{t("SIGNED_IN_AS")}</div>
                                <Button
                                    variant="contained"
                                    aria-controls="simple-menu"
                                    aria-haspopup="true"
                                    onClick={openTopMenu}
                                    color="primary"
                                    disableElevation
                                    className={classes.topMenuButton}
                                    endIcon={<ExpandMoreIcon />}
                                >
                                    {store.getState().user.username}
                                </Button>
                            </Hidden>
                            <Menu
                                id="simple-menu"
                                anchorEl={anchorEl}
                                keepMounted
                                open={Boolean(anchorEl)}
                                onClose={closeTopMenu}
                                anchorOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                }}
                                transformOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right",
                                }}
                            >
                                {!offlineCache.isActive() && (
                                    <MenuItem component={Link} to="/account/overview">
                                        <ListItemIcon className={classes.listItemIcon}>
                                            <TuneIcon className={classes.icon} />
                                        </ListItemIcon>
                                        <Typography variant="body2">{t("ACCOUNT")}</Typography>
                                    </MenuItem>
                                )}
                                {!offlineCache.isActive() && (
                                    <MenuItem component={Link} to="/settings/password-generator">
                                        <ListItemIcon className={classes.listItemIcon}>
                                            <SettingsIcon className={classes.icon} />
                                        </ListItemIcon>
                                        <Typography variant="body2">{t("SETTINGS")}</Typography>
                                    </MenuItem>
                                )}
                                {!offlineCache.isActive() && (
                                    <MenuItem component={Link} to="/other/sessions">
                                        <ListItemIcon className={classes.listItemIcon}>
                                            <AccountTreeIcon className={classes.icon} />
                                        </ListItemIcon>
                                        <Typography variant="body2">{t("OTHER")}</Typography>
                                    </MenuItem>
                                )}
                                {!offlineCache.isActive() && !store.getState().server.complianceDisableOfflineMode && (
                                    <MenuItem onClick={goOffline}>
                                        <ListItemIcon className={classes.listItemIcon}>
                                            <AirplanemodeActiveIcon className={classes.icon} />
                                        </ListItemIcon>
                                        <Typography variant="body2">{t("GO_OFFLINE")}</Typography>
                                    </MenuItem>
                                )}
                                {offlineCache.isActive() && !store.getState().server.complianceDisableOfflineMode && (
                                    <MenuItem onClick={goOnline}>
                                        <ListItemIcon className={classes.listItemIcon}>
                                            <AirplanemodeActiveIcon className={classes.icon} />
                                        </ListItemIcon>
                                        <Typography variant="body2">{t("GO_ONLINE")}</Typography>
                                    </MenuItem>
                                )}
                                <Divider />
                                <MenuItem onClick={logout}>
                                    <ListItemIcon className={classes.listItemIcon}>
                                        <ExitToAppIcon className={classes.icon} />
                                    </ListItemIcon>
                                    <Typography variant="body2">{t("LOGOUT")}</Typography>
                                </MenuItem>
                            </Menu>
                        </div>
                    </div>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

Topbar.propTypes = {
    mobileOpen: PropTypes.bool.isRequired,
    setMobileOpen: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default compose(withTranslation(), connect(mapStateToProps, mapDispatchToProps))(Topbar);
