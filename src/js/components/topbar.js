import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import AppBar from "@material-ui/core/AppBar";
import Container from "@material-ui/core/Container";
import Divider from "@material-ui/core/Divider";
import Hidden from "@material-ui/core/Hidden";
import IconButton from "@material-ui/core/IconButton";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import MenuIcon from "@material-ui/icons/Menu";
import AccountCircleIcon from "@material-ui/icons/AccountCircle";
import StorageIcon from '@material-ui/icons/Storage';
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
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import AddIcon from '@material-ui/icons/Add';
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import { Link } from "react-router-dom";

import FrameControls from "./frame-controls";

import store from "../services/store";
import user from "../services/user";
import offlineCache from "../services/offline-cache";
import datastoreService from "../services/datastore";
import DialogGoOffline from "./dialogs/go-offline";
import CreateDatastoresDialog from "../views/other/create-datastores-dialog";

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
        padding: "8px",
    },
    signInText: {
        marginRight: "10px",
        display: "inline",
    },
}));

const Topbar = (props) => {
    const { mobileOpen, setMobileOpen } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [anchorTopMenuEl, setAnchorTopMenuEl] = React.useState(null);
    const [anchorDatastoreMenuEl, setAnchorDatastoreMenuEl] = React.useState(null);
    const [goOfflineOpen, setGoOfflineOpen] = React.useState(false);
    const [createDatastoreOpen, setCreateDatastoreOpen] = React.useState(false);
    const [datastores, setDatastores] = React.useState([]);


    let isSubscribed = true;
    React.useEffect(() => {
        reloadDatastoreOverview();
        return () => (isSubscribed = false);
    }, []);

    const reloadDatastoreOverview = () => {

        datastoreService.getDatastoreOverview().then(function (overview) {
            if (!isSubscribed) {
                return
            }
            const newDatastores=[];
            for (let i = 0; i < overview.datastores.length; i++) {
                if (overview.datastores[i]['type'] === 'password') {
                    newDatastores.push(overview.datastores[i]);
                }
            }
            setDatastores(newDatastores);

        });
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const openTopMenu = (event) => {
        setAnchorTopMenuEl(event.currentTarget);
    };
    const closeTopMenu = () => {
        setAnchorTopMenuEl(null);
    };

    const openDatastoreMenu = (event) => {
        setAnchorDatastoreMenuEl(event.currentTarget);
    };
    const closeDatastoreMenu = () => {
        setAnchorDatastoreMenuEl(null);
    };

    const onCreateDatastore = (rowData) => {
        setCreateDatastoreOpen(true);
        closeDatastoreMenu();
    };

    const onDatastoreSwitchClick = (datastore) => {
        closeDatastoreMenu();
        datastoreService.saveDatastoreMeta(datastore.id, datastore.description, true).then(function (result) {
            reloadDatastoreOverview();
        })
    };

    const goOffline = () => {
        setGoOfflineOpen(true);
    };
    const goOnline = () => {
        offlineCache.disable();
        offlineCache.clear();
    };
    const logout = async () => {
        const logoutResponse = await user.logout(undefined, window.location.origin);
        if (logoutResponse.hasOwnProperty('redirect_url')) {
            window.location.href = logoutResponse['redirect_url'];
        } else {
            window.location.href = 'logout-success.html';
        }
    };

    return (
        <AppBar position="fixed" className={classes.appBar}>
            <FrameControls />
            <Container maxWidth="lg">
                <Toolbar
                    disableGutters={true}
                >
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        className={classes.menuButton}
                    >
                        <MenuIcon />
                    </IconButton>
                    <a className={classes.topLogo} href="index.html">
                        <img alt="Psono" src="img/logo-inverse.png" height="100%" />
                    </a>
                    <div style={{ width: "100%" }}>
                        {datastores && datastores.length > 1 && (<div style={{float: "left"}}>
                            <Hidden smUp>
                                <IconButton
                                    variant="contained"
                                    onClick={openDatastoreMenu}
                                    color="primary"
                                    className={classes.topMenuButton}
                                >
                                    <StorageIcon/>
                                </IconButton>
                            </Hidden>
                            <Hidden xsDown>
                                <Button
                                    variant="contained"
                                    aria-controls="datastore-menu"
                                    aria-haspopup="true"
                                    onClick={openDatastoreMenu}
                                    color="primary"
                                    disableElevation
                                    className={classes.topMenuButton}
                                    endIcon={<ExpandMoreIcon/>}
                                >
                                    {t("DATASTORE")}
                                </Button>
                            </Hidden>
                            <Menu
                                id="datastore-menu"
                                anchorEl={anchorDatastoreMenuEl}
                                keepMounted
                                open={Boolean(anchorDatastoreMenuEl)}
                                onClose={closeDatastoreMenu}
                                anchorOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                }}
                                transformOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right",
                                }}
                            >
                                {datastores.map((datastore, index) => {
                                    return (
                                        <MenuItem onClick={() => {onDatastoreSwitchClick(datastore)}} key={index}>
                                            <ListItemIcon className={classes.listItemIcon}>
                                                {datastore.is_default ? (<CheckBoxIcon className={classes.icon}/>) : (
                                                    <CheckBoxOutlineBlankIcon className={classes.icon}/>)}

                                            </ListItemIcon>
                                            <Typography variant="body2">{datastore.description}</Typography>
                                        </MenuItem>
                                    );
                                })}
                                {!offlineCache.isActive() && (
                                    [
                                        <Divider key={'divider'}/>,
                                        <MenuItem onClick={onCreateDatastore} key={'create-datastore'}>
                                            <ListItemIcon className={classes.listItemIcon}>
                                                <AddIcon className={classes.icon}/>
                                            </ListItemIcon>
                                            <Typography variant="body2">{t("CREATE_NEW_DATASTORE")}</Typography>
                                        </MenuItem>]
                                )}
                            </Menu>
                        </div>)}
                        <div style={{ float: "right" }}>
                            <Hidden mdUp>
                                <IconButton
                                    variant="contained"
                                    onClick={openTopMenu}
                                    color="primary"
                                    className={classes.topMenuButton}
                                >
                                    <AccountCircleIcon />
                                </IconButton>
                            </Hidden>
                            <Hidden smDown>
                                <div className={classes.signInText}>{t("SIGNED_IN_AS")}</div>
                                <Button
                                    variant="contained"
                                    aria-controls="top-menu"
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
                                id="top-menu"
                                anchorEl={anchorTopMenuEl}
                                keepMounted
                                open={Boolean(anchorTopMenuEl)}
                                onClose={closeTopMenu}
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right",
                                }}
                                transformOrigin={{
                                    vertical: "top",
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
            {goOfflineOpen && <DialogGoOffline open={goOfflineOpen} onClose={() => setGoOfflineOpen(false)} />}
            {createDatastoreOpen && <CreateDatastoresDialog {...props} open={createDatastoreOpen} onClose={() => {
                setCreateDatastoreOpen(false);
                reloadDatastoreOverview();
            }} />}
        </AppBar>
    );
};

Topbar.propTypes = {
    mobileOpen: PropTypes.bool.isRequired,
    setMobileOpen: PropTypes.func.isRequired,
};

export default Topbar;
