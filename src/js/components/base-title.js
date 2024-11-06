import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import Paper from "@mui/material/Paper";

const useStyles = makeStyles((theme) => ({
    title: {
        backgroundColor: "#f2f5f7",
        textAlign: "right",
        fontSize: "16px",
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        paddingLeft: "15px",
        paddingRight: "15px",
        marginBottom: "15px",
        color: theme.palette.background.default,
        [theme.breakpoints.up("sm")]: {
            maxWidth: `calc(100% - 240px)`,
            fontSize: "20px",
        },
    },
    sessionExpirationTimer: {
        backgroundColor: "#f2f5f7",
        textAlign: "right",
        fontSize: "10px",
        paddingTop: "5px",
        paddingLeft: "15px",
        paddingRight: "15px",
        color: "rgba(15,17,24,0.33)",
        [theme.breakpoints.up("sm")]: {
            maxWidth: `calc(100% - 240px)`,
        },
    },
}));

const BaseTitle = (props) => {
    const classes = useStyles();
    const { children } = props;
    const { t } = useTranslation();

    return (
        <>
            {/*<Paper elevation={0} className={classes.sessionExpirationTimer} square>*/}
            {/*    {t("AUTOMATIC_SIGN_OFF_IN", {time: '00:00:00'})}*/}
            {/*</Paper>*/}
            <Paper elevation={0} className={classes.title} square>
                {children}
            </Paper>
        </>
    );
};

BaseTitle.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
};

export default BaseTitle;
