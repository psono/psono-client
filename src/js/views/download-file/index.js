import React from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import MuiAlert from "@material-ui/lab/Alert";
import Box from "@material-ui/core/Box";
import LinearProgress from "@material-ui/core/LinearProgress";
import { useParams } from "react-router-dom";
import store from "../../services/store";
import fileTransferService from "../../services/file-transfer";

const useStyles = makeStyles((theme) => ({
    textCenter: {
        textAlign: "center",
    },
}));

const DownloadFileView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const [percentageComplete, setPercentageComplete] = React.useState(0);
    const [nextStep, setNextStep] = React.useState("");
    const [processing, setProcessing] = React.useState(false);
    const [errors, setErrors] = React.useState([]);
    const creditBuyAddress = store.getState().server.credit_buy_address;
    let { id } = useParams();

    let openRequests = 0;
    let closedRequest = 0;

    React.useEffect(() => {
        fileTransferService.register("download_started", function (max) {
            setProcessing(true);
            openRequests = max + 1;
        });

        fileTransferService.register("download_step_complete", function (newNextStep) {
            closedRequest = closedRequest + 1;
            setPercentageComplete(Math.round((closedRequest / openRequests) * 1000) / 10);
            setNextStep(newNextStep);
        });

        fileTransferService.register("download_complete", function () {
            closedRequest = closedRequest + 1;
            setPercentageComplete(100);
            setProcessing(true);
            setNextStep("DOWNLOAD_COMPLETED");
        });

        const onSuccess = function (data) {
            // pass
        };

        const onError = function (data) {
            if (data.hasOwnProperty("non_field_errors")) {
                setErrors(data.non_field_errors);
                setNextStep("");
                setProcessing(false);
            } else {
                console.log(data);
                alert("Error, should not happen.");
            }
        };
        fileTransferService.downloadFileByStorageId(id).then(onSuccess, onError);
    }, []);

    return (
        <div className={"progress-box " + classes.textCenter}>
            <img src="img/logo.png" alt="Psono Web Client" id="logo" />
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true" />
            </a>

            {processing && (
                <Box display="flex" alignItems="center">
                    <Box width="100%" mr={1}>
                        <LinearProgress variant="determinate" value={percentageComplete} />
                    </Box>
                    <Box minWidth={35}>
                        <span style={{ color: "white", whiteSpace: "nowrap" }}>{percentageComplete} %</span>
                    </Box>
                </Box>
            )}
            {processing && <span>{t(nextStep)}</span>}

            {errors.length > 0 && (
                <div className="form-group alert alert-danger" ng-repeat="e in errors">
                    <strong>{t("ERROR")}:</strong>

                    {errors.map((prop, index) => {
                        return (
                            <MuiAlert
                                onClose={() => {
                                    setErrors([]);
                                }}
                                key={index}
                                severity="error"
                                style={{ marginBottom: "5px" }}
                            >
                                {(prop !== "INSUFFICIENT_FUNDS" || !creditBuyAddress) && <span>{t(prop)}</span>}
                                {prop === "INSUFFICIENT_FUNDS" && creditBuyAddress && <span>{t("INSUFFICIENT_FUNDS_WITH_CREDIT_BUY_ADDRESS")}</span>}
                                {prop === "INSUFFICIENT_FUNDS" && creditBuyAddress && (
                                    <a href={creditBuyAddress} rel="nofollow noopener" target="_blank">
                                        <span>{t("BUY")}</span>
                                    </a>
                                )}
                            </MuiAlert>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DownloadFileView;
