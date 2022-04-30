import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import { Grid } from "@material-ui/core";
import TextField from "@material-ui/core/TextField";

import GridContainerErrors from "../../components/grid-container-errors";
import fileRepository from "../../services/file-repository";
import helperService from "../../services/helper";
import SelectFieldFileRepositoryType from "../../components/select-field/file-repository-type";
import TextFieldAWSRegion from "../../components/text-field/aws-region";
import TextFieldDoRegion from "../../components/text-field/do-region";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
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

const CreateFileRepositoriesDialog = (props) => {
    const { open, onClose, datastoreId } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [title, setTitle] = useState("");
    const [type, setType] = useState("");
    const [gcpCloudStorageBucket, setGcpCloudStorageBucket] = useState("");
    const [gcpCloudStorageJsonKey, setGcpCloudStorageJsonKey] = useState("");
    const [awsS3Bucket, setAwsS3Bucket] = useState("");
    const [awsS3Region, setAwsS3Region] = useState("");
    const [awsS3AccessKeyId, setAwsS3AccessKeyId] = useState("");
    const [awsS3SecretAccessKey, setAwsS3SecretAccessKey] = useState("");
    const [azureBlobStorageAccountName, setAzureBlobStorageAccountName] = useState("");
    const [azureBlobStorageAccountPrimaryKey, setAzureBlobStorageAccountPrimaryKey] = useState("");
    const [azureBlobStorageAccountContainerName, setAzureBlobStorageAccountContainerName] = useState("");
    const [backblazeBucket, setBackblazeBucket] = useState("");
    const [backblazeRegion, setBackblazeRegion] = useState("");
    const [backblazeAccessKeyId, setBackblazeAccessKeyId] = useState("");
    const [backblazeSecretAccessKey, setBackblazeSecretAccessKey] = useState("");
    const [otherS3Bucket, setOtherS3Bucket] = useState("");
    const [otherS3Region, setOtherS3Region] = useState("");
    const [otherS3EndpointUrl, setOtherS3EndpointUrl] = useState("");
    const [otherS3AccessKeyId, setOtherS3AccessKeyId] = useState("");
    const [otherS3SecretAccessKey, setOtherS3SecretAccessKey] = useState("");
    const [doSpace, setDoSpace] = useState("");
    const [doRegion, setDoRegion] = useState("");
    const [doKey, setDoKey] = useState("");
    const [doSecret, setDoSecret] = useState("");
    const [errors, setErrors] = useState([]);

    const awsRegions = fileRepository.getAwsRegions();
    const doSpacesRegions = fileRepository.getDoSpacesRegions();

    const creatDisabled =
        !title ||
        !type ||
        (type === "gcp_cloud_storage" &&
            (!gcpCloudStorageBucket ||
                !gcpCloudStorageJsonKey ||
                !helperService.isValidJson(gcpCloudStorageJsonKey))) ||
        (type === "aws_s3" &&
            (!awsS3Bucket ||
                !awsS3Region ||
                !awsRegions.includes(awsS3Region) ||
                !awsS3AccessKeyId ||
                !awsS3SecretAccessKey)) ||
        (type === "azure_blob" &&
            (!azureBlobStorageAccountName ||
                !azureBlobStorageAccountPrimaryKey ||
                !azureBlobStorageAccountContainerName)) ||
        (type === "backblaze" &&
            (!backblazeRegion || !azureBlobStorageAccountPrimaryKey || !azureBlobStorageAccountContainerName)) ||
        (type === "other_s3" &&
            (!otherS3Bucket ||
                !otherS3Region ||
                !otherS3EndpointUrl ||
                !otherS3AccessKeyId ||
                !otherS3SecretAccessKey)) ||
        (type === "do_spaces" && (!doSpace || !doRegion || !doSpacesRegions.includes(doRegion) || !doKey || !doSecret));

    const create = () => {
        const onError = function (result) {
            // pass
        };

        const onSuccess = function (result) {
            onClose();
        };

        return fileRepository
            .createFileRepository(
                title,
                type,
                gcpCloudStorageBucket || undefined,
                gcpCloudStorageJsonKey || undefined,
                awsS3Bucket || undefined,
                awsS3Region || undefined,
                awsS3AccessKeyId || undefined,
                awsS3SecretAccessKey || undefined,
                azureBlobStorageAccountName || undefined,
                azureBlobStorageAccountPrimaryKey || undefined,
                azureBlobStorageAccountContainerName || undefined,
                backblazeBucket || undefined,
                backblazeRegion || undefined,
                backblazeAccessKeyId || undefined,
                backblazeSecretAccessKey || undefined,
                otherS3Bucket || undefined,
                otherS3Region || undefined,
                otherS3EndpointUrl || undefined,
                otherS3AccessKeyId || undefined,
                otherS3SecretAccessKey || undefined,
                doSpace || undefined,
                doRegion || undefined,
                doKey || undefined,
                doSecret || undefined
            )
            .then(onSuccess, onError);
    };

    return (
        <Dialog
            fullWidth
            maxWidth={"sm"}
            open={open}
            onClose={() => {
                onClose();
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{t("CREATE_NEW_FILE_REPOSITORY")}</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12}>
                        <TextField
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            required
                            id="title"
                            label={t("TITLE")}
                            name="title"
                            autoComplete="title"
                            value={title}
                            onChange={(event) => {
                                setTitle(event.target.value);
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <SelectFieldFileRepositoryType
                            className={classes.textField}
                            variant="outlined"
                            margin="dense"
                            required
                            value={type}
                            onChange={(value) => {
                                setType(value);
                            }}
                        />
                    </Grid>
                    {type === "gcp_cloud_storage" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="gcpCloudStorageBucket"
                                label={t("BUCKET")}
                                name="gcpCloudStorageBucket"
                                autoComplete="gcpCloudStorageBucket"
                                value={gcpCloudStorageBucket}
                                onChange={(event) => {
                                    setGcpCloudStorageBucket(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "gcp_cloud_storage" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="gcpCloudStorageJsonKey"
                                multiline
                                label={t("JSON_KEY")}
                                name="gcpCloudStorageJsonKey"
                                autoComplete="gcpCloudStorageJsonKey"
                                value={gcpCloudStorageJsonKey}
                                onChange={(event) => {
                                    setGcpCloudStorageJsonKey(event.target.value);
                                }}
                            />
                        </Grid>
                    )}

                    {type === "aws_s3" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="awsS3Bucket"
                                label={t("BUCKET")}
                                name="awsS3Bucket"
                                autoComplete="awsS3Bucket"
                                value={awsS3Bucket}
                                onChange={(event) => {
                                    setAwsS3Bucket(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "aws_s3" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextFieldAWSRegion
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="awsS3Region"
                                label={t("REGION")}
                                name="awsS3Region"
                                autoComplete="awsS3Region"
                                value={awsS3Region}
                                onChange={(event) => {
                                    setAwsS3Region(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "aws_s3" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="awsS3AccessKeyId"
                                label={t("ACCESS_KEY_ID")}
                                name="awsS3AccessKeyId"
                                autoComplete="awsS3AccessKeyId"
                                value={awsS3AccessKeyId}
                                onChange={(event) => {
                                    setAwsS3AccessKeyId(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "aws_s3" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="awsS3SecretAccessKey"
                                label={t("SECRET_ACCESS_KEY")}
                                name="awsS3SecretAccessKey"
                                autoComplete="awsS3SecretAccessKey"
                                value={awsS3SecretAccessKey}
                                onChange={(event) => {
                                    setAwsS3SecretAccessKey(event.target.value);
                                }}
                            />
                        </Grid>
                    )}

                    {type === "azure_blob" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="azureBlobStorageAccountName"
                                label={t("ACCOUNT_NAME")}
                                name="azureBlobStorageAccountName"
                                autoComplete="azureBlobStorageAccountName"
                                value={azureBlobStorageAccountName}
                                onChange={(event) => {
                                    setAzureBlobStorageAccountName(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "azure_blob" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="azureBlobStorageAccountPrimaryKey"
                                label={t("PRIMARY_KEY")}
                                name="azureBlobStorageAccountPrimaryKey"
                                autoComplete="azureBlobStorageAccountPrimaryKey"
                                value={azureBlobStorageAccountPrimaryKey}
                                onChange={(event) => {
                                    setAzureBlobStorageAccountPrimaryKey(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "azure_blob" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="azureBlobStorageAccountContainerName"
                                label={t("CONTAINER_NAME")}
                                name="azureBlobStorageAccountContainerName"
                                autoComplete="azureBlobStorageAccountContainerName"
                                value={azureBlobStorageAccountContainerName}
                                onChange={(event) => {
                                    setAzureBlobStorageAccountContainerName(event.target.value);
                                }}
                            />
                        </Grid>
                    )}

                    {type === "backblaze" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="backblazeBucket"
                                label={t("BUCKET")}
                                name="backblazeBucket"
                                autoComplete="backblazeBucket"
                                value={backblazeBucket}
                                onChange={(event) => {
                                    setBackblazeBucket(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "backblaze" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="backblazeRegion"
                                label={t("REGION")}
                                name="backblazeRegion"
                                autoComplete="backblazeRegion"
                                value={backblazeRegion}
                                onChange={(event) => {
                                    setBackblazeRegion(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "backblaze" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="backblazeAccessKeyId"
                                label={t("ACCESS_KEY_ID")}
                                name="backblazeAccessKeyId"
                                autoComplete="backblazeAccessKeyId"
                                value={backblazeAccessKeyId}
                                onChange={(event) => {
                                    setBackblazeAccessKeyId(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "backblaze" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="backblazeSecretAccessKey"
                                label={t("SECRET_ACCESS_KEY")}
                                name="backblazeSecretAccessKey"
                                autoComplete="backblazeSecretAccessKey"
                                value={backblazeSecretAccessKey}
                                onChange={(event) => {
                                    setBackblazeSecretAccessKey(event.target.value);
                                }}
                            />
                        </Grid>
                    )}

                    {type === "other_s3" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="otherS3Bucket"
                                label={t("BUCKET")}
                                name="otherS3Bucket"
                                autoComplete="otherS3Bucket"
                                value={otherS3Bucket}
                                onChange={(event) => {
                                    setOtherS3Bucket(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "otherS3" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="otherS3Region"
                                label={t("REGION")}
                                name="otherS3Region"
                                autoComplete="otherS3Region"
                                value={otherS3Region}
                                onChange={(event) => {
                                    setOtherS3Region(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "otherS3" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="otherS3EndpointUrl"
                                label={t("URL")}
                                name="otherS3EndpointUrl"
                                autoComplete="otherS3EndpointUrl"
                                value={otherS3EndpointUrl}
                                onChange={(event) => {
                                    setOtherS3EndpointUrl(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "otherS3" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="otherS3AccessKeyId"
                                label={t("ACCESS_KEY_ID")}
                                name="otherS3AccessKeyId"
                                autoComplete="otherS3AccessKeyId"
                                value={otherS3AccessKeyId}
                                onChange={(event) => {
                                    setOtherS3AccessKeyId(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "otherS3" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="otherS3SecretAccessKey"
                                label={t("SECRET_ACCESS_KEY")}
                                name="otherS3SecretAccessKey"
                                autoComplete="otherS3SecretAccessKey"
                                value={otherS3SecretAccessKey}
                                onChange={(event) => {
                                    setOtherS3SecretAccessKey(event.target.value);
                                }}
                            />
                        </Grid>
                    )}

                    {type === "do_spaces" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="doSpace"
                                label={t("SPACE")}
                                name="doSpace"
                                autoComplete="doSpace"
                                value={doSpace}
                                onChange={(event) => {
                                    setDoSpace(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "do_spaces" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextFieldDoRegion
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="doRegion"
                                label={t("REGION")}
                                name="doRegion"
                                autoComplete="doRegion"
                                value={doRegion}
                                onChange={(event) => {
                                    setDoRegion(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "do_spaces" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="doKey"
                                label={t("KEY")}
                                name="doKey"
                                autoComplete="doKey"
                                value={doKey}
                                onChange={(event) => {
                                    setDoKey(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                    {type === "do_spaces" && (
                        <Grid item xs={12} sm={12} md={12}>
                            <TextField
                                className={classes.textField}
                                variant="outlined"
                                margin="dense"
                                required
                                id="doSecret"
                                label={t("SECRET")}
                                name="doSecret"
                                autoComplete="doSecret"
                                value={doSecret}
                                onChange={(event) => {
                                    setDoSecret(event.target.value);
                                }}
                            />
                        </Grid>
                    )}
                </Grid>
                <GridContainerErrors errors={errors} setErrors={setErrors} />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        onClose();
                    }}
                >
                    {t("CLOSE")}
                </Button>
                <Button
                    onClick={() => {
                        create();
                    }}
                    variant="contained"
                    color="primary"
                    disabled={creatDisabled}
                >
                    {t("CREATE")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

CreateFileRepositoriesDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default CreateFileRepositoriesDialog;
