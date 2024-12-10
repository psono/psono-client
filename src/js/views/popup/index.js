import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { Checkbox, Divider, FormHelperText, Grid } from "@mui/material";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { makeStyles } from '@mui/styles';
import { Check } from "@mui/icons-material";
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import ClearIcon from "@mui/icons-material/Clear";
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import MuiAlert from '@mui/material/Alert'
import Badge from "@mui/material/Badge";
import SettingsIcon from "@mui/icons-material/Settings";
import Avatar from "@mui/material/Avatar";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import AddIcon from "@mui/icons-material/Add";

import action from "../../actions/bound-action-creators";
import DialogUnlockOfflineCache from "../../components/dialogs/unlock-offline-cache";
import ContentCopy from "../../components/icons/ContentCopy";
import DarkBox from "../../components/dark-box";
import DialogChangeAccount from "../../components/dialogs/change-account";
import browserClient from "../../services/browser-client";
import datastorePassword from "../../services/datastore-password";
import helper from "../../services/helper";
import offlineCacheService from "../../services/offline-cache";
import secretService from "../../services/secret";
import user from "../../services/user";
import widgetService from "../../services/widget";
import { getStore } from "../../services/store";
import datastoreService from "../../services/datastore";
import offlineCache from "../../services/offline-cache";
import CreateDatastoresDialog from "../other/create-datastores-dialog";
import accountService from "../../services/account";
import CssBaseline from "@mui/material/CssBaseline";

const useStyles = makeStyles((theme) => ({
    root: {
        color: theme.palette.lightGreyText.main,
    },
    textField: {
        width: "100%",
        "& .MuiInputBase-root": {
            color: theme.palette.lightGreyText.main,
        },
        "& .MuiInputAdornment-root .MuiTypography-colorTextSecondary": {
            color: theme.palette.greyText.main,
        },
        "& MuiFormControl-root": {
            color: theme.palette.lightGreyText.main,
        },
        "& label": {
            color: theme.palette.lightGreyText.main,
        },
        "& .MuiInput-underline:after": {
            borderBottomColor: "green",
        },
        "& .MuiOutlinedInput-root": {
            "& fieldset": {
                borderColor: theme.palette.greyText.main,
            },
        },
    },
    divider: {
        background: theme.palette.greyText.main,
        marginTop: "20px",
        marginBottom: "20px",
    },
    button: {
        color: theme.palette.lightGreyText.main,
        width: "100%",
        transition: "none",
        "& span": {
            justifyContent: "left",
        },
        "&:hover": {
            backgroundColor: theme.palette.lightBackground.main,
            color: theme.palette.blueBackground.main,
        },
    },
    navigation: {
        listStyleType: "none",
        padding: 0,
        margin: 0,
        overflow: "hidden",
        overflowY: "auto",
        height: "300px",
    },
    navigationItemLi: {
        position: "relative",
        marginTop: "1px",
        borderRadius: "4px",
        "& p": {
            color: theme.palette.lightGreyText.main,
        },
        "&:hover": {
            backgroundColor: theme.palette.lightBackground.main,
            color: theme.palette.blueBackground.main,
        },
        "&:hover a": {
            color: theme.palette.blueBackground.main,
        },
        "&:hover p": {
            color: theme.palette.blueBackground.main,
        },
        "& button span": {
            color: theme.palette.lightGreyText.main,
        },
        "&:hover button span": {
            color: theme.palette.blueBackground.main,
        },
    },
    navigationItemA: {
        textDecoration: "none",
        display: "inline-block",
        padding: "10px 100px 10px 10px",
        width: "100%",
    },
    navigationItemButtonGroup: {
        position: "absolute",
        right: "0px",
        top: "3px",
    },
    listItemIcon: {
        minWidth: theme.spacing(4),
    },
    icon: {
        fontSize: "18px",
    },
    checked: {
        color: theme.palette.checked.main,
    },
    checkedIcon: {
        width: "20px",
        height: "20px",
        border: `1px solid ${theme.palette.greyText.main}`,
        borderRadius: "3px",
    },
    uncheckedIcon: {
        width: "0px",
        height: "0px",
        padding: "9px",
        border: `1px solid ${theme.palette.greyText.main}`,
        borderRadius: "3px",
    },
    widePopper: {
        width: "max-content",
    },
    menuButton: {
        textTransform: "none",
        padding: "4px",
    },
    menuButtonSlim: {
        paddingTop: "4px",
        paddingBottom: "4px",
        paddingLeft: "0px",
        paddingRight: "0px",
        minWidth: "10px",
    },
    overlayIcon: {
        position: 'absolute',
        width: '0.6em',
        height: '0.6em',
        bottom: 4,
        right: 4,
        backgroundColor: theme.palette.background.paper,
        borderRadius: '50%',
        color: theme.palette.secondary.main,
        border: `1px solid ${theme.palette.background.paper}`,
    },
    overlayedIcon: {
        width: 25,
        height: 25,
        backgroundColor: '#999',
        marginLeft: '0px',
        marginRight: '0px',
        color: 'white',
    },
    description: {
        fontSize: '12px',
    },
    regularButtonText: {
        color: theme.palette.lightGreyText.main,
    },
}));

const PopupItem = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const { editItem, onItemClick, item } = props;
    const [anchorEl, setAnchorEl] = React.useState(null);

    const openMenu = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setAnchorEl(null);
    };

    const onCopyUsername = (event) => {
        secretService.copyUsername(item.content);
        handleClose(event);
    };

    const onCopyPassword = (event) => {
        secretService.copyPassword(item.content);
        handleClose(event);
    };

    const onCopyTotpToken = (event) => {
        secretService.copyTotpToken(item.content);
        handleClose(event);
    };

    const onCopyNoteContent = (event) => {
        secretService.copyNoteContent(item.content);
        handleClose(event);
    };

    const onCopyCreditCardNumber = (event) => {
        secretService.copyCreditCardNumber(item.content);
        handleClose(event);
    };

    const onCopyCreditCardName = (event) => {
        secretService.copyCreditCardName(item.content);
        handleClose(event);
    };

    const onCopyCreditCardExpiryDate = (event) => {
        secretService.copyCreditCardExpiryDate(item.content);
        handleClose(event);
    };

    const onCopyCreditCardCvc = (event) => {
        secretService.copyCreditCardCvc(item.content);
        handleClose(event);
    };

    const onCopyCreditCardPin = (event) => {
        secretService.copyCreditCardPin(item.content);
        handleClose(event);
    };

    const onCopyURL = (event) => {
        secretService.copyUrl(item.content);
        handleClose(event);
    };

    const onEditItem = (event) => {
        handleClose(event);
        editItem(item.content);
    };

    let title = item.content.name;
    let description = "";

    if (item.content.hasOwnProperty("description") && item.content.description && !item.content.name.toLowerCase().includes(item.content.description.toLowerCase())) {
        description = item.content.description;
    }

    return (
        <li className={classes.navigationItemLi}>
            <a href="#" className={classes.navigationItemA} onClick={onEditItem}>
                <i className={"fa-fw " + widgetService.itemIcon(item.content)} /> {title}
                {!!description && (<span className={classes.description}>&nbsp;({description})</span>)}
                <br />
                <Tooltip title={item.path} placement="top" PopperProps={{
                    disablePortal: true,
                }}>
                    <FormHelperText style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.path}
                    </FormHelperText>
                </Tooltip>
            </a>
            <ButtonGroup
                variant="text"
                aria-label="outlined button group"
                className={classes.navigationItemButtonGroup}
            >
                {["bookmark", "website_password", "elster_certificate"].indexOf(item.content.type) !== -1 && (
                    <Button
                        aria-label="open"
                        onClick={() => {
                            onItemClick(item.content);
                        }}
                    >
                        <OpenInNewIcon fontSize="small" className={classes.regularButtonText} />
                    </Button>
                )}
                {["application_password", "website_password", "credit_card"].indexOf(item.content.type) !== -1 && (
                    <Button aria-label="settings" onClick={openMenu}>
                        <ContentCopy fontSize="small" className={classes.regularButtonText} />
                    </Button>
                )}
                {["totp"].indexOf(item.content.type) !== -1 && (
                    <Tooltip title={t("COPY_TOTP_TOKEN")} placement="left" PopperProps={{
                        disablePortal: true,
                    }} classes={{
                        tooltip: classes.widePopper
                    }}>
                        <Button aria-label="settings" onClick={onCopyTotpToken}>
                            <ContentCopy fontSize="small" className={classes.regularButtonText} />
                        </Button>
                    </Tooltip>
                )}
                {["note"].indexOf(item.content.type) !== -1 && (
                    <Tooltip title={t("COPY_NOTE_CONTENT")} placement="left" PopperProps={{
                        disablePortal: true,
                    }} classes={{
                        tooltip: classes.widePopper
                    }}>
                        <Button aria-label="settings" onClick={onCopyNoteContent}>
                            <ContentCopy fontSize="small" className={classes.regularButtonText} />
                        </Button>
                    </Tooltip>
                )}
                {["bookmark"].indexOf(item.content.type) !== -1 && (
                    <Tooltip title={t("COPY_URL")} placement="left" PopperProps={{
                        disablePortal: true,
                    }} classes={{
                        tooltip: classes.widePopper
                    }}>
                        <Button aria-label="settings" onClick={onCopyURL}>
                            <ContentCopy fontSize="small" className={classes.regularButtonText} />
                        </Button>
                    </Tooltip>
                )}
            </ButtonGroup>
            {["application_password", "website_password", "credit_card"].indexOf(item.content.type) !== -1 && (
                <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
                    {["application_password", "website_password"].indexOf(item.content.type) !== -1 && ([
                        <MenuItem key="copy-username" onClick={onCopyUsername}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <ContentCopy className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("COPY_USERNAME")}
                            </Typography>
                        </MenuItem>,
                        <MenuItem key="copy-password" onClick={onCopyPassword}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <ContentCopy className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("COPY_PASSWORD")}
                            </Typography>
                        </MenuItem>,
                        item.content.type === "website_password" && (
                            <MenuItem key="copy-totp-token" onClick={onCopyTotpToken}>
                                <ListItemIcon className={classes.listItemIcon}>
                                    <ContentCopy className={classes.icon} fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" noWrap>
                                    {t("COPY_TOTP_TOKEN")}
                                </Typography>
                            </MenuItem>
                        )
                    ])}

                    {["credit_card"].indexOf(item.content.type) !== -1 && ([
                        <MenuItem key="copy-cc-number" onClick={onCopyCreditCardNumber}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <ContentCopy className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("COPY_CREDIT_CARD_NUMBER")}
                            </Typography>
                        </MenuItem>,
                        <MenuItem key="copy-cc-name" onClick={onCopyCreditCardName}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <ContentCopy className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("COPY_CREDIT_CARD_NAME")}
                            </Typography>
                        </MenuItem>,
                        <MenuItem key="copy-cc-expiry" onClick={onCopyCreditCardExpiryDate}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <ContentCopy className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("COPY_CREDIT_CARD_EXPIRATION_DATE")}
                            </Typography>
                        </MenuItem>,
                        <MenuItem key="copy-cc-cvc" onClick={onCopyCreditCardCvc}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <ContentCopy className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("COPY_CREDIT_CARD_CVC")}
                            </Typography>
                        </MenuItem>,
                        <MenuItem key="copy-cc-pin" onClick={onCopyCreditCardPin}>
                            <ListItemIcon className={classes.listItemIcon}>
                                <ContentCopy className={classes.icon} fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" noWrap>
                                {t("COPY_CREDIT_CARD_PIN")}
                            </Typography>
                        </MenuItem>
                    ])}
                </Menu>
            )}
        </li>
    );
};

PopupItem.propTypes = {
    editItem: PropTypes.func.isRequired,
    onItemClick: PropTypes.func.isRequired,
    item: PropTypes.object.isRequired,
};

const PopupView = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const passwordDatastore = useSelector((state) => state.user.userDatastoreOverview?.datastores?.find(datastore => datastore.type === 'password' && datastore.is_default))
    const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
    const hasTwoFactor = useSelector((state) => state.user.hasTwoFactor);
    const [unlockOfflineCache, setUnlockOfflineCache] = React.useState(false);
    const [view, setView] = React.useState("default");
    const [includeLettersLowercase, setIncludeLettersLowercase] = useState(true);
    const [includeLettersUppercase, setIncludeLettersUppercase] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSpecialChars, setIncludeSpecialChars] = useState(true);
    const settingsDatastore = useSelector((state) => state.settingsDatastore);
    const [passwordLength, setPasswordLength] = useState(settingsDatastore.passwordLength);
    const [passwordLettersUppercase, setPasswordLettersUppercase] = useState(
        settingsDatastore.passwordLettersUppercase
    );
    const [passwordLettersLowercase, setPasswordLettersLowercase] = useState(
        settingsDatastore.passwordLettersLowercase
    );
    const [passwordNumbers, setPasswordNumbers] = useState(settingsDatastore.passwordNumbers);
    const [passwordSpecialChars, setPasswordSpecialChars] = useState(settingsDatastore.passwordSpecialChars);
    const [password, setPassword] = React.useState("");
    const search = useSelector((state) => state.client.lastPopupSearch);
    const [items, setItems] = React.useState([]);
    let isSubscribed = true;
    const passwordFilter = helper.getPasswordFilter(search);
    const [url, setUrl] = React.useState();
    const [changeAccountOpen, setChangeAccountOpen] = React.useState(false);
    const [datastores, setDatastores] = React.useState([]);
    const [anchorDatastoreMenuEl, setAnchorDatastoreMenuEl] = React.useState(null);
    const [createDatastoreOpen, setCreateDatastoreOpen] = React.useState(false);


    useEffect(() => {
        if (offlineCacheService.isActive() && offlineCacheService.isLocked()) {
            setUnlockOfflineCache(true);
        } else {
            datastorePassword.getPasswordDatastore().then(onNewDatastoreLoaded);
        }
    }, [passwordDatastore]);

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

    const openDatastoreMenu = (event) => {
        setAnchorDatastoreMenuEl(event.currentTarget);
    };
    const closeDatastoreMenu = () => {
        setAnchorDatastoreMenuEl(null);
    };

    const openChangeAccount = (event) => {
        setChangeAccountOpen(true)
    };

    useHotkeys('alt+b', () => {
        // copy username
        if (itemsToDisplay.length > 0) {
            secretService.copyUsername(itemsToDisplay[0].content);
        }
    })

    useHotkeys('alt+c', () => {
        // copy password
        if (itemsToDisplay.length > 0) {
            secretService.copyPassword(itemsToDisplay[0].content);
        }
    })

    useHotkeys('alt+u', () => {
        // open url
        if (itemsToDisplay.length > 0) {
            secretService.onItemClick(itemsToDisplay[0].content);
        }
    })

    useHotkeys('alt+shift+u', () => {
        // copy url
        if (itemsToDisplay.length > 0) {
            secretService.copyUrl(itemsToDisplay[0].content);
        }
    })

    useHotkeys('alt+t', () => {
        // copy totp
        onCopyTotpToken();
    })

    const onCopyTotpToken = (event) => {
        if (itemsToDisplay.length > 0) {
            secretService.copyTotpToken(itemsToDisplay[0].content);
        }
    };

    useEffect(() => {
        if (offlineCacheService.isActive() && offlineCacheService.isLocked()) {
            setUnlockOfflineCache(true);
        } else {
            datastorePassword.getPasswordDatastore().then(onNewDatastoreLoaded);
        }

        browserClient.getActiveTabUrl().then((url) => {
            setUrl(helper.parseUrl(url));
        });

        reloadDatastoreOverview();
        return () => (isSubscribed = false);
    }, []);

    const onUnlockOfflineCacheClosed = () => {
        setUnlockOfflineCache(false);
        if (offlineCacheService.isActive() && offlineCacheService.isLocked()) {
            setUnlockOfflineCache(true);
        } else {
            datastorePassword.getPasswordDatastore().then(onNewDatastoreLoaded);
        }
    };

    const onNewDatastoreLoaded = (data) => {
        if (!isSubscribed) {
            return;
        }
        const entries = [];

        function deepSearchAllItems(folder, path) {
            let i;
            if (!folder) {
                return;
            }
            if (folder.hasOwnProperty("folders")) {
                for (i = 0; i < folder["folders"].length; i++) {
                    deepSearchAllItems(folder["folders"][i], path + folder["folders"][i].name + "/");
                }
            }

            if (folder.hasOwnProperty("items")) {
                for (i = 0; i < folder["items"].length; i++) {
                    entries.push({
                        content: folder["items"][i],
                        path: path,
                    });
                }
            }
        }

        deepSearchAllItems(data, "/");

        setItems(entries);
        accountService.broadcastReinitializeBackgroundEvent();
    };

    const logout = (event) => {
        browserClient.openTab("logout-success.html");
        browserClient.closePopup();
    };
    const back = (event) => {
        setView("default");
    };
    const openDatastore = (event) => {
        browserClient.openTab("index.html");
    };
    const copyToClipboard = (content) => {
        browserClient.copyToClipboard(() => Promise.resolve(content));
    };
    const generatePassword = (passwordLength, passwordLettersUppercase, passwordLettersLowercase, passwordNumbers, passwordSpecialChars) => {
        let password = datastorePassword.generate(passwordLength, passwordLettersUppercase, passwordLettersLowercase, passwordNumbers, passwordSpecialChars);
        copyToClipboard(password)
        setPassword(password);
    };
    const showGeneratePassword = (event) => {
        generatePassword(passwordLength, passwordLettersUppercase, passwordLettersLowercase, passwordNumbers, passwordSpecialChars)
        setView("generate_password")
    };
    const saveGeneratePassword = (event) => {
        browserClient.emitSec("save-password-active-tab", { password: password });
        browserClient.emitSec("fillpassword-active-tab", { password: password });
        browserClient.closePopup();
    };
    const bookmark = (event) => {
        browserClient.emitSec("bookmark-active-tab", {});
        browserClient.closePopup();
    };
    const clear = (event) => {
        action().setLastPopupSearch("");
    };
    const editItem = (item) => {
        browserClient.openTab("index.html#!/datastore/edit/" + item.type + "/" + item.secret_id);
    };
    const onItemClick = (item) => {
        secretService.onItemClick(item);
    };

    function filterBySearch(item) {
        if (!search) {
            // Hide all entries if we have not typed anything into the "search datastore..." field
            return false;
        }
        return passwordFilter(item.content);
    }

    if (isLoggedIn && !hasTwoFactor && user.requireTwoFaSetup()) {
        return (
            <DarkBox>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <MuiAlert
                            severity="info"
                            style={{
                                marginBottom: "5px",
                                marginTop: "5px",
                            }}
                        >
                            {t("ADMINISTRATOR_REQUIRES_SECOND_FACTOR")}
                        </MuiAlert>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Button
                            onClick={() => {
                                browserClient.openTab("enforce-two-fa.html");
                            }}
                            variant="contained"
                            color="primary"
                        >
                            {t("SETUP_SECOND_FACTOR")}
                        </Button>
                        <Button onClick={logout} variant="contained">
                            {t("LOGOUT")}
                        </Button>
                    </Grid>
                </Grid>
            </DarkBox>
        );
    } else if (isLoggedIn && user.requireServerSecretModification()) {

        return (
            <DarkBox>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <MuiAlert
                            severity="info"
                            style={{
                                marginBottom: "5px",
                                marginTop: "5px",
                            }}
                        >
                            {getStore().getState().user.serverSecretExists ? t("ADMINISTRATOR_REQUIRES_ACCOUNT_SWITCH_TO_CLIENT_SIDE_ENCRYPTION") : t("ADMINISTRATOR_REQUIRES_ACCOUNT_SWITCH_TO_SERVER_SIDE_ENCRYPTION")}
                        </MuiAlert>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Button
                            onClick={() => {
                                browserClient.openTab("key-transfer.html");
                            }}
                            variant="contained"
                            color="primary"
                        >
                            {t("CONFIGURE")}
                        </Button>
                        <Button onClick={logout} variant="contained">
                            {t("LOGOUT")}
                        </Button>
                    </Grid>
                </Grid>
            </DarkBox>
        );
    }

    if (view === 'generate_password') {
        return (
            <DarkBox>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="password"
                            label={t("PASSWORD")}
                            name="password"
                            autoComplete="off"
                            value={password}
                            onChange={(event) => {
                                setPassword(event.target.value);
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="generate"
                                            onClick={() => generatePassword(
                                                passwordLength,
                                                includeLettersUppercase ? passwordLettersUppercase : '',
                                                includeLettersLowercase ? passwordLettersLowercase : '',
                                                includeNumbers ? passwordNumbers : '',
                                                includeSpecialChars ? passwordSpecialChars : '',
                                            )}
                                            edge="end"
                                            className={classes.regularButtonText}
                                            size="large">
                                            <ReplayRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Divider classes={{ root: classes.divider }} />
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense" size="small"
                            id="passwordLength"
                            label={t("PASSWORD_LENGTH")}
                            name="passwordLength"
                            autoComplete="off"
                            value={passwordLength}
                            onChange={(event) => {
                                generatePassword(
                                    event.target.value,
                                    includeLettersUppercase ? passwordLettersUppercase : '',
                                    includeLettersLowercase ? passwordLettersLowercase : '',
                                    includeNumbers ? passwordNumbers : '',
                                    includeSpecialChars ? passwordSpecialChars : '',
                                )
                                setPasswordLength(event.target.value);
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Checkbox
                            checked={includeLettersUppercase}
                            onChange={(event) => {
                                generatePassword(
                                    passwordLength,
                                    event.target.checked ? passwordLettersUppercase : '',
                                    includeLettersLowercase ? passwordLettersLowercase : '',
                                    includeNumbers ? passwordNumbers : '',
                                    includeSpecialChars ? passwordSpecialChars : '',
                                )
                                setIncludeLettersUppercase(event.target.checked);
                            }}
                            checkedIcon={<Check className={classes.checkedIcon} />}
                            icon={<Check className={classes.uncheckedIcon} />}
                            classes={{
                                checked: classes.checked,
                            }}
                        />{" "}
                        {t("LETTERS_UPPERCASE")}
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Checkbox
                            checked={includeLettersLowercase}
                            onChange={(event) => {
                                generatePassword(
                                    passwordLength,
                                    includeLettersUppercase ? passwordLettersUppercase : '',
                                    event.target.checked ? passwordLettersLowercase : '',
                                    includeNumbers ? passwordNumbers : '',
                                    includeSpecialChars ? passwordSpecialChars : '',
                                )
                                setIncludeLettersLowercase(event.target.checked);
                            }}
                            checkedIcon={<Check className={classes.checkedIcon} />}
                            icon={<Check className={classes.uncheckedIcon} />}
                            classes={{
                                checked: classes.checked,
                            }}
                        />{" "}
                        {t("LETTERS_LOWERCASE")}
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Checkbox
                            checked={includeNumbers}
                            onChange={(event) => {
                                generatePassword(
                                    passwordLength,
                                    includeLettersUppercase ? passwordLettersUppercase : '',
                                    includeLettersLowercase ? passwordLettersLowercase : '',
                                    event.target.checked ? passwordNumbers : '',
                                    includeSpecialChars ? passwordSpecialChars : '',
                                )
                                setIncludeNumbers(event.target.checked);
                            }}
                            checkedIcon={<Check className={classes.checkedIcon} />}
                            icon={<Check className={classes.uncheckedIcon} />}
                            classes={{
                                checked: classes.checked,
                            }}
                        />{" "}
                        {t("NUMBERS")}
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Checkbox
                            checked={includeSpecialChars}
                            onChange={(event) => {
                                generatePassword(
                                    passwordLength,
                                    includeLettersUppercase ? passwordLettersUppercase : '',
                                    includeLettersLowercase ? passwordLettersLowercase : '',
                                    includeNumbers ? passwordNumbers : '',
                                    event.target.checked ? passwordSpecialChars : '',
                                )
                                setIncludeSpecialChars(event.target.checked);
                            }}
                            checkedIcon={<Check className={classes.checkedIcon} />}
                            icon={<Check className={classes.uncheckedIcon} />}
                            classes={{
                                checked: classes.checked,
                            }}
                        />{" "}
                        {t("SPECIAL_CHARS")}
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Divider classes={{ root: classes.divider }} />
                        <Button variant="contained" color="primary" onClick={saveGeneratePassword}>
                            {t("SAVE")}
                        </Button>
                        <Button className={classes.regularButtonText} onClick={back}>{t("BACK")}</Button>
                    </Grid>
                </Grid>
            </DarkBox>
        );
    }

    let itemsToDisplay = [];
    if (search) {
        itemsToDisplay = items.filter(filterBySearch).slice(0, 50);
    } else if (url) {
        const matching = [];
        const notMatching = [];
        items.map((item, _) => {
            if (item.content.hasOwnProperty("deleted") && item.content["deleted"]){
                return;
            }
            if (item.content.urlfilter &&
                item.content.urlfilter.split(/\s+|,|;/).some((filter) => helper.isUrlFilterMatch(url.authority, filter))) {
                matching.push(item);
            } else {
                notMatching.push(item);
            }
        });
        itemsToDisplay = matching.concat(notMatching).slice(0, 50);
    } else {
        itemsToDisplay = items.slice(0, 50);
    }

    return (
        <DarkBox>
            <Grid container>
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense" size="small"
                        id="search"
                        label={t("SEARCH_DATASTORE")}
                        name="search"
                        autoComplete="off"
                        autoFocus
                        onFocus={event => {
                            event.target.select();
                        }}
                        value={search}
                        onChange={(event) => {
                            action().setLastPopupSearch(event.target.value);
                        }}
                        InputProps={{
                            endAdornment: search && (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="clear search"
                                        onClick={clear}
                                        edge="end"
                                        className={classes.regularButtonText}
                                        size="large">
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Divider classes={{ root: classes.divider }} />
                </Grid>
                {itemsToDisplay.length > 0 && (
                    <Grid item xs={12} sm={12} md={12}>
                        <ul className={classes.navigation}>
                            {itemsToDisplay.map((item, i) => (
                                <PopupItem key={i} editItem={editItem} onItemClick={onItemClick} item={item} />
                            ))}
                        </ul>
                    </Grid>
                )}
                {itemsToDisplay.length === 0 && (
                    <Grid item xs={12} sm={12} md={12} className={classes.regularButtonText}>
                        {t("NO_ENTRY_FOUND")}
                    </Grid>
                )}
                <Grid item xs={12} sm={12} md={12}>
                    <Divider classes={{ root: classes.divider }} />
                    <Grid container spacing={1}>
                        <Grid item>
                            <ButtonGroup variant="contained" color="primary" disableElevation aria-label="datastore menu">
                                <Tooltip title={t("OPEN_DATASTORE")} placement="top">
                                    <Button onClick={openDatastore} className={classes.menuButton}>
                                        <StorageRoundedIcon />
                                    </Button>
                                </Tooltip>
                                {datastores && datastores.length > 1 && <Tooltip title={t("CHANGE_DATASTORE")} placement="top">
                                    <Button
                                        onClick={openDatastoreMenu}
                                        className={`${classes.menuButton} ${classes.menuButtonSlim}`}
                                    >
                                        <KeyboardArrowUpIcon />
                                    </Button>
                                </Tooltip>}
                            </ButtonGroup>
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
                        </Grid>
                        <Grid item>
                            <Tooltip title={t("BOOKMARK")} placement="top">
                                <Button variant="outlined" color="primary" onClick={bookmark} className={classes.menuButton}>
                                    <BookmarkBorderRoundedIcon color="primary" />
                                </Button>
                            </Tooltip>
                        </Grid>
                        <Grid item>
                            <Tooltip title={t("GENERATE_PASSWORD")} placement="top">
                                <Button variant="outlined" color="primary" onClick={showGeneratePassword} className={classes.menuButton}>
                                    <VpnKeyRoundedIcon color="primary" />
                                </Button>
                            </Tooltip>
                        </Grid>
                        <Grid item style={{ marginLeft: "auto" }}>
                            <ButtonGroup variant="outlined" color="primary" disableElevation aria-label="main menu">
                                <Tooltip title={t("CHANGE_ACCOUNT")} placement="top">
                                    <Button
                                        onClick={openChangeAccount}
                                        className={classes.menuButton}
                                    >
                                        <Badge
                                            overlap="circular"
                                            anchorOrigin={{
                                                vertical: 'bottom',
                                                horizontal: 'right',
                                            }}
                                            badgeContent={
                                                <SettingsIcon className={classes.overlayIcon} />
                                            }
                                        >
                                            <Avatar className={classes.overlayedIcon}>
                                                <SupervisorAccountIcon />
                                            </Avatar>
                                        </Badge>
                                    </Button>
                                </Tooltip>
                                <Tooltip title={t("LOGOUT")} placement="top">
                                    <Button onClick={logout} className={classes.menuButton}>
                                        <ExitToAppRoundedIcon color="primary" />
                                    </Button>
                                </Tooltip>
                            </ButtonGroup>
                        </Grid>
                    </Grid>
                </Grid>
                {changeAccountOpen && <DialogChangeAccount open={changeAccountOpen} onClose={() => setChangeAccountOpen(false)} />}
                {unlockOfflineCache && (
                    <DialogUnlockOfflineCache open={unlockOfflineCache} onClose={onUnlockOfflineCacheClosed} />
                )}
                {createDatastoreOpen && <CreateDatastoresDialog {...props} open={createDatastoreOpen} onClose={() => {
                    setCreateDatastoreOpen(false);
                    reloadDatastoreOverview();
                }} />}
            </Grid>
        </DarkBox>
    );
};

export default PopupView;
