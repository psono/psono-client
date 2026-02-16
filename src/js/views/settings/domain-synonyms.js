import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import Divider from "@mui/material/Divider";
import { Grid, Chip, IconButton, TextField, Box, Typography, InputAdornment } from "@mui/material";
import { makeStyles } from '@mui/styles';
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

import GridContainerErrors from "../../components/grid-container-errors";
import action from "../../actions/bound-action-creators";
import domainSynonymsService from "../../services/domain-synonyms";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
        [theme.breakpoints.up("md")]: {
            maxWidth: "600px",
        },
    },
    chip: {
        margin: theme.spacing(0.5),
    },
    hardcodedChip: {
        margin: theme.spacing(0.5),
        backgroundColor: theme.palette.action.disabledBackground,
    },
    groupContainer: {
        marginBottom: theme.spacing(2),
        padding: theme.spacing(2),
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
    },
    hardcodedContainer: {
        marginBottom: theme.spacing(3),
        padding: theme.spacing(2),
        backgroundColor: theme.palette.action.hover,
        borderRadius: theme.shape.borderRadius,
    },
}));

const SettingsDomainSynonymsView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const settingsDatastore = useSelector((state) => state.settingsDatastore);
    const serverState = useSelector((state) => state.server);
    const [customGroups, setCustomGroups] = useState(
        (settingsDatastore.customDomainSynonyms || []).map(group => group.join(", "))
    );
    const [msgs, setMsgs] = useState([]);
    const [errors, setErrors] = useState([]);

    const hardcodedGroups = domainSynonymsService.getHardcodedSynonyms();
    const serverGroups = serverState.domainSynonyms || [];

    React.useEffect(() => {
        setCustomGroups((settingsDatastore.customDomainSynonyms || []).map(group => group.join(", ")));
    }, [settingsDatastore]);

    const isValidDomain = (domain) => {
        const trimmed = domain.trim();
        if (!trimmed) return false;
        const domainRegex = /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*(\:[0-9*]+)?$/;
        return domainRegex.test(trimmed);
    };

    const addGroup = () => {
        setCustomGroups([...customGroups, ""]);
    };

    const deleteGroup = (index) => {
        const newGroups = customGroups.filter((_, i) => i !== index);
        setCustomGroups(newGroups);
    };

    const updateGroup = (index, domainsString) => {
        const newGroups = [...customGroups];
        newGroups[index] = domainsString;
        setCustomGroups(newGroups);
    };

    const save = () => {
        const validationErrors = [];
        const validGroups = [];

        customGroups.forEach((groupString, groupIndex) => {
            const domains = groupString
                .split(/[,\s]+/)
                .map(d => d.trim().toLowerCase())
                .filter(d => d);

            if (domains.length === 0) {
                return;
            }

            if (domains.length < 2) {
                validationErrors.push(`Group ${groupIndex + 1}: ${t("DOMAIN_SYNONYMS_NEED_TWO_DOMAINS")}`);
                return;
            }

            const invalidDomains = domains.filter(domain => !isValidDomain(domain));
            if (invalidDomains.length > 0) {
                validationErrors.push(`Group ${groupIndex + 1}: ${t("INVALID_DOMAIN_FORMAT")} - ${invalidDomains.join(", ")}`);
                return;
            }

            validGroups.push(domains);
        });

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            setMsgs([]);
            return;
        }

        action().setDomainSynonymsConfig(validGroups);

        setErrors([]);
        setMsgs(["SAVE_SUCCESS"]);
    };

    return (
        <Grid container>
            <Grid item xs={12} sm={12} md={12}>
                <h2>{t("DOMAIN_SYNONYMS")}</h2>
                <p>{t("DOMAIN_SYNONYMS_DESCRIPTION")}</p>
                <Divider style={{ marginBottom: "20px" }} />
            </Grid>

            {/* Hardcoded Domain Synonyms Section */}
            <Grid item xs={12} sm={12} md={12}>
                <Box className={classes.hardcodedContainer}>
                    <Typography variant="h6" gutterBottom>
                        {t("HARDCODED_DOMAIN_SYNONYMS")}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        {t("HARDCODED_DOMAIN_SYNONYMS_DESCRIPTION")}
                    </Typography>
                    {hardcodedGroups.map((group, index) => (
                        <Box key={index} sx={{ marginTop: 2 }}>
                            {group.map((domain, domainIndex) => (
                                <Chip
                                    key={domainIndex}
                                    label={domain}
                                    className={classes.hardcodedChip}
                                    size="small"
                                />
                            ))}
                        </Box>
                    ))}
                </Box>
            </Grid>

            {/* Server-provided Domain Synonyms Section */}
            {serverGroups.length > 0 && (
                <Grid item xs={12} sm={12} md={12} style={{ marginTop: "20px" }}>
                    <Box className={classes.hardcodedContainer}>
                        <Typography variant="h6" gutterBottom>
                            {t("SERVER_DOMAIN_SYNONYMS")}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            {t("SERVER_DOMAIN_SYNONYMS_DESCRIPTION")}
                        </Typography>
                        {serverGroups.map((group, index) => (
                            <Box key={index} sx={{ marginTop: 2 }}>
                                {group.map((domain, domainIndex) => (
                                    <Chip
                                        key={domainIndex}
                                        label={domain}
                                        className={classes.hardcodedChip}
                                        size="small"
                                    />
                                ))}
                            </Box>
                        ))}
                    </Box>
                </Grid>
            )}

            {/* Custom Domain Synonyms Section */}
            <Grid item xs={12} sm={12} md={12} style={{ marginTop: "20px" }}>
                <Typography variant="h6" gutterBottom>
                    {t("CUSTOM_DOMAIN_SYNONYMS")}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                    {t("CUSTOM_DOMAIN_SYNONYMS_DESCRIPTION")}
                </Typography>
            </Grid>

            {customGroups.map((groupString, index) => (
                <Grid item xs={12} sm={12} md={12} key={index}>
                    <Box className={classes.groupContainer}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            size="small"
                            label={`${t("DOMAIN_SYNONYM_GROUP")} ${index + 1}`}
                            placeholder={t("DOMAIN_SYNONYMS_PLACEHOLDER")}
                            value={groupString}
                            onChange={(e) => updateGroup(index, e.target.value)}
                            helperText={t("DOMAIN_SYNONYMS_HELP")}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => deleteGroup(index)}
                                            edge="end"
                                            size="small"
                                            aria-label={t("DELETE_SYNONYM_GROUP")}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                </Grid>
            ))}

            <Grid item xs={12} sm={12} md={12} style={{ marginTop: "10px" }}>
                <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={addGroup}
                >
                    {t("ADD_SYNONYM_GROUP")}
                </Button>
            </Grid>

            {errors.length > 0 && (
                <Grid item xs={12} sm={12} md={12} style={{ marginTop: "20px" }}>
                    <GridContainerErrors errors={errors} setErrors={setErrors} />
                </Grid>
            )}

            {msgs.length > 0 && (
                <Grid item xs={12} sm={12} md={12} style={{ marginTop: "20px" }}>
                    <GridContainerErrors errors={msgs} setErrors={setMsgs} severity={"info"} />
                </Grid>
            )}

            <Grid item xs={12} sm={12} md={12} style={{ marginTop: "20px" }}>
                <Button variant="contained" color="primary" onClick={save}>
                    {t("SAVE")}
                </Button>
            </Grid>
        </Grid>
    );
};

export default SettingsDomainSynonymsView;
