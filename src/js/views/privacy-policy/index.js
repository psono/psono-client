import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import axios from "axios";

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
    },
}));

const PrivacyPolicyView = (props) => {
    const classes = useStyles();
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

    return (
        <div className={"wrapper"}>
            <Container className={classes.privacyPolicyBox + " " + classes.dark}>
                <div dangerouslySetInnerHTML={{ __html: privacyPolicy }} />
            </Container>
        </div>
    );
};
export default PrivacyPolicyView;
