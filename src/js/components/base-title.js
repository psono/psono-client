import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";

const useStyles = makeStyles((theme) => ({
    root: {
        backgroundColor: "#f2f5f7",
        textAlign: "right",
        fontSize: "20px",
        paddingTop: "10px",
        paddingBottom: "10px",
        paddingLeft: "15px",
        paddingRight: "15px",
        marginBottom: "15px",
        color: "#0f1118",
        maxWidth: `calc(100% - 0px)`,
        [theme.breakpoints.up("sm")]: {
            maxWidth: `calc(100% - 240px)`,
        },
    },
}));

const BaseTitle = (props) => {
    const classes = useStyles();
    const { children } = props;

    return (
        <Paper elevation={0} className={classes.root} square>
            {children}
        </Paper>
    );
};

BaseTitle.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
};

export default BaseTitle;
