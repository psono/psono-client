import React, {useState} from "react";
import {useTranslation} from "react-i18next";
import {makeStyles, useTheme} from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Hidden from '@material-ui/core/Hidden';

import browserClient from "../../services/browser-client";
import {BarLoader, ClipLoader} from "react-spinners";
import ConfigLogo from "../../components/config-logo";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        backgroundColor: "#151f2b",
        color: "#b1b6c1",
    },
    buttonLabel: {
        fontSize: "1.5rem",
    },
    logoImg: {
        height: "38px",
        paddingTop: "10px",
        paddingLeft: "10px",
    },
    textContainer: {
        display: "table",
        marginTop: "5px",
        marginLeft: "10px",
    },
    textContainerCell: {
        display: "table-cell",
        verticalAlign: "middle",
    },
    textContainerTitle: {
        fontWeight: "bold",
    },
    buttonContainer: {
        display: "flex",
        marginLeft: "auto",
        paddingTop: "5px",
        verticalAlign: "middle",
    },
    button: {
        marginLeft: '5px',
        height: "38px"
    },
    close: {
        color: "#b1b6c1",
        padding: "6px",
    },
    loader: {
        textAlign: "center",
        marginTop: "20px",
        marginBottom: "20px",
        margin: "auto",
    },
}));


const NotificationBarView = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const theme = useTheme();
    const [state, setState] = useState({
        buttons: []
    });


    React.useEffect(() => {
        browserClient.emitSec("notification-bar-loaded", {}, function(result) {
            setState(result)
        })
    }, []);

    const buttonClick = (index) => {
        browserClient.emitSec("notification-bar-button-click", {
            "id": state.id,
            "index": index,
        });
    };
    const closeButtonClicked = (event) => {
        browserClient.emitSec("notification-bar-close", {});
    };

    if (!state.id) {
        return (
            <div className={classes.root}>
                <div className={classes.loader}>
                    <ClipLoader color={theme.palette.primary.main}/>
                </div>
            </div>)
    }

    return (<div className={classes.root}>
            <Hidden xsDown>
                <div className={classes.logoImg}>
                    <a href="https://psono.com" target="_blank">
                        <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} height="100%"/>
                    </a>
                </div>
            </Hidden>
            <div className={classes.textContainer}>
                <div className={classes.textContainerCell}>
                    <span className={classes.textContainerTitle}>{state.title}:</span>&nbsp;
                    {state.description}
                </div>
            </div>
            <div className={classes.buttonContainer}>
                {state.buttons.map((button, index) => {
                    return (<Button
                        className={classes.button}
                        variant="contained"
                        color={button.color}
                        onClick={() => buttonClick(index)}
                    >
                        {button.title}
                    </Button>)
                })}
                <Button
                    className={classes.button + " " + classes.close}
                    onClick={closeButtonClicked}
                >
                    <span className={classes.buttonLabel}>&times;</span>
                </Button>
            </div>

        </div>
    );
};

export default NotificationBarView;
