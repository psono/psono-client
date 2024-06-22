import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import {Avatar, Grid} from "@mui/material";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";

import GridContainerErrors from "../grid-container-errors";
import Table from "../table";
import helperService from "../../services/helper";
import { getStore } from "../../services/store";
import browserClient from "../../services/browser-client";
import datastoreUserService from "../../services/datastore-user";
import cryptoLibrary from "../../services/crypto-library";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
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
    avatar: {
        width: 150,
        height: 150,
        marginTop: '8px',
    },
    avatarPlaceholder: {
        width: 150,
        height: 150,
        fontSize: '11rem',
        backgroundColor: '#2dbb93',
        paddingTop: '20px',
        marginTop: '8px',
        color: 'white',
    },
    avatarPlaceholderText: {
        position: "absolute",
        bottom: "30px",
        color: '#666',
        fontSize: '0.8rem',
    },
    uncheckedIcon: {
        width: "0px",
        height: "0px",
        padding: "9px",
        border: "1px solid #666",
        borderRadius: "3px",
    },
    inputAdornment: {
        color: "#b1b6c1",
    },
}));

const DialogNewUser = (props) => {
    const { open, onClose } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [domain, setDomain] = useState("");
    const allowUserSearchByUsernamePartial = getStore().getState().server.allowUserSearchByUsernamePartial;
    const allowUserSearchByEmail = getStore().getState().server.allowUserSearchByEmail;
    const serverUrl = getStore().getState().server.url;
    const [errors, setErrors] = useState([]);
    const [visualUsername, setVisualUsername] = useState("");
    const [foundUsername, setFoundUsername] = useState("");
    const [foundUserId, setFoundUserId] = useState("");
    const [profilePic, setProfilePic] = useState("");
    const [foundPublicKey, setFoundPublicKey] = useState("");
    const [users, setUsers] = useState([]);

    let isSubscribed = true;
    React.useEffect(() => {
        const onError = function (data) {
            console.log(data);
        };

        browserClient.getConfig().then(onNewConfigLoaded, onError);
        return () => (isSubscribed = false);
    }, []);

    const onNewConfigLoaded = (configJson) => {
        if (!isSubscribed) {
            return;
        }
        let domain = configJson["backend_servers"][0]["domain"];

        if (domain === 'psono.pw' && serverUrl !== 'https://www.psono.pw/server') {
            domain = helperService.getDomainWithoutWww(serverUrl);
        }

        setDomain(domain);
    };

    const showUser = (userId, username, publicKey, avatarId) => {
        setUsers([]);
        setFoundUserId(userId);
        setFoundUsername(username);
        setFoundPublicKey(publicKey);
        if (avatarId) {
            const path = "/avatar-image/" + userId + "/" + avatarId + "/";
            setProfilePic(getStore().getState().server.url + path)
        } else {
            setProfilePic("");
        }
    };

    const onSearch = (event) => {
        setErrors([]);
        setVisualUsername("");
        setFoundUserId("");
        setFoundUsername("");
        setFoundPublicKey("");

        let searchUsername = username;
        let searchEmail = email;

        if (!allowUserSearchByUsernamePartial) {
            searchUsername = helperService.formFullUsername(searchUsername, domain);
        }

        const onSuccess = function (data) {
            data = data.data;
            if (Object.prototype.toString.call(data) === "[object Array]") {
                setUsers(
                    data.map((user) => {
                        return [user.id, user.username, user.public_key, user.avatar_id];
                    })
                );
            } else {
                showUser(data.id, data.username, data.public_key, data.avatar_id);
            }
        };

        const onError = function (data) {
            if (data.status === 400) {
                setErrors(["USER_NOT_FOUND"]);
            } else {
                console.log(data);
            }
        };
        datastoreUserService.searchUser(searchUsername, searchEmail).then(onSuccess, onError);
    };

    const onCreate = (event) => {
        const userObject = {
            id: cryptoLibrary.generateUuid(),
            type: "user",
            name: "",
            data: {
                user_id: foundUserId,
                user_public_key: foundPublicKey,
                user_username: foundUsername,
            },
        };
        if (visualUsername) {
            userObject["data"]["user_name"] = visualUsername;
        }

        if (userObject.data.user_name) {
            userObject.name += userObject.data.user_name;
        } else {
            userObject.name += userObject.data.user_username;
        }
        userObject.name += " (" + userObject.data.user_public_key + ")";

        props.onCreate(userObject);
    };

    if (users.length > 0) {
        const columns = [
            { name: t("ID"), options: { display: false } },
            {
                name: t("SELECTED"),
                options: {
                    filter: false,
                    sort: false,
                    empty: false,
                    customHeadLabelRender: () => null,
                    customBodyRender: (value, tableMeta, updateValue) => {
                        return (
                            <IconButton
                                onClick={() => {
                                    showUser(tableMeta.rowData[0], tableMeta.rowData[1], tableMeta.rowData[2], tableMeta.rowData[3]);
                                }}
                                size="large">
                                <CheckBoxOutlineBlankIcon />
                            </IconButton>
                        );
                    },
                },
            },
            {
                name: t("USERNAME"),
                options: {
                    filter: true,
                    sort: true,
                    empty: false,
                    customBodyRender: (value, tableMeta, updateValue) => {
                        let username = tableMeta.rowData[1].substring(0, 20);
                        if (tableMeta.rowData[1].length > 20) {
                            username = username + "...";
                        }
                        return username;
                    },
                },
            },
            {
                name: t("PUBLIC_KEY"),
                options: {
                    filter: true,
                    sort: true,
                    empty: false,
                    customBodyRender: (value, tableMeta, updateValue) => {
                        let publicKey = tableMeta.rowData[2].substring(0, 50);
                        if (tableMeta.rowData[2].length > 50) {
                            publicKey = publicKey + "...";
                        }
                        return publicKey;
                    },
                },
            },
        ];

        const options = {
            filterType: "checkbox",
        };

        return (
            <Dialog
                fullWidth
                maxWidth={"sm"}
                open={open}
                onClose={() => {
                    setUsers([]);
                }}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{t("PICK_USER")}</DialogTitle>
                <DialogContent>
                    <Table data={users} columns={columns} options={options} />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setUsers([]);
                        }}
                    >
                        {t("CLOSE")}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    } else {
        return (
            <Dialog
                fullWidth
                maxWidth={"sm"}
                open={open}
                onClose={() => {
                    onClose();
                }}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{t("SEARCH_USER")}</DialogTitle>
                <DialogContent>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense" size="small"
                                id="username"
                                label={t("USERNAME")}
                                InputProps={{
                                    endAdornment:
                                        domain && !allowUserSearchByUsernamePartial && !username.includes("@") ? (
                                            <InputAdornment position="end"><span className={classes.inputAdornment}>{"@" + domain}</span></InputAdornment>
                                        ) : null,
                                }}
                                name="username"
                                autoComplete="off"
                                value={username}
                                onChange={(event) => {
                                    setUsername(event.target.value);
                                }}
                            />
                        </Grid>
                        {allowUserSearchByEmail && (
                            <Grid item xs={12} sm={12} md={12}>
                                <TextField
                                    className={classes.textField}
                                    variant="outlined"
                                    margin="dense" size="small"
                                    error={Boolean(email) && !helperService.isValidEmail(email)}
                                    id="email"
                                    label={t("EMAIL")}
                                    name="email"
                                    autoComplete="off"
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                    }}
                                />
                            </Grid>
                        )}
                        <Grid item xs={12} sm={12} md={12} style={{ marginBottom: "8px" }}>
                            <Button
                                onClick={onSearch}
                                variant="contained"
                                color="primary"
                                disabled={
                                    (!username && !email) || (Boolean(email) && !helperService.isValidEmail(email))
                                }
                            >
                                {t("SEARCH")}
                            </Button>
                        </Grid>

                        {Boolean(foundUserId) && (
                            <Grid item xs={12} sm={12} md={12}>
                                <Grid container>
                                    <Grid item xs={12} sm={4} md={4}>
                                        <center>

                                            {profilePic ? (
                                                <Avatar alt="Profile Picture" src={profilePic} className={classes.avatar} />
                                            ) : (
                                                <Avatar className={classes.avatarPlaceholder}>
                                                    <i className="fa fa-user" aria-hidden="true"></i>
                                                    <span className={classes.avatarPlaceholderText}>{t("NO_IMAGE")}</span>
                                                </Avatar>
                                            )}
                                        </center>
                                    </Grid>
                                    <Grid item xs={12} sm={8} md={8}>
                                        <Grid container>
                                            <Grid item xs={12} sm={12} md={12}>
                                                <TextField
                                                    className={classes.textField}
                                                    variant="outlined"
                                                    margin="dense" size="small"
                                                    id="visualUsername"
                                                    label={t("NAME_OPTIONAL")}
                                                    name="visualUsername"
                                                    autoComplete="off"
                                                    value={visualUsername}
                                                    onChange={(event) => {
                                                        setVisualUsername(event.target.value);
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={12} md={12}>
                                                <TextField
                                                    className={classes.textField}
                                                    variant="outlined"
                                                    margin="dense" size="small"
                                                    id="foundUsername"
                                                    label={t("USERNAME")}
                                                    name="foundUsername"
                                                    autoComplete="off"
                                                    value={foundUsername}
                                                    disabled
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={12} md={12}>
                                                <TextField
                                                    className={classes.textField}
                                                    variant="outlined"
                                                    margin="dense" size="small"
                                                    id="foundPublicKey"
                                                    label={t("PUBLIC_KEY")}
                                                    name="foundPublicKey"
                                                    autoComplete="off"
                                                    helperText={t("TO_VERIFY_PUBLIC_KEY")}
                                                    value={foundPublicKey}
                                                    disabled
                                                />
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>

                            </Grid>
                        )}

                    </Grid>
                    <GridContainerErrors errors={errors} setErrors={setErrors} />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            onClose();
                        }}
                    >
                        {t("CLOSE")}
                    </Button>
                    <Button
                        onClick={() => {
                            onCreate(visualUsername, foundUserId, foundUsername, foundPublicKey);
                        }}
                        variant="contained"
                        color="primary"
                        disabled={!foundUserId || !foundUsername || !foundPublicKey}
                    >
                        {t("CREATE")}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
};

DialogNewUser.propTypes = {
    onClose: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default DialogNewUser;
