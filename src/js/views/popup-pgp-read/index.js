import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import CssBaseline from "@mui/material/CssBaseline";
import { makeStyles } from '@mui/styles';
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Button from "@mui/material/Button";
import AppBar from "@mui/material/AppBar";
import user from "../../services/user";
import Paper from "@mui/material/Paper";
import GridContainerErrors from "../../components/grid-container-errors";
import { Grid } from "@mui/material";
import browserClient from "../../services/browser-client";
import { useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import offlineCacheService from "../../services/offline-cache";
import DialogUnlockOfflineCache from "../../components/dialogs/unlock-offline-cache";
import deviceService from "../../services/device";
import ConfigLogo from "../../components/config-logo";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
    },
    contentRoot: {
        display: "flex",
        padding: "15px",
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
        [theme.breakpoints.up("sm")]: {
            width: `calc(100% - 0px)`,
            marginLeft: 0,
        },
        backgroundColor: theme.palette.lightBackground.main,
        color: "#777",
        borderColor: "rgb(231, 231, 231)",
        borderStyle: "solid",
        borderWidth: "1px",
        boxShadow: "none",
    },
    // necessary for content to be below app bar
    toolbar: {
        minHeight: deviceService.hasTitlebar() ? "82px" : "50px",
    },
    fullContent: {
        flexGrow: 1,
    },
    content: {
        height: "100%",
        width: "100%",
        overflow: "auto",
        position: "absolute",
        padding: "15px",
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
    topMenuButton: {
        textTransform: "none",
    },
}));

const PopupPgpReadView = (props) => {
    let { gpgMessageId } = useParams();
    const classes = useStyles();
    const { t } = useTranslation();
    const [decryptedMessage, setDecryptedMessage] = useState("");
    const [unlockOfflineCache, setUnlockOfflineCache] = useState(false);
    const [decrypting, setDecrypting] = useState(true);
    const [sender, setSender] = useState(null);
    const [errors, setErrors] = useState([]);

    let isSubscribed = true;
    React.useEffect(() => {
        if (offlineCacheService.isActive() && offlineCacheService.isLocked()) {
            setUnlockOfflineCache(true);
        } else {
            readGpg();
        }

        // cancel subscription to useEffect
        return () => (isSubscribed = false);
    }, []);

    const readGpg = () => {
        browserClient.emitSec("read-gpg", gpgMessageId, function (data) {
            if (!isSubscribed) {
                return;
            }
            if (data.hasOwnProperty("plaintext")) {
                setDecrypting(false);
                setDecryptedMessage(data.plaintext.data);
                setSender(data.sender);
            } else {
                setDecrypting(false);
                setDecryptedMessage(data.message);
                setSender(data.sender);
            }
        });
    };

    const onUnlockOfflineCacheClosed = () => {
        setUnlockOfflineCache(false);
        if (offlineCacheService.isActive() && offlineCacheService.isLocked()) {
            setUnlockOfflineCache(true);
        } else {
            readGpg();
        }
    };

    const logout = () => {
        user.logout();
    };

    return (
        <div className={classes.root}>
            <CssBaseline />
            <AppBar position="fixed" className={classes.appBar}>
                <Container maxWidth="lg">
                    <Toolbar
                    >
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            className={classes.menuButton}
                            size="large">
                            <MenuIcon />
                        </IconButton>
                        <a className={classes.topLogo} href="#">
                            <ConfigLogo configKey={'logo_inverse'} defaultLogo={'img/logo-inverse.png'} height="100%" />
                        </a>
                        <div style={{ width: "100%" }}>
                            <div style={{ float: "right" }}>
                                <Button
                                    variant="contained"
                                    aria-controls="simple-menu"
                                    aria-haspopup="true"
                                    onClick={logout}
                                    color="primary"
                                    disableElevation
                                    className={classes.topMenuButton}
                                >
                                    {t("LOGOUT")}
                                </Button>
                            </div>
                        </div>
                    </Toolbar>
                </Container>
            </AppBar>
            <div className={classes.fullContent}>
                <div className={classes.toolbar} />
                <div className={classes.content}>
                    <Paper square>
                        <AppBar elevation={0} position="static" color="default">
                            <Toolbar
                            >{t("DECRYPTED_MESSAGE")}</Toolbar>
                        </AppBar>
                        <div className={classes.contentRoot}>
                            <Grid container>
                                <GridContainerErrors errors={errors} setErrors={setErrors} />
                                <Grid
                                    item
                                    xs={12}
                                    sm={12}
                                    md={12}
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(decryptedMessage, { USE_PROFILES: { html: true } }),
                                    }}
                                />
                            </Grid>
                        </div>
                    </Paper>
                </div>
            </div>
            {unlockOfflineCache && (
                <DialogUnlockOfflineCache open={unlockOfflineCache} onClose={onUnlockOfflineCacheClosed} />
            )}
        </div>
    );
};

export default PopupPgpReadView;
