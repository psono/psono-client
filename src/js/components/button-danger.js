import * as React from "react";
import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
    root: {
        backgroundColor: theme.palette.error.main,
        color: theme.palette.error.contrastText,
        "&:hover": {
            backgroundColor: theme.palette.error.dark,
        },
        "&:disabled": {
            backgroundColor: theme.palette.error.light,
        },
    },
}));

const ButtonDanger = (props) => {
    const classes = useStyles();
    const { className, ...rest } = props;

    return <Button {...props} className={`${className} ${classes.root}`} variant="contained" />;
};

export default ButtonDanger;
