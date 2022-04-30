import * as React from "react";
import TextField from "@material-ui/core/TextField";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const TextFieldAWSRegion = (props) => {
    const { error, helperText, onChange, ...rest } = props;
    const { t } = useTranslation();
    const [awsS3Region, setAwsS3Region] = useState("");

    const awsRegions = [
        "us-east-1", // USA Ost (Nord-Virginia)
        "us-east-2", // USA Ost (Ohio)
        "us-west-1", // USA West (Nordkalifornien)
        "us-west-2", // USA West (Oregon)
        "ap-south-1", // Asien-Pazifik (Mumbai)
        "ap-northeast-1", // Asien-Pazifik (Tokio)
        "ap-northeast-2", // Asien-Pazifik (Seoul
        "ap-northeast-3", // Asien-Pazifik (Osaka-Lokal)
        "ap-southeast-1", // Asien-Pazifik (Singapur)
        "ap-southeast-2", // Asien-Pazifik (Sydney)
        "ca-central-1", // Kanada (Zentral)
        "cn-north-1", // China (Peking)
        "cn-northwest-1", // China (Ningxia)
        "eu-central-1", // EU (Frankfurt)
        "eu-west-1", // EU (Irland)
        "eu-west-2", // EU (London)
        "eu-west-3", // EU (Paris)
        "eu-north-1", // EU (Stockholm)
        "sa-east-1", // Südamerika (Sao Paulo)
        "us-gov-east-1", // AWS GovCloud (USA Ost)
        "us-gov-west-1", // AWS GovCloud (USA)
    ];

    const localError = awsS3Region && !awsRegions.includes(awsS3Region);
    const localHelperText = localError ? t("REGION_IS_INVALID") : null;

    return (
        <TextField
            {...rest}
            helperText={localHelperText || helperText}
            error={localError || error}
            onChange={(event) => {
                setAwsS3Region(event.target.value);
                onChange(event);
            }}
        />
    );
};

export default TextFieldAWSRegion;
