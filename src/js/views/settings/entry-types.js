import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Divider from "@material-ui/core/Divider";
import { Checkbox, Grid } from "@material-ui/core";

import { Check } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import store from "../../services/store";
import action from "../../actions/bound-action-creators";
import {useSelector} from "react-redux";
import Button from "@material-ui/core/Button";

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

const SettingsEntryTypesView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const settingsDatastore = useSelector((state) => state.settingsDatastore);
    const [showWebsitePassword, setShowWebsitePassword] = useState(settingsDatastore.showWebsitePassword);
    const [showApplicationPassword, setShowApplicationPassword] = useState(settingsDatastore.showApplicationPassword);
    const [showTOTPAuthenticator, setShowTOTPAuthenticator] = useState(settingsDatastore.showTOTPAuthenticator);
    const [showNote, setShowNote] = useState(settingsDatastore.showNote);
    const [showEnvironmentVariables, setShowEnvironmentVariables] = useState(settingsDatastore.showEnvironmentVariables);
    const [showSSHKey, setShowSSHKey] = useState(settingsDatastore.showSSHKey);
    const [showGPGKey, setShowGPGKey] = useState(settingsDatastore.showGPGKey);
    const [showCreditCard, setShowCreditCard] = useState(settingsDatastore.showCreditCard);
    const [showBookmark, setShowBookmark] = useState(settingsDatastore.showBookmark);
    const [showFile, setShowFile] = useState(settingsDatastore.showFile);

    React.useEffect(() => {
        setShowWebsitePassword(settingsDatastore.showWebsitePassword);
        setShowApplicationPassword(settingsDatastore.showApplicationPassword);
        setShowTOTPAuthenticator(settingsDatastore.showTOTPAuthenticator);
        setShowNote(settingsDatastore.showNote);
        setShowEnvironmentVariables(settingsDatastore.showEnvironmentVariables);
        setShowSSHKey(settingsDatastore.showSSHKey);
        setShowGPGKey(settingsDatastore.showGPGKey);
        setShowCreditCard(settingsDatastore.showCreditCard);
        setShowBookmark(settingsDatastore.showBookmark);
        setShowFile(settingsDatastore.showFile);
    }, [settingsDatastore]);

    const save = (event) => {
        action.setShownEntriesConfig(
            showWebsitePassword,
            showApplicationPassword,
            showTOTPAuthenticator,
            showNote,
            showEnvironmentVariables,
            showSSHKey,
            showGPGKey,
            showCreditCard,
            showBookmark,
            showFile,
        );
    };

    return (
        <Grid container>
            <Grid item xs={12} sm={12} md={12}>
                <h2>{t("ENTRY_TYPES")}</h2>
                <p>{t("ENTRY_TYPES_DESCRIPTION")}</p>
                <Divider style={{ marginBottom: "20px" }} />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <Checkbox
                    tabIndex={1}
                    checked={showWebsitePassword}
                    onChange={(event) => {
                        setShowWebsitePassword(event.target.checked);
                    }}
                    checkedIcon={<Check className={classes.checkedIcon} />}
                    icon={<Check className={classes.uncheckedIcon} />}
                    classes={{
                        checked: classes.checked,
                    }}
                />{" "}
                {t("WEBSITE_PASSWORD")}
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <Checkbox
                    tabIndex={1}
                    checked={showApplicationPassword}
                    onChange={(event) => {
                        setShowApplicationPassword(event.target.checked);
                    }}
                    checkedIcon={<Check className={classes.checkedIcon} />}
                    icon={<Check className={classes.uncheckedIcon} />}
                    classes={{
                        checked: classes.checked,
                    }}
                />{" "}
                {t("APPLICATION_PASSWORD")}
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <Checkbox
                    tabIndex={1}
                    checked={showTOTPAuthenticator}
                    onChange={(event) => {
                        setShowTOTPAuthenticator(event.target.checked);
                    }}
                    checkedIcon={<Check className={classes.checkedIcon} />}
                    icon={<Check className={classes.uncheckedIcon} />}
                    classes={{
                        checked: classes.checked,
                    }}
                />{" "}
                {t("TOTP_AUTHENTICATOR")}
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <Checkbox
                    tabIndex={1}
                    checked={showNote}
                    onChange={(event) => {
                        setShowNote(event.target.checked);
                    }}
                    checkedIcon={<Check className={classes.checkedIcon} />}
                    icon={<Check className={classes.uncheckedIcon} />}
                    classes={{
                        checked: classes.checked,
                    }}
                />{" "}
                {t("NOTE")}
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <Checkbox
                    tabIndex={1}
                    checked={showEnvironmentVariables}
                    onChange={(event) => {
                        setShowEnvironmentVariables(event.target.checked);
                    }}
                    checkedIcon={<Check className={classes.checkedIcon} />}
                    icon={<Check className={classes.uncheckedIcon} />}
                    classes={{
                        checked: classes.checked,
                    }}
                />{" "}
                {t("ENVIRONMENT_VARIABLES")}
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <Checkbox
                    tabIndex={1}
                    checked={showSSHKey}
                    onChange={(event) => {
                        setShowSSHKey(event.target.checked);
                    }}
                    checkedIcon={<Check className={classes.checkedIcon} />}
                    icon={<Check className={classes.uncheckedIcon} />}
                    classes={{
                        checked: classes.checked,
                    }}
                />{" "}
                {t("SSH_KEY")}
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <Checkbox
                    tabIndex={1}
                    checked={showGPGKey}
                    onChange={(event) => {
                        setShowGPGKey(event.target.checked);
                    }}
                    checkedIcon={<Check className={classes.checkedIcon} />}
                    icon={<Check className={classes.uncheckedIcon} />}
                    classes={{
                        checked: classes.checked,
                    }}
                />{" "}
                {t("GPG_KEY")}
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <Checkbox
                    tabIndex={1}
                    checked={showCreditCard}
                    onChange={(event) => {
                        setShowCreditCard(event.target.checked);
                    }}
                    checkedIcon={<Check className={classes.checkedIcon} />}
                    icon={<Check className={classes.uncheckedIcon} />}
                    classes={{
                        checked: classes.checked,
                    }}
                />{" "}
                {t("CREDIT_CARD")}
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <Checkbox
                    tabIndex={1}
                    checked={showBookmark}
                    onChange={(event) => {
                        setShowBookmark(event.target.checked);
                    }}
                    checkedIcon={<Check className={classes.checkedIcon} />}
                    icon={<Check className={classes.uncheckedIcon} />}
                    classes={{
                        checked: classes.checked,
                    }}
                />{" "}
                {t("BOOKMARK")}
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <Checkbox
                    tabIndex={1}
                    checked={showFile}
                    onChange={(event) => {
                        setShowFile(event.target.checked);
                    }}
                    checkedIcon={<Check className={classes.checkedIcon} />}
                    icon={<Check className={classes.uncheckedIcon} />}
                    classes={{
                        checked: classes.checked,
                    }}
                />{" "}
                {t("FILE")}
            </Grid>
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
        </Grid>
    );
};

export default SettingsEntryTypesView;
