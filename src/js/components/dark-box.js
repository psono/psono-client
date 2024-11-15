import React from "react";
import {makeStyles} from "@mui/styles";

const useStyles = makeStyles((theme) => ({
    dark: {
        backgroundColor: theme.palette.blueBackground.main,
        color: theme.palette.lightGreyText.main,
        '& a': {
            color: theme.palette.lightGreyText.main,
        },
        '& a.btn-danger': {
            color: theme.palette.lightBackground.main,
        },
        '& h2': {
            padding: '10px 10px',
        },
        '& .btn-danger': {
            backgroundColor: theme.palette.primary.main,
            borderColor: theme.palette.primary.main,
        },
        '& .box-footer': {
            position: 'absolute',
            textAlign: 'center',
            marginLeft: 'auto',
            marginRight: 'auto',
            left: 0,
            right: 0,
            bottom: '-30px',
            '& a': {
                color: '#333333',
            },
        },
        '& .form-control:focus': {
            borderColor: theme.palette.primary.main,
        },
        '& .navigations .dropdown': {
            position: 'absolute',
            right: '3px',
            top: '3px',
        },
        '& .navigations li:hover': {
            backgroundColor: theme.palette.lightBackground.main,
            color: theme.palette.blueBackground.main,
            '& a': {
                color: theme.palette.blueBackground.main,
            },
        },
        '& .navigations li.active': {
            backgroundColor: theme.palette.primary.main,
            '& a': {
                color: theme.palette.lightBackground.main,
            },
        },
    },
}));

const DarkBox = ({children, className, ...rest}) => {
    const classes = useStyles();
    return (
        <div className={`${classes.dark} ${className || ""}`} {...rest}>
            {children}
        </div>
    );
};

export default DarkBox;
