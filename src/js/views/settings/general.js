import React, {useState} from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Divider from "@material-ui/core/Divider";
import { Checkbox, Grid } from "@material-ui/core";

import { Check } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import action from "../../actions/bound-action-creators";
import browserClientService from "../../services/browser-client";
import SelectFieldLanguage from "../../components/select-field/language";
import { languages } from "../../i18n";

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
    textField: {
        width: "100%",
        [theme.breakpoints.up("md")]: {
            width: "440px",
        },
    },
}));

const SettingsGeneralView = (props) => {
    const { t, i18n } = useTranslation();
    const classes = useStyles();
    const disableBrowserPm = useSelector((state) => state.client.disableBrowserPm);

    const [passwordSavingControlledByThisExtension, setPasswordSavingControlledByThisExtension] = useState(false);

    let isSubscribed = true;
    React.useEffect(() => {
        browserClientService.passwordSavingControlledByThisExtension().then(
            function (isControllable) {
                setPasswordSavingControlledByThisExtension(isControllable);
            });
        return () => (isSubscribed = false);
    }, []);

    return (
        <Grid container>
            <Grid item xs={12} sm={12} md={12}>
                <h2>{t("GENERAL")}</h2>
                <p>{t("GENERAL_SETTINGS")}</p>
                <Divider style={{ marginBottom: "20px" }} />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <SelectFieldLanguage
                    className={classes.textField}
                    variant="outlined"
                    margin="dense"
                    required
                    value={!i18n.language || i18n.language in languages ? i18n.language : i18n.resolvedLanguage}
                    onChange={(value) => {
                        i18n.changeLanguage(value).then(() => {
                            browserClientService.emitSec("language-changed", value, function () {});
                        });
                    }}
                />
            </Grid>
            {passwordSavingControlledByThisExtension && (<Grid item xs={12} sm={12} md={12}>
                <Checkbox
                    tabIndex={1}
                    checked={disableBrowserPm}
                    onChange={(event) => {
                        action.setDisableBrowserPm(event.target.checked);
                        browserClientService.disableBrowserPasswordSaving(event.target.checked);
                    }}
                    checkedIcon={<Check className={classes.checkedIcon}/>}
                    icon={<Check className={classes.uncheckedIcon}/>}
                    classes={{
                        checked: classes.checked,
                    }}
                />{" "}
                {t("DISABLE_BROWSER_PM")}
            </Grid>)}
        </Grid>
    );
};

export default SettingsGeneralView;
