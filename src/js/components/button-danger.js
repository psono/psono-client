import * as React from "react";
import Button from "@mui/material/Button";
import { makeStyles } from '@mui/styles';

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
