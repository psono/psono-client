import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import action from "../../actions/bound-action-creators";
import {useSelector} from "react-redux";

import { makeStyles } from '@mui/styles';
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { Checkbox, Grid } from "@mui/material";
import { Check } from "@mui/icons-material";

import itemBlueprintService from "../../services/item-blueprint";
import GridContainerErrors from "../../components/grid-container-errors";

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
    const [showPasskey, setShowPasskey] = useState(settingsDatastore.showPasskey);
    const [showNote, setShowNote] = useState(settingsDatastore.showNote);
    const [showEnvironmentVariables, setShowEnvironmentVariables] = useState(settingsDatastore.showEnvironmentVariables);
    const [showSSHKey, setShowSSHKey] = useState(settingsDatastore.showSSHKey);
    const [showGPGKey, setShowGPGKey] = useState(settingsDatastore.showGPGKey);
    const [showCreditCard, setShowCreditCard] = useState(settingsDatastore.showCreditCard);
    const [showBookmark, setShowBookmark] = useState(settingsDatastore.showBookmark);
    const [showElsterCertificate, setShowElsterCertificate] = useState(settingsDatastore.showElsterCertificate);
    const [showFile, setShowFile] = useState(settingsDatastore.showFile);
    const [msgs, setMsgs] = React.useState([]);

    const stateLookupDict = {
        "website_password": {
            'value': showWebsitePassword,
            'setter': setShowWebsitePassword,
        },
        "application_password": {
            'value': showApplicationPassword,
            'setter': setShowApplicationPassword,
        },
        "totp": {
            'value': showTOTPAuthenticator,
            'setter': setShowTOTPAuthenticator,
        },
        "passkey": {
            'value': showPasskey,
            'setter': setShowPasskey,
        },
        "note": {
            'value': showNote,
            'setter': setShowNote,
        },
        "environment_variables": {
            'value': showEnvironmentVariables,
            'setter': setShowEnvironmentVariables,
        },
        "ssh_own_key": {
            'value': showSSHKey,
            'setter': setShowSSHKey,
        },
        "mail_gpg_own_key": {
            'value': showGPGKey,
            'setter': setShowGPGKey,
        },
        "credit_card": {
            'value': showCreditCard,
            'setter': setShowCreditCard,
        },
        "bookmark": {
            'value': showBookmark,
            'setter': setShowBookmark,
        },
        "elster_certificate": {
            'value': showElsterCertificate,
            'setter': setShowElsterCertificate,
        },
        "file": {
            'value': showFile,
            'setter': setShowFile,
        }
    }

    React.useEffect(() => {
        setShowWebsitePassword(settingsDatastore.showWebsitePassword);
        setShowApplicationPassword(settingsDatastore.showApplicationPassword);
        setShowTOTPAuthenticator(settingsDatastore.showTOTPAuthenticator);
        setShowPasskey(settingsDatastore.showPasskey);
        setShowNote(settingsDatastore.showNote);
        setShowEnvironmentVariables(settingsDatastore.showEnvironmentVariables);
        setShowSSHKey(settingsDatastore.showSSHKey);
        setShowGPGKey(settingsDatastore.showGPGKey);
        setShowCreditCard(settingsDatastore.showCreditCard);
        setShowBookmark(settingsDatastore.showBookmark);
        setShowElsterCertificate(settingsDatastore.showElsterCertificate);
        setShowFile(settingsDatastore.showFile);
    }, [settingsDatastore]);

    const save = (event) => {
        action().setShownEntriesConfig(
            showWebsitePassword,
            showApplicationPassword,
            showTOTPAuthenticator,
            showPasskey,
            showNote,
            showEnvironmentVariables,
            showSSHKey,
            showGPGKey,
            showCreditCard,
            showBookmark,
            showElsterCertificate,
            showFile,
        );
        setMsgs(["SAVE_SUCCESS"])
    };

    const entryTypes = itemBlueprintService.getEntryTypes();

    return (
        <Grid container>
            <Grid item xs={12} sm={12} md={12}>
                <h2>{t("ENTRY_TYPES")}</h2>
                <p>{t("ENTRY_TYPES_DESCRIPTION")}</p>
                <Divider style={{ marginBottom: "20px" }} />
            </Grid>
            {entryTypes.sort((a, b) => t(a.title).localeCompare(t(b.title))).map((entryType) => (<Grid item xs={12} sm={12} md={12} key={entryType.value}>
                <Checkbox
                    tabIndex={1}
                    checked={stateLookupDict[entryType.value].value}
                    onChange={(event) => {
                        stateLookupDict[entryType.value].setter(event.target.checked);
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

export default SettingsEntryTypesView;
