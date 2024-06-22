import React, { useState } from "react";
import {useTranslation} from "react-i18next";
import { makeStyles } from '@mui/styles';
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";

import FrameControls from "../../components/frame-controls";
import ConfigLogo from "../../components/config-logo";

const useStyles = makeStyles((theme) => ({
    dark: {
        backgroundColor: "#151f2b",
        color: "#b1b6c1",
        "& a": {
            color: "#b1b6c1",
        },
    },
    privacyPolicyBox: {
        padding: "20px 20px 20px 20px",
        borderRadius: "4px",
        position: "relative",
    },
    backButton: {
        position: "absolute",
        top: "20px",
        right: "20px",
    },
}));

const PrivacyPolicyView = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const [privacyPolicy, setPrivacyPolicy] = useState("");

    React.useEffect(() => {
        fetch("privacy-policy-content.html")
            .then(async (result) => {
                setPrivacyPolicy(await result.text());
            })
            .catch((error) => {
                console.error(error);
            });
    }, []);

    const back = () => {
        window.location.href = "index.html";
    }

    return (
        <>
            <FrameControls />
            <div className={"wrapper"}>
                <Container className={classes.privacyPolicyBox + " " + classes.dark}>
                    <Button className={classes.backButton} onClick={back} variant="contained"
                            color="primary">{t("BACK")}</Button>
                    <ConfigLogo configKey={'logo'} defaultLogo={'img/logo.png'} height="100%"/>
                    <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                        <i className="fa fa-info-circle" aria-hidden="true"/>
                    </a>
                    <div dangerouslySetInnerHTML={{__html: privacyPolicy}}/>
                </Container>
            </div>
        </>
    );
};
export default PrivacyPolicyView;
