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
            fontSize: '0.8rem',
            left: 0,
            right: 0,
            bottom: '-50px',
            height: '40px',
            overflowY: 'hidden',
            '& a': {
                color: '#666666',
            },
        },
        '& .full-width-box-footer': {
            position: 'absolute',
            textAlign: 'center',
            marginLeft: 'auto',
            marginRight: 'auto',
            fontSize: '0.8rem',
            left: 0,
            right: 0,
            overflowY: 'hidden',
            '& a': {
                color: '#666666',
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
