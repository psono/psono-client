import React, { useState } from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import {Avatar, Checkbox, Grid} from "@mui/material";
import { Check } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

import helper from "../../services/helper";
import datastoreUserService from "../../services/datastore-user";
import Table from "../table";
import DialogNewUser from "./new-user";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import helperService from "../../services/helper";
import {getStore} from "../../services/store";
import browserClient from "../../services/browser-client";
import GridContainerErrors from "../grid-container-errors";
import MuiAlert from "@mui/material/Alert";
import cryptoLibrary from "../../services/crypto-library";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
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
    tabPanel: {
        "& .MuiBox-root": {
            padding: "16px 0px",
        },
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
        backgroundColor: theme.palette.primary.main,
        paddingTop: '20px',
        marginTop: '8px',
        color: 'white',
    },
    avatarPlaceholderText: {
        position: "absolute",
        bottom: "30px",
        color: theme.palette.greyText.main,
        fontSize: '0.8rem',
    },
}));

const DialogNewUserShare = (props) => {
    const { open, onClose, onCreate, node } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [view, setView] = React.useState("search");
    const [read, setRead] = useState(true);
    const [write, setWrite] = useState(false);
    const [grant, setGrant] = useState(false);
    const [users, setUsers] = useState([]);
    const [userDatastoreUserList, setUserDatastoreUserList] = useState([]);
    const [userDatastore, setUserDatastore] = useState({});
    const [newUserOpen, setNewUserOpen] = useState(false);
    const [errors, setErrors] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [foundUsername, setFoundUsername] = useState("");
    const [foundUserId, setFoundUserId] = useState("");
    const [profilePic, setProfilePic] = useState("");
    const [foundPublicKey, setFoundPublicKey] = useState("");

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [domain, setDomain] = useState("");
    const allowUserSearchByUsernamePartial = getStore().getState().server.allowUserSearchByUsernamePartial;
    const allowUserSearchByEmail = getStore().getState().server.allowUserSearchByEmail;
    const serverUrl = getStore().getState().server.url;

    let isSubscribed = true;
    React.useEffect(() => {
        loadUsers();
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
        const datastoreUser = userDatastoreUserList.find(user => user.data.user_username === username)
        if (datastoreUser && (datastoreUser.data.user_id !== userId || datastoreUser.data.user_public_key !== publicKey) ) {
            setErrors(["WARNING_USER_DETAILS_CHANGED"]);
        }
    };

    const onSearch = (event) => {
        setErrors([]);
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
            setView("create")
        };

        const onError = function (data) {
            setErrors(["USER_NOT_FOUND"]);
        };
        datastoreUserService.searchUser(searchUsername, searchEmail).then(onSuccess, onError);
    };

    const create = async () => {
        let datastoreUser = userDatastoreUserList.find(user => user.data.user_username === foundUsername)
        if (datastoreUser && (datastoreUser.data.user_id !== foundUserId || datastoreUser.data.user_public_key !== foundPublicKey)) {
            // update user
            datastoreUser.data.user_id = foundUserId;
            datastoreUser.data.user_public_key = foundPublicKey;
            datastoreUser.name = foundUsername + " (" + foundPublicKey + ")",
            datastoreUserService.saveDatastoreContent(userDatastore)
        } else if (!datastoreUser) {
            // create user
            datastoreUser = {
                id: cryptoLibrary.generateUuid(),
                type: "user",
                name: foundUsername + " (" + foundPublicKey + ")",
                data: {
                    user_id: foundUserId,
                    user_public_key: foundPublicKey,
                    user_username: foundUsername,
                },
            };
            datastoreUserService.addUserToDatastore(userDatastore, datastoreUser);
        }

        onCreate(
            [datastoreUser],
            read,
            write,
            grant
        );
    };

    const loadUsers = () => {
        datastoreUserService.getUserDatastore().then(function (newUserDatastore) {
            if (!isSubscribed) {
                return;
            }
            const userDatastoreUserList = [];
            setUserDatastore(newUserDatastore);
            helper.createList(newUserDatastore, userDatastoreUserList);
            setUserDatastoreUserList(userDatastoreUserList);
        });
    };

    const onNewUserCreate = (userObject) => {
        setNewUserOpen(false);
        datastoreUserService.addUserToDatastore(userDatastore, userObject).then(
            () => {
                loadUsers();
            },
            (error) => {
                console.log(error);
            }
        );
    };

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
                onClose();
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                }}
                name="createShare"
                autoComplete="off"
            >

                <DialogTitle id="alert-dialog-title">
                    {users.length === 0 && Boolean(foundUserId) ? t("CHOOSE_PERMISSIONS") : (users.length > 0 ? t("CHOOSE_USER") : t("SHARE") + " " + node.name)}
                </DialogTitle>
                <DialogContent>
                    {view === "create" && (
                        <Grid container>
                            {users.length > 0 && (
                                <Grid item xs={12} sm={12} md={12}>
                                    <Table data={users} columns={columns} options={options} />
                                </Grid>
                            )}
                            {users.length === 0 && Boolean(foundUserId) && (
                                <>
                                    <Grid item xs={4} sm={4} md={4}>
                                        <Checkbox
                                            tabIndex={1}
                                            checked={read}
                                            onChange={(event) => {
                                                setRead(event.target.checked);
                                            }}
                                            checkedIcon={<Check className={classes.checkedIcon}/>}
                                            icon={<Check className={classes.uncheckedIcon}/>}
                                            classes={{
                                                checked: classes.checked,
                                            }}
                                        />{" "}
                                        {t("READ")}
                                    </Grid>
                                    <Grid item xs={4} sm={4} md={4}>
                                        <Checkbox
                                            tabIndex={1}
                                            checked={write}
                                            onChange={(event) => {
                                                setWrite(event.target.checked);
                                            }}
                                            checkedIcon={<Check className={classes.checkedIcon}/>}
                                            icon={<Check className={classes.uncheckedIcon}/>}
                                            classes={{
                                                checked: classes.checked,
                                            }}
                                        />{" "}
                                        {t("WRITE")}
                                    </Grid>
                                    <Grid item xs={4} sm={4} md={4}>
                                        <Checkbox
                                            tabIndex={1}
                                            checked={grant}
                                            onChange={(event) => {
                                                setGrant(event.target.checked);
                                            }}
                                            checkedIcon={<Check className={classes.checkedIcon}/>}
                                            icon={<Check className={classes.uncheckedIcon}/>}
                                            classes={{
                                                checked: classes.checked,
                                            }}
                                        />{" "}
                                        {t("ADMIN")}
                                    </Grid>
                                    <Grid item xs={12} sm={12} md={12}>
                                        <Divider style={{marginTop: "20px", marginBottom: "10px"}}/>
                                    </Grid>
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
                                                    <GridContainerErrors errors={errors} setErrors={setErrors} />
                                                </Grid>
                                            </Grid>
                                        </Grid>

                                    </Grid>
                                </>
                            )}
                        </Grid>
                    )}
                    {view === "search" && (
                        <Grid container>
                            <Grid item xs={12} sm={12} md={12}>
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
                                                    <InputAdornment position="end"><span
                                                        className={classes.inputAdornment}>{"@" + domain}</span></InputAdornment>
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
                                {errors.length === 0 && (<Grid item xs={12} sm={12} md={12}>
                                    <MuiAlert severity="info">{t("USE_FORM_TO_SEARCH_USER")}</MuiAlert>
                                </Grid>)}

                                <GridContainerErrors errors={errors} setErrors={setErrors} />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            onClose();
                        }}
                    >
                        {t("CLOSE")}
                    </Button>
                    {view === "search" && (
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
                    )}
                    {view === "create" && Boolean(foundUserId) && (
                        <Button
                            onClick={create}
                            disabled={!read && !write && !grant}
                            variant="contained"
                            color="primary"
                            type="submit"
                        >
                            {t("CREATE")}
                        </Button>
                    )}
                </DialogActions>
                {newUserOpen && (
                    <DialogNewUser open={newUserOpen} onClose={() => setNewUserOpen(false)} onCreate={onNewUserCreate} />
                )}
            </form>
        </Dialog>
    );
};

DialogNewUserShare.propTypes = {
    onClose: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    node: PropTypes.object.isRequired,
};

export default DialogNewUserShare;
