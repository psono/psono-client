import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Divider from "@material-ui/core/Divider";
import { Checkbox, Grid } from "@material-ui/core";

import { Check } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import store from "../../services/store";
import action from "../../actions/bound-action-creators";

const useStyles = makeStyles((theme) => ({
    checked: {
        color: "#9c27b0",
    },
    checkedIcon: {
        width: "20px",
        height: "20px",
        border: "1px solid #666",
        borderRadius: "3px",
    },
    uncheckedIcon: {
        width: "0px",
        height: "0px",
        padding: "9px",
        border: "1px solid #666",
        borderRadius: "3px",
    },
}));

const SettingsNotificationView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const [notificationOnCopy, setNotificationOnCopy] = useState(store.getState().client.notificationOnCopy);

    return (
        <Grid container>
            <Grid item xs={12} sm={12} md={12}>
                <h2>{t("NOTIFICATIONS")}</h2>
                <p>{t("NOTIFICATIONS_DESCRIPTION")}</p>
                <Divider style={{ marginBottom: "20px" }} />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <Checkbox
                    tabIndex={1}
                    checked={notificationOnCopy}
                    onChange={(event) => {
                        setNotificationOnCopy(event.target.checked);
                        action.setNotificationOnCopy(event.target.checked);
                    }}
                    checkedIcon={<Check className={classes.checkedIcon} />}
                    icon={<Check className={classes.uncheckedIcon} />}
                    classes={{
                        checked: classes.checked,
                    }}
                />{" "}
                {t("ENABLE_NOTIFICATION_COPY")}
            </Grid>
        </Grid>
    );
};

export default SettingsNotificationView;
