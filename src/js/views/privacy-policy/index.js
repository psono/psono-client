import React, { useState } from "react";
import Container from "@material-ui/core/Container";
import axios from "axios";

const PrivacyPolicyView = (props) => {
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
            <Container className={"privacypolicybox dark"}>
                <div dangerouslySetInnerHTML={{ __html: privacyPolicy }} />
            </Container>
        </div>
    );
};
export default PrivacyPolicyView;
