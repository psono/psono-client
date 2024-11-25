import React, {useState} from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import Divider from "@mui/material/Divider";
import { Checkbox, Grid } from "@mui/material";
import TextField from "@mui/material/TextField";
import { Check } from "@mui/icons-material";
import { makeStyles } from '@mui/styles';
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";

import GridContainerErrors from "../../components/grid-container-errors";
import action from "../../actions/bound-action-creators";
import browserClientService from "../../services/browser-client";
import SelectFieldLanguage from "../../components/select-field/language";
import userService from "../../services/user";
import optionsBlueprintService from "../../services/options-blueprint";
import { languages } from "../../i18n";
import IconButton from "@mui/material/IconButton";
import ContentCopy from "../../components/icons/ContentCopy";

const useStyles = makeStyles((theme) => ({
    checked: {
        color: theme.palette.checked.main,
    },
    checkedIcon: {
        width: "20px",
        height: "20px",
        border: `1px solid ${theme.palette.greyText.main}`,
        borderRadius: "3px",
    },
    uncheckedIcon: {
        width: "0px",
        height: "0px",
        padding: "9px",
        border: `1px solid ${theme.palette.greyText.main}`,
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
    const settingsDatastore = useSelector((state) => state.settingsDatastore);
    const [noSaveMode, setNoSaveMode] = useState(settingsDatastore.noSaveMode);
    const [showNoSaveToggle, setShowNoSaveToggle] = useState(settingsDatastore.showNoSaveToggle);
    const [confirmOnUnsavedChanges, setConfirmOnUnsavedChanges] = useState(settingsDatastore.confirmOnUnsavedChanges);

    const [clipboardClearDelay, setClipboardClearDelay] = useState(settingsDatastore.clipboardClearDelay);
    const [msgs, setMsgs] = React.useState([]);


    const stateLookupDict = {
        "nosave": {
            'value': noSaveMode,
            'setter': setNoSaveMode,
        },
        "nosavetoggle": {
            'value': showNoSaveToggle,
            'setter': setShowNoSaveToggle,
        },
        "confirm_unsaved": {
            'value': confirmOnUnsavedChanges,
            'setter': setConfirmOnUnsavedChanges,
        },
    };
    React.useEffect(() => {
        setNoSaveMode(settingsDatastore.noSaveMode);
        setShowNoSaveToggle(settingsDatastore.showNoSaveToggle);
        setConfirmOnUnsavedChanges(settingsDatastore.confirmOnUnsavedChanges);
    }, [settingsDatastore]);

    const save = (event) => {
        action().setClientOptionsConfig(
            parseInt(clipboardClearDelay) || 0,
            stateLookupDict['nosave'].value,
            stateLookupDict['nosavetoggle'].value,
            stateLookupDict['confirm_unsaved'].value,
        );
        setMsgs(["SAVE_SUCCESS"])
    };
    const entryTypes = optionsBlueprintService.getEntryTypes();

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
                    margin="dense" size="small"
                    required
                    value={!i18n.language || i18n.language in languages ? i18n.language : i18n.resolvedLanguage}
                    onChange={(value) => {
                        i18n.changeLanguage(value).then(() => {
                            browserClientService.emitSec("language-changed", value, function () {});
                            userService.saveNewLanguage(value);
                        });
                    }}
                />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <TextField
                    className={classes.textField}
                    variant="outlined"
                    margin="dense" size="small"
                    id="clipboardClearDelay"
                    label={t("CLIPBOARD_CLEAR_DELAY")}
                    helperText={t("CLIPBOARD_CLEAR_DELAY_EXPLAINED")}
                    name="clipboardClearDelay"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                {t("SEC")}
                            </InputAdornment>
                        ),
                    }}
                    autoComplete="off"
                    value={clipboardClearDelay}
                    onChange={(event) => {
                        setClipboardClearDelay(event.target.value);
                    }}
                />
            </Grid>
            {passwordSavingControlledByThisExtension && (<Grid item xs={12} sm={12} md={12}>
                <Checkbox
                    tabIndex={1}
                    checked={disableBrowserPm}
                    onChange={(event) => {
                        action().setDisableBrowserPm(event.target.checked);
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
            {entryTypes.sort((a, b) => t(a.title).localeCompare(t(b.title))).map((entryType) => (<Grid item xs={12} sm={12} md={12} key={entryType.value}>
                <Checkbox
                    tabIndex={1}
                    checked={stateLookupDict[entryType.value].value}
                    onChange={(event) => {
                        stateLookupDict[entryType.value].setter(event.target.checked)
                    }}
                    checkedIcon={<Check className={classes.checkedIcon} />}
                    icon={<Check className={classes.uncheckedIcon} />}
                    classes={{
                        checked: classes.checked,
                    }}
                />{" "}
                {t(entryType.title)}
            </Grid>))}
            <Grid container style={{ marginBottom: "8px",  marginTop: "8px" }}>
                <Grid item xs={12} sm={12} md={12}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={save}
                    >
                        {t("SAVE")}
                    </Button>
                </Grid>
            </Grid>
            <GridContainerErrors errors={msgs} setErrors={setMsgs} severity={"info"} />

        </Grid>
    );
};

export default SettingsGeneralView;
