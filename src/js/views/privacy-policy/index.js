import React, { useState } from "react";
import {useTranslation} from "react-i18next";
import axios from "axios";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import Button from "@material-ui/core/Button";

import FrameControls from "../../components/frame-controls";

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
        axios({
            method: "get",
            url: "privacy-policy-content.html",
        })
            .then((result) => {
                setPrivacyPolicy(result.data);
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
                    <Button className={classes.backButton} onClick={back} variant="contained" color="primary">{t("BACK")}</Button>
                    <div dangerouslySetInnerHTML={{ __html: privacyPolicy }} />
                </Container>
            </div>
        </>
    );
};
export default PrivacyPolicyView;
