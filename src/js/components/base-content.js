import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        width: "100%",
        marginLeft: "15px",
        overflowX: "visible",
        maxWidth: `calc(100% - 30px)`,
        [theme.breakpoints.up("sm")]: {
            maxWidth: `calc(100% - 270px)`,
        },
    },
}));

const BaseContent = (props) => {
    const classes = useStyles();
    const { children } = props;

    return <div className={classes.root}>{children}</div>;
};

BaseContent.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
};

export default BaseContent;
