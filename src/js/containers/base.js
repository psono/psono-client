import React from "react";
import PropTypes from "prop-types";
import CssBaseline from "@material-ui/core/CssBaseline";
import { makeStyles } from "@material-ui/core/styles";
import Sidebar from "./sidebar";
import Topbar from "./topbar";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
    },
    // necessary for content to be below app bar
    toolbar: {
        minHeight: "50px",
    },
    fullContent: {
        flexGrow: 1,
    },
    content: {
        height: "100%",
        width: "100%",
        overflow: "auto",
        backgroundColor: "#ebeeef",
        position: "absolute",
        paddingBottom: "30px",
    },
}));

const Base = (props) => {
    const classes = useStyles();
    const { children } = props;
    const [mobileOpen, setMobileOpen] = React.useState(false);

    return (
        <div className={classes.root}>
            <CssBaseline />
            <Topbar {...props} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
            <Sidebar {...props} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
            <div className={classes.fullContent}>
                <div className={classes.toolbar} />
                <div className={classes.content}>{children}</div>
            </div>
        </div>
    );
};

Base.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
};

export default Base;
