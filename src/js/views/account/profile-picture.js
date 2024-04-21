import React, { useState, useRef } from 'react';
import {useTranslation} from "react-i18next";
import {
    Avatar,
    Badge,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Snackbar,
    IconButton
} from '@material-ui/core';
import PhotoCamera from '@material-ui/icons/PhotoCamera';
import ClearIcon from '@material-ui/icons/Clear';
import TextField from "@material-ui/core/TextField";
import {makeStyles} from "@material-ui/core/styles";
import EditIcon from "@material-ui/icons/Edit";
import InputAdornment from "@material-ui/core/InputAdornment";

import store from "../../services/store";
import browserClient from "../../services/browser-client";
import TextFieldQrCode from "../../components/text-field/qr";
import GridContainerErrors from "../../components/grid-container-errors";
import avatarService from "../../services/avatar";
import user from "../../services/user";
import statusService from "../../services/status";
import avatar from "../../services/avatar";


const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
    passwordField: {
        fontFamily: "'Fira Code', monospace",
    },
    wrapper: {
        textAlign: 'center',
        padding: '40px 10px',
    },
    photoCameraButton: {
        backgroundColor: 'white',
        borderRadius: '50%',
    },
    avatar: {
        width: 150,
        height: 150,
    },
    avatarPlaceholder: {
        width: 150,
        height: 150,
        fontSize: '11rem',
        backgroundColor: '#2dbb93',
        paddingTop: '20px',
        color: 'white',
    },
    avatarPlaceholderText: {
        position: "absolute",
        bottom: "30px",
        color: '#666',
        fontSize: '0.8rem',
    },
    badge: {
        paddingBottom: '20px'
    }
}));

function ProfilePicture() {
    const { t } = useTranslation();
    const classes = useStyles();
    const [profilePic, setProfilePic] = useState("");
    const [qrContent, setQrContent] = React.useState('');
    const [avatarId, setAvatarId] = React.useState(null);
    const fileInputRef = useRef(null); // Reference to the file input
    const [errors, setErrors] = useState([]);
    const [serverSupportsAvatars, setServerSupportsAvatars] = useState(true);


    React.useEffect(() => {
        loadAvatar()
    }, []);

    const loadAvatar = async () => {
        let avatars;
        try {
            avatars = await avatarService.readAvatars();
        } catch (error) {
            setErrors([t('FEATURE_NOT_SUPPORTED_SERVER_REQUIRES_UPGRADE')])
            setServerSupportsAvatars(false);
            return
        }
        if (!avatars || avatars.length <= 0) {
            return;
        }
        const avatar = await avatarService.readAvatar(store.getState().user.userId, avatars[0].id);
        setAvatarId(avatars[0].id);
        setProfilePic('data:' + avatar['mime_type'] + ';base64,' + avatar['data_base64'])
    }

    const handleFileChange = event => {
        setErrors([]);
        const file = event.target.files[0];
        if (!file) return;

        // File size check
        const filesize_kb = 100;
        if (file.size > filesize_kb*1024) { // 50 KB
            setErrors([t("FILE_MUST_BE_SMALLER_THAN_KB", {filesize: filesize_kb})]);
            event.target.value = null;
            return;
        }

        const reader = new FileReader();
        reader.onloadend = (e) => {
            const img = new Image();
            img.onload = async () => {
                // Dimension check
                if (img.width !== 256 || img.height !== 256) {
                    setErrors([t("FILE_MUST_BE_PIXEL_BIG", {filedimension_x: 256, filedimension_y: 256})]);
                    return;
                }

                const result = await avatarService.createAvatar(reader.result.split(',')[0], reader.result.split(',')[1]);
                setProfilePic(reader.result);
                setAvatarId(result.id);

            };
            img.src = e.target.result;
        };
        if (typeof file === 'undefined') {
            return;
        }
        reader.readAsDataURL(file);

        event.target.value = null;
    };

    const onClickShowQRClientConfig = (event) => {
        setQrContent(JSON.stringify({
            version: 2,
            config: {
                'verify_key': store.getState().server.verifyKey,
                'url': store.getState().server.url,
            },
        }))
    };

    const handleClearPicture = async () => {
        if (avatarId) {
            await avatarService.deleteAvatar(avatarId);
            setAvatarId(null);
        }
        setProfilePic("");  // Reset profile picture to default
        if (fileInputRef.current) fileInputRef.current.value = null;  // Also clear the file input to allow re-upload of same file
    };

    const handleEditEmail = () => {

    };
    return (
        <div className={classes.wrapper}>
            <Grid container>

                <Grid item xs={12} sm={12} md={12} className={classes.badge}>

                    <Badge

                        overlap="circular"
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        badgeContent={
                            profilePic ? (
                                <IconButton color="secondary" component="span" className={classes.photoCameraButton} onClick={handleClearPicture} disabled={!serverSupportsAvatars}>
                                    <ClearIcon />
                                </IconButton>
                            ) : (
                                <label htmlFor="icon-button-file">
                                    <IconButton color="primary" component="span" className={classes.photoCameraButton} disabled={!serverSupportsAvatars}>
                                        <PhotoCamera />
                                    </IconButton>
                                </label>
                            )
                        }
                    >
                        {profilePic ? (
                            <Avatar alt="Profile Picture" src={profilePic} className={classes.avatar} />
                        ) : (
                            <Avatar className={classes.avatarPlaceholder}>
                                <i className="fa fa-user" aria-hidden="true"></i>
                                <span className={classes.avatarPlaceholderText}>256px x 256px<br/>{t("MAX_SIZE_KB", {size: 100})}</span>
                            </Avatar>
                        )}
                    </Badge>
                    <div>
                        <input
                            ref={fileInputRef}
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="icon-button-file"
                            type="file"
                            disabled={!serverSupportsAvatars}
                            onChange={handleFileChange}
                        />
                    </div>
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />

                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense"
                        id="userId"
                        label={t("USER_ID")}
                        name="userId"
                        autoComplete="off"
                        value={store.getState().user.userId}
                        readOnly
                        InputProps={{
                            classes: {
                                input: classes.passwordField,
                            },
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense"
                        id="username"
                        label={t("USERNAME")}
                        name="username"
                        autoComplete="off"
                        value={store.getState().user.username}
                        readOnly
                        InputProps={{
                            classes: {
                                input: classes.passwordField,
                            },
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense"
                        id="userEmail"
                        label={t("E_MAIL")}
                        name="userEmail"
                        autoComplete="off"
                        value={store.getState().user.userEmail}
                        readOnly
                        InputProps={{
                            classes: {
                                input: classes.passwordField,
                            },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="edit email"
                                        onClick={handleEditEmail}
                                        edge="end"
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <TextField
                        className={classes.textField}
                        variant="outlined"
                        margin="dense"
                        id="userPublicKey"
                        label={t("PUBLIC_KEY")}
                        name="userPublicKey"
                        autoComplete="off"
                        value={store.getState().user.userPublicKey}
                        readOnly
                        InputProps={{
                            classes: {
                                input: classes.passwordField,
                            },
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <Button variant="contained" color="primary" onClick={onClickShowQRClientConfig}>
                        {t("QR_CLIENT_CONFIG")}
                    </Button>
                </Grid>
            </Grid>
            <Dialog
                open={!!qrContent}
                onClose={() => {
                    setQrContent("");
                }}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{t("QR_CLIENT_CONFIG")}</DialogTitle>
                <DialogContent>
                    <TextFieldQrCode
                        className={classes.textField}
                        variant="outlined"
                        margin="dense"
                        value={qrContent}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setQrContent("");
                    }} autoFocus>
                        {t("CLOSE")}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default ProfilePicture;