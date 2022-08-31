import * as React from "react";
import { differenceInSeconds } from "date-fns";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import MuiAlert from "@material-ui/lab/Alert";

function AlertSecurityReport(props) {
    const { t } = useTranslation();
    const serverStatus = useSelector((state) => state.server.status);
    const recurrenceInterval = useSelector((state) => state.server.complianceCentralSecurityReportsRecurrenceInterval);

    let newSecurityReport = "NOT_REQUIRED";
    if (recurrenceInterval > 0) {
        if (
            serverStatus.hasOwnProperty("data") &&
            serverStatus.data.hasOwnProperty("last_security_report_created") &&
            serverStatus.data.last_security_report_created !== null
        ) {
            const lastSecurityReportAgeSeconds = differenceInSeconds(
                new Date(),
                new Date(serverStatus.data.last_security_report_created)
            );

            if (lastSecurityReportAgeSeconds > recurrenceInterval) {
                newSecurityReport = "REQUIRED";
            } else {
                const days_28 = 28 * 24 * 3600;
                const days_14 = 14 * 24 * 3600;
                if (recurrenceInterval >= days_28 && lastSecurityReportAgeSeconds > recurrenceInterval - days_14) {
                    newSecurityReport = "SOON_REQUIRED";
                } else {
                    newSecurityReport = "NOT_REQUIRED";
                }
            }
        } else {
            newSecurityReport = "REQUIRED";
        }
    }
    return (
        <React.Fragment>
            {(newSecurityReport === "SOON_REQUIRED" || newSecurityReport === "REQUIRED") && (
                <MuiAlert
                    severity={newSecurityReport === "REQUIRED" ? "error" : "info"}
                    {...props}
                >
                    {newSecurityReport === "REQUIRED"
                        ? t("SECURITY_REPORT_REQUIRED")
                        : t("SECURITY_REPORT_SOON_REQUIRED")}
                </MuiAlert>
            )}
        </React.Fragment>
    );
}

export default AlertSecurityReport;
