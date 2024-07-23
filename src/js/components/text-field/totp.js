import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { useHotkeys } from 'react-hotkeys-hook'

import IconButton from '@mui/material/IconButton';
import TextField from "@mui/material/TextField";
import LinearProgress from "@mui/material/LinearProgress";
import InputAdornment from "@mui/material/InputAdornment";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import {makeStyles} from "@mui/styles";

import ContentCopy from "./../icons/ContentCopy";
import cryptoLibraryService from "../../services/crypto-library";
import browserClientService from "../../services/browser-client";
import notification from "../../services/notification";

const useStyles = makeStyles((theme) => ({
    passwordField: {
        fontFamily: "'Fira Code', monospace",
    },
    icon: {
        fontSize: "18px",
    },
    listItemIcon: {
        minWidth: theme.spacing(4),
    },
    iconButton: {
        padding: 10,
    },
}));

const TextFieldTotp = (props) => {
    const classes = useStyles();
    const { period, digits, algorithm, code, onDelete, ...rest } = props;
    const { t } = useTranslation();
    const [progress, setProgress] = React.useState(10);
    const [token, setToken] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);

    useHotkeys('alt+t', () => {
        // copy username
        onCopyTotpToken();
    })

    // setInterval is wrapped in a closure and as such it would not use the current props / state
    // https://github.com/facebook/react/issues/14010
    const periodRef = useRef(period);
    periodRef.current = period;
    const digitsRef = useRef(digits);
    digitsRef.current = digits;
    const algorithmRef = useRef(algorithm);
    algorithmRef.current = algorithm;
    const codeRef = useRef(code);
    codeRef.current = code;

    const updateToken = () => {
        setToken(
            cryptoLibraryService.getTotpToken(
                codeRef.current,
                periodRef.current,
                algorithmRef.current,
                digitsRef.current
            )
        );
        const percentage =
            100 -
            (((periodRef.current || 30) - (Math.round(new Date().getTime() / 1000.0) % (periodRef.current || 30))) /
                (periodRef.current || 30)) *
                100;
        setProgress(percentage);
    };

    React.useEffect(() => {
        updateToken();
        const timer = setInterval(updateToken, 500);
        return () => {
            clearInterval(timer);
        };
    }, []);

    const onCopyTotpToken = (event) => {
        browserClientService.copyToClipboard(() => Promise.resolve(token));
        notification.push("totp_token_copy", t("TOTP_TOKEN_COPY_NOTIFICATION"));
    };

    return (
        <>
            <TextField
                {...rest}
                InputProps={{
                    readOnly: true,
                    type: showPassword ? "text" : "password",
                    classes: {
                        input: classes.passwordField,
                    },
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                className={classes.iconButton}
                                aria-label="menu"
                                onClick={(event) => {
                                    setAnchorEl(event.currentTarget);
                                }}
                                size="large">
                                <MenuOpenIcon fontSize="small" />
                            </IconButton>
                            <Menu
                                id="simple-menu"
                                anchorEl={anchorEl}
                                keepMounted
                                open={Boolean(anchorEl)}
                                onClose={() => {
                                    setAnchorEl(null)
                                }}
                            >
                                <MenuItem onClick={() => {
                                    setAnchorEl(null);
                                    setShowPassword(!showPassword);
                                }}>
                                    <ListItemIcon className={classes.listItemIcon}>
                                        <VisibilityOffIcon className={classes.icon} fontSize="small" />
                                    </ListItemIcon>
                                    <Typography variant="body2" noWrap>
                                        {t("SHOW_OR_HIDE_TOTP")}
                                    </Typography>
                                </MenuItem>
                                <MenuItem onClick={(event) => {
                                    setAnchorEl(null);
                                    onCopyTotpToken(event);
                                }}>
                                    <ListItemIcon className={classes.listItemIcon}>
                                        <ContentCopy className={classes.icon} fontSize="small" />
                                    </ListItemIcon>
                                    <Typography variant="body2" noWrap>
                                        {t("COPY_TOTP_TOKEN")}
                                    </Typography>
                                </MenuItem>
                                {onDelete && (
                                    <MenuItem onClick={(event) => {
                                        setAnchorEl(null);
                                        onDelete(event);
                                    }}>
                                        <ListItemIcon className={classes.listItemIcon}>
                                            <DeleteIcon
                                                className={classes.icon}
                                                fontSize="small"
                                            />
                                        </ListItemIcon>
                                        <Typography variant="body2" noWrap>
                                            {t("DELETE")}
                                        </Typography>
                                    </MenuItem>
                                )}
                            </Menu>
                        </InputAdornment>
                    ),
                }}
                value={token}
            />
            <LinearProgress variant="determinate" value={progress} />
        </>
    );
};

TextFieldTotp.defaultProps = {
    period: 30,
    digits: 6,
    algorithm: "SHA1",
    code: "",
};

TextFieldTotp.propTypes = {
    period: PropTypes.number,
    digits: PropTypes.number,
    algorithm: PropTypes.string,
    code: PropTypes.string,
    onDelete: PropTypes.func,
};

export default TextFieldTotp;
