import { Checkbox, Divider, FormHelperText, Grid } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import IconButton from "@material-ui/core/IconButton";
import InputAdornment from "@material-ui/core/InputAdornment";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import { Check } from "@material-ui/icons";
import BookmarkBorderRoundedIcon from '@material-ui/icons/BookmarkBorderRounded';
import ClearIcon from "@material-ui/icons/Clear";
import ExitToAppRoundedIcon from '@material-ui/icons/ExitToAppRounded';
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import ReplayRoundedIcon from '@material-ui/icons/ReplayRounded';
import StorageRoundedIcon from "@material-ui/icons/StorageRounded";
import VpnKeyRoundedIcon from '@material-ui/icons/VpnKeyRounded';
import MuiAlert from "@material-ui/lab/Alert";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import action from "../../actions/bound-action-creators";
import DialogUnlockOfflineCache from "../../components/dialogs/unlock-offline-cache";
import ContentCopy from "../../components/icons/ContentCopy";
import browserClient from "../../services/browser-client";
import datastorePassword from "../../services/datastore-password";
import helper from "../../services/helper";
import offlineCacheService from "../../services/offline-cache";
import secretService from "../../services/secret";
import user from "../../services/user";
import widgetService from "../../services/widget";

const useStyles = makeStyles((theme) => ({
    root: {
        color: "#b1b6c1",
    },
    textField: {
        width: "100%",
        "& .MuiInputBase-root": {
            color: "#b1b6c1",
        },
        "& .MuiInputAdornment-root .MuiTypography-colorTextSecondary": {
            color: "#666",
        },
        "& MuiFormControl-root": {
            color: "#b1b6c1",
        },
        "& label": {
            color: "#b1b6c1",
        },
        "& .MuiInput-underline:after": {
            borderBottomColor: "green",
        },
        "& .MuiOutlinedInput-root": {
            "& fieldset": {
                borderColor: "#666",
            },
        },
    },
    divider: {
        background: "#666",
        marginTop: "20px",
        marginBottom: "20px",
    },
    button: {
        color: "#b1b6c1",
        width: "100%",
        transition: "none",
        "& span": {
            justifyContent: "left",
        },
        "&:hover": {
            backgroundColor: "#fff",
            color: "#151f2b",
        },
    },
    navigation: {
        listStyleType: "none",
        padding: 0,
        margin: 0,
        overflow: "hidden",
        overflowY: "auto",
        height: "60vh",
    },
    navigationItemLi: {
        position: "relative",
        marginTop: "1px",
        borderRadius: "4px",
        "& p": {
            color: "#b1b6c1",
        },
        "&:hover": {
            backgroundColor: "#fff",
            color: "#151f2b",
        },
        "&:hover a": {
            color: "#151f2b",
        },
        "&:hover p": {
            color: "#151f2b",
        },
        "& button span": {
            color: "#b1b6c1",
        },
        "&:hover button span": {
            color: "#151f2b",
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
        color: "#9c27b0",
    },
    checkedIcon: {
        width: "20px",
        height: "20px",
        border: "1px solid #666",
        borderRadius: "3px",
    },
    uncheckedIcon: {
        width: "0px",
        height: "0px",
        padding: "9px",
        border: "1px solid #666",
        borderRadius: "3px",
    },
    widePopper: {
        width: "max-content",
    }
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

    return (
        <li className={classes.navigationItemLi}>
            <a href="#" className={classes.navigationItemA} onClick={onEditItem}>
                <i className={"fa-fw " + widgetService.itemIcon(item.content)} /> {item.content.name}
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
                {["bookmark", "website_password"].indexOf(item.content.type) !== -1 && (
                    <Button
                        aria-label="open"
                        onClick={() => {
                            onItemClick(item.content);
                        }}
                    >
                        <OpenInNewIcon fontSize="small" />
                    </Button>
                )}
                {["application_password", "website_password", "credit_card"].indexOf(item.content.type) !== -1 && (
                    <Button aria-label="settings" onClick={openMenu}>
                        <ContentCopy fontSize="small" />
                    </Button>
                )}
                {["totp"].indexOf(item.content.type) !== -1 && (
                    <Tooltip title={t("COPY_TOTP_TOKEN")} placement="left" PopperProps={{
                        disablePortal: true,
                    }} classes={{
                        tooltip: classes.widePopper
                    }}>
                        <Button aria-label="settings" onClick={onCopyTotpToken}>
                            <ContentCopy fontSize="small" />
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
                            <ContentCopy fontSize="small" />
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
                            <ContentCopy fontSize="small" />
                        </Button>
                    </Tooltip>
                )}
            </ButtonGroup>
            {["application_password", "website_password", "credit_card"].indexOf(item.content.type) !== -1 && (
                <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
                    {["application_password", "website_password"].indexOf(item.content.type) !== -1 && (
                        <>
                            <MenuItem onClick={onCopyUsername}>
                                <ListItemIcon className={classes.listItemIcon}>
                                    <ContentCopy className={classes.icon} fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" noWrap>
                                    {t("COPY_USERNAME")}
                                </Typography>
                            </MenuItem>
                            <MenuItem onClick={onCopyPassword}>
                                <ListItemIcon className={classes.listItemIcon}>
                                    <ContentCopy className={classes.icon} fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" noWrap>
                                    {t("COPY_PASSWORD")}
                                </Typography>
                            </MenuItem>
                        </>
                    )}
                    {["credit_card"].indexOf(item.content.type) !== -1 && (
                        <>
                            <MenuItem onClick={onCopyCreditCardNumber}>
                                <ListItemIcon className={classes.listItemIcon}>
                                    <ContentCopy className={classes.icon} fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" noWrap>
                                    {t("COPY_CREDIT_CARD_NUMBER")}
                                </Typography>
                            </MenuItem>
                            <MenuItem onClick={onCopyCreditCardName}>
                                <ListItemIcon className={classes.listItemIcon}>
                                    <ContentCopy className={classes.icon} fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" noWrap>
                                    {t("COPY_CREDIT_CARD_NAME")}
                                </Typography>
                            </MenuItem>
                            <MenuItem onClick={onCopyCreditCardExpiryDate}>
                                <ListItemIcon className={classes.listItemIcon}>
                                    <ContentCopy className={classes.icon} fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" noWrap>
                                    {t("COPY_CREDIT_CARD_EXPIRATION_DATE")}
                                </Typography>
                            </MenuItem>
                            <MenuItem onClick={onCopyCreditCardCvc}>
                                <ListItemIcon className={classes.listItemIcon}>
                                    <ContentCopy className={classes.icon} fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" noWrap>
                                    {t("COPY_CREDIT_CARD_CVC")}
                                </Typography>
                            </MenuItem>
                            <MenuItem onClick={onCopyCreditCardPin}>
                                <ListItemIcon className={classes.listItemIcon}>
                                    <ContentCopy className={classes.icon} fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" noWrap>
                                    {t("COPY_CREDIT_CARD_PIN")}
                                </Typography>
                            </MenuItem>
                        </>
                    )}
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
        return () => (isSubscribed = false);
    }, []);

    useEffect(() => {
        browserClient.getActiveTabUrl().then((url) => {
            setUrl(helper.parseUrl(url));
        });
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
    };

    const logout = (event) => {
        user.logout(undefined, window.location.origin);
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
        let password = datastorePassword.generatePassword(passwordLength, passwordLettersUppercase + passwordLettersLowercase + passwordNumbers + passwordSpecialChars);
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
        action.setLastPopupSearch("");
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
            <Grid container className={"dark"}>
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
        );
    }

    if (view === 'generate_password') {
        return (
            <Grid container className={"dark"}>
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense"
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
                                        style={{ color: "#b1b6c1" }}
                                    >
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
                        margin="dense"
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
                        InputProps={{
                            classes: {
                                input: classes.passwordField,
                            },
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
                    <Button style={{ color: "#b1b6c1" }} onClick={back}>{t("BACK")}</Button>
                </Grid>
            </Grid>
        )
    }

    let itemsToDisplay = [];
    if (search) {
        itemsToDisplay = items.filter(filterBySearch).slice(0, 50);
    } else if (url) {
        const matching = [];
        const notMatching = [];
        items.map((item, _) => {
            if (!(item.content.hasOwnProperty("deleted") && item.content["deleted"]) &&
                item.content.urlfilter &&
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
        <Grid container className={"dark"}>
            <Grid item xs={12} sm={12} md={12}>
                <TextField
                    className={classes.textField}
                    variant="outlined"
                    margin="dense"
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
                        action.setLastPopupSearch(event.target.value);
                    }}
                    InputProps={{
                        endAdornment: search && (
                            <InputAdornment position="end">
                                <IconButton aria-label="clear search" onClick={clear} edge="end" style={{ color: "#b1b6c1" }}>
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
                <Grid item xs={12} sm={12} md={12} style={{ color: "#b1b6c1" }}>
                    {t("NO_ENTRY_FOUND")}
                </Grid>
            )}
            <Grid item xs={12} sm={12} md={12}>
                <Divider classes={{ root: classes.divider }} />
                <Grid container spacing={1}>
                    <Grid item>
                        <Tooltip title={t("OPEN_DATASTORE")} placement="top">
                            <Button variant="contained" color="primary" onClick={openDatastore}>
                                <StorageRoundedIcon />
                            </Button>
                        </Tooltip>
                    </Grid>
                    <Grid item>
                        <Tooltip title={t("BOOKMARK")} placement="top">
                            <Button variant="outlined" color="primary" onClick={bookmark}>
                                <BookmarkBorderRoundedIcon />
                            </Button>
                        </Tooltip>
                    </Grid>
                    <Grid item>
                        <Tooltip title={t("GENERATE_PASSWORD")} placement="top">
                            <Button variant="outlined" color="primary" onClick={showGeneratePassword}>
                                <VpnKeyRoundedIcon />
                            </Button>
                        </Tooltip>
                    </Grid>
                    <Grid item style={{ marginLeft: "auto" }}>
                        <Tooltip title={t("LOGOUT")} placement="top">
                            <Button variant="outlined" color="primary" onClick={logout}>
                                <ExitToAppRoundedIcon />
                            </Button>
                        </Tooltip>
                    </Grid>
                </Grid>
            </Grid>
            {unlockOfflineCache && (
                <DialogUnlockOfflineCache open={unlockOfflineCache} onClose={onUnlockOfflineCacheClosed} />
            )}
        </Grid>
    );
};

export default PopupView;
