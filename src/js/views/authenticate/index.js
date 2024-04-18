import React from "react";
import {useTranslation} from "react-i18next";

import {Grid} from "@material-ui/core";
import ThumbUpIcon from "@material-ui/icons/ThumbUp";
import Button from "@material-ui/core/Button";
import {makeStyles} from "@material-ui/core/styles";

import FooterLinks from "../../components/footer-links";
import ConfigLogo from "../../components/config-logo";

const useStyles = makeStyles((theme) => ({
    button: {
        color: "white !important",
    },
}));
const AuthenticateView = (props) => {

    const classes = useStyles();
    const { t } = useTranslation();
    return (
        <div className={"lostpasswordbox dark"}>
            <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} />
            <Grid container>
                <Grid item xs={12} sm={12} md={12} style={{ textAlign: "center" }}>
                    <ThumbUpIcon style={{ fontSize: 160 }} />
                </Grid>
                <Grid item xs={6} sm={6} md={6} style={{ marginTop: "5px", marginBottom: "5px" }}>
                    <Button
                        variant="contained"
                        color="primary"
                        type="submit"
                        href={"index.html"}
                        className={classes.button}
                    >
                        {t("BACK_TO_HOME")}
                    </Button>
                </Grid>
            </Grid>
            <div className="box-footer">
                <FooterLinks />
            </div>
        </div>
    );
};

export default AuthenticateView;
