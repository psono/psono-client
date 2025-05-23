import React, {useState, useRef, useEffect} from "react";
import {useTranslation} from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { makeStyles } from '@mui/styles';
import Button from "@mui/material/Button";
import Hidden from '@mui/material/Hidden';

import browserClient from "../../services/browser-client";
import {ClipLoader} from "react-spinners";
import ConfigLogo from "../../components/config-logo";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        backgroundColor: theme.palette.blueBackground.main,
        color: theme.palette.lightGreyText.main,
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
        maxHeight: "40px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        fontSize: "clamp(10px, 1rem, 16px)", // Responsive font size between 10px and 16px
        lineHeight: "1.2", // Tighter line height to fit in the box
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
        height: "38px",
        whiteSpace: "nowrap",
        minWidth: "32px",
    },
    close: {
        color: theme.palette.lightGreyText.main,
        padding: "6px",
    },
    loader: {
        textAlign: "center",
        marginTop: "20px",
        marginBottom: "20px",
        margin: "auto",
    },
    regularButtonText: {
        color: theme.palette.lightGreyText.main,
    },
}));


const NotificationBarView = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const theme = useTheme();
    const [state, setState] = useState({
        buttons: []
    });
    const textContainerRef = useRef(null);
    const [textStyle, setTextStyle] = useState({});
    
    // Scale text to fit container
    const adjustTextSize = () => {
        if (!textContainerRef.current) return;
        
        const container = textContainerRef.current;
        const containerHeight = 44; // Maximum height
        
        // Reset font size for accurate measurement
        container.style.fontSize = '';
        
        // Check if content overflows
        if (container.scrollHeight > containerHeight) {
            // Calculate ratio to scale down
            const ratio = containerHeight / container.scrollHeight;
            const newSize = Math.max(10, Math.floor(parseFloat(getComputedStyle(container).fontSize) * ratio));
            
            setTextStyle({
                fontSize: `${newSize}px`,
                lineHeight: '1.2',
            });
        } else {
            setTextStyle({});
        }
    };

    // Initial load
    React.useEffect(() => {
        browserClient.emitSec("notification-bar-loaded", {}, function(result) {
            setState(result);
        });
    }, []);
    
    // Adjust text size when content changes
    React.useEffect(() => {
        if (state.id) {
            // Allow DOM to update before measuring
            setTimeout(adjustTextSize, 0);
        }
    }, [state.title, state.description]);

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

    return (
        <div className={classes.root}>
                <Hidden smDown>
                    <div className={classes.logoImg}>
                        <a href="https://psono.com" target="_blank">
                            <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} height="100%"/>
                        </a>
                    </div>
                </Hidden>
                <div className={classes.textContainer}>
                    <div 
                        ref={textContainerRef}
                        className={classes.textContainerCell}
                        style={textStyle}
                    >
                        <span className={classes.textContainerTitle}>{state.title}:</span>&nbsp;
                        {state.description}
                    </div>
                </div>
                <div className={classes.buttonContainer}>
                    {state.buttons.map((button, index) => {
                        if (button.color === "primary") {
                            return (<Button
                                className={classes.button}
                                variant="contained"
                                color={button.color}
                                onClick={() => buttonClick(index)}
                            >
                                {button.title}
                            </Button>)
                        } else {
                            return (<Button
                                className={classes.button}
                                color={button.color}
                                onClick={() => buttonClick(index)}
                            >
                                <span className={classes.regularButtonText}>{button.title}</span>
                            </Button>)
                        }
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
