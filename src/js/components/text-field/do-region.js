import * as React from "react";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const TextFieldDoRegion = (props) => {
    const { error, helperText, onChange, ...rest } = props;
    const { t } = useTranslation();
    const [doRegion, setDoRegion] = useState("");

    const doSpacesRegions = ["ams3", "fra1", "nyc3", "sfo2", "sgp1"];

    const localError = doRegion && !doSpacesRegions.includes(doRegion);
    const localHelperText = localError ? t("REGION_IS_INVALID") : null;

    return (
        <TextField
            {...rest}
            helperText={localHelperText || helperText}
            error={localError || error}
            onChange={(event) => {
                setDoRegion(event.target.value);
                onChange(event);
            }}
        />
    );
};

export default TextFieldDoRegion;
