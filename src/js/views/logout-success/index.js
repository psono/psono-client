import React, {useState} from "react";
import {useTranslation} from "react-i18next";

import {Grid} from "@mui/material";
import Button from "@mui/material/Button";
import {makeStyles} from "@mui/styles";

import GridContainerErrors from "../../components/grid-container-errors";
import user from "../../services/user";
import browserClientService from "../../services/browser-client";
import ConfigLogo from "../../components/config-logo";
import DarkBox from "../../components/dark-box";

const useStyles = makeStyles((theme) => ({
    button: {
        color: "white !important",
    },
    box: {
        width: '340px',
        padding: theme.spacing(2.5),
        position: 'absolute',
        top: '60%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        borderRadius: '4px',
        [theme.breakpoints.up('sm')]: {
            width: '540px',
        },
    },
}));

const LogoutSuccessView = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const [msgs, setMsgs] = useState(['LOGOUT_SUCCESSFUL']);
    const [redirectUrl, setRedirectUrl] = useState(null);
    const [countdown, setCountdown] = useState(3);

    React.useEffect(() => {
        const handleLogout = async () => {
            // Check sessionStorage first for redirect_url (in case it was set by a previous logout call)
            let storedRedirectUrl = null;
            try {
                storedRedirectUrl = sessionStorage.getItem('psono_logout_redirect_url');
                if (storedRedirectUrl) {
                    // Clear it immediately after reading
                    sessionStorage.removeItem('psono_logout_redirect_url');
                }
            } catch (e) {
                console.error('Failed to read redirect_url from sessionStorage:', e);
            }

            try {
                // Call logout and check for redirect_url in response
                const response = await user.logout();
                if (response && response.redirect_url) {
                    setRedirectUrl(response.redirect_url);
                } else if (storedRedirectUrl) {
                    // Use stored redirect_url if API didn't return one (session already terminated)
                    setRedirectUrl(storedRedirectUrl);
                }
            } catch (error) {
                // If logout fails (e.g., 401 because session already terminated), use stored redirect_url
                if (storedRedirectUrl) {
                    setRedirectUrl(storedRedirectUrl);
                }
                console.error('Logout error:', error);
            }
        };

        handleLogout();
    }, []);

    React.useEffect(() => {
        if (redirectUrl) {
            setMsgs([t('REDIRECTING_IN_SECONDS', { seconds: countdown })]);

            if (countdown > 0) {
                const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
                return () => clearTimeout(timer);
            } else {
                // Redirect after countdown reaches 0
                window.location.href = redirectUrl;
            }
        }
    }, [redirectUrl, countdown, t]);

    return (
        <DarkBox className={classes.box}>
            <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} height="100%"/>
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true"/>
            </a>
            <Grid container>
                <GridContainerErrors errors={msgs} setErrors={setMsgs} severity={"info"}/>
            </Grid>
            {!redirectUrl && browserClientService.getClientType() === 'webclient' && (<Grid item xs={6} sm={6} md={6} style={{marginTop: "5px", marginBottom: "5px"}}>
                <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    href={"index.html"}
                    className={classes.button}
                >
                    {t("BACK_TO_HOME")}
                </Button>
            </Grid>)}
        </DarkBox>
    );
};

export default LogoutSuccessView;
