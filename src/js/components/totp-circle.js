import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { useTranslation } from "react-i18next";
import { useHotkeys } from 'react-hotkeys-hook'

import ContentCopy from "./icons/ContentCopy";
import cryptoLibraryService from "../services/crypto-library";
import browserClientService from "../services/browser-client";
import notification from "../services/notification";

const TotpCircle = (props) => {
    const { period, digits, algorithm, code, ...rest } = props;
    const { t } = useTranslation();
    const [progress, setProgress] = React.useState(10);
    const [token, setToken] = useState("");

    useHotkeys('alt+t', () => {
        // copy username
        onCopyTotpToken();
    })

    // setInterval is wrapped in a closure and as such it would not use the current props / state
    // https://github.com/facebook/react/issues/14010
    const periodRef = useRef(period);
    periodRef.current = period;
    const digitsRef = useRef(digits);
    digitsRef.current = digits;
    const algorithmRef = useRef(algorithm);
    algorithmRef.current = algorithm;
    const codeRef = useRef(code);
    codeRef.current = code;

    const updateToken = () => {
        setToken(
            cryptoLibraryService.getTotpToken(
                codeRef.current,
                periodRef.current,
                algorithmRef.current,
                digitsRef.current
            )
        );
        const percentage =
            100 -
            (((periodRef.current || 30) - (Math.round(new Date().getTime() / 1000.0) % (periodRef.current || 30))) /
                (periodRef.current || 30)) *
                100;
        setProgress(percentage);
    };

    React.useEffect(() => {
        updateToken();
        const timer = setInterval(updateToken, 500);
        return () => {
            clearInterval(timer);
        };
    }, []);

    const onCopyTotpToken = (event) => {
        browserClientService.copyToClipboard(() => Promise.resolve(token));
        notification.push("totp_token_copy", t("TOTP_TOKEN_COPY_NOTIFICATION"));
    };


    return (
        <Box position="relative" display="inline-flex" {...rest}>
            <CircularProgress variant="determinate" value={progress} size={"100%"} />
            <Box
                top={0}
                left={0}
                bottom={0}
                right={0}
                position="absolute"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Button
                    endIcon={<ContentCopy>copy</ContentCopy>}
                    onClick={onCopyTotpToken}
                >
                    {token}
                </Button>
            </Box>
        </Box>
    );
};

TotpCircle.defaultProps = {
    period: 30,
    digits: 6,
    algorithm: "SHA1",
    code: "",
};

TotpCircle.propTypes = {
    period: PropTypes.number,
    digits: PropTypes.number,
    algorithm: PropTypes.string,
    code: PropTypes.string,
};

export default TotpCircle;
