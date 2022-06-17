import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@material-ui/core/Button";
import { Grid } from "@material-ui/core";
import Divider from "@material-ui/core/Divider";

import PasswordRecoveryCodesDialog from "./password-recovery-codes-dialog";
import DialogVerify from "../../components/dialogs/verify";

const AccountPasswordRecoveryCodesView = (props) => {
    const { t } = useTranslation();
    const [openPasswordRecoveryDialog, setOpenPasswordRecoveryDialog] = useState(false);
    const [warnGenerateNewPasswordRecoveryCodesOpen, setWarnGenerateNewPasswordRecoveryCodesOpen] = useState(false);

    const closeModal = () => {
        setOpenPasswordRecoveryDialog(false);
    };

    const onConfigurePasswordRecoveryCodes = (event) => {
        setWarnGenerateNewPasswordRecoveryCodesOpen(true);
    };

    const generateConfirmed = () => {
        setWarnGenerateNewPasswordRecoveryCodesOpen(false);
        setOpenPasswordRecoveryDialog(true);
    };

    return (
        <>
            <Grid container>
                <Grid item xs={12} sm={12} md={12}>
                    <h2>{t("GENERATE_PASSWORD_RECOVERY")}</h2>
                    <p>{t("GENERATE_PASSWORD_RECOVERY_DESCRIPTION")}</p>
                    <Divider style={{ marginBottom: "20px" }} />
                </Grid>
            </Grid>
            <Grid container style={{ marginBottom: "8px" }}>
                <Grid item xs={6} sm={6} md={4} style={{ paddingTop: "8px" }}>
                    {t("NEW_PASSWORD_RECOVERY_CODE")}
                </Grid>
                <Grid item xs={6} sm={6} md={8}>
                    <Button variant="contained" color="primary" onClick={onConfigurePasswordRecoveryCodes}>
                        {t("GENERATE")}
                    </Button>
                </Grid>
                {openPasswordRecoveryDialog && (
                    <PasswordRecoveryCodesDialog {...props} open={openPasswordRecoveryDialog} onClose={closeModal} />
                )}
                {warnGenerateNewPasswordRecoveryCodesOpen && (
                    <DialogVerify
                        title={"NEW_PASSWORD_RECOVERY_CODE"}
                        description={"NEW_PASSWORD_RECOVERY_CODE_WARNING"}
                        open={warnGenerateNewPasswordRecoveryCodesOpen}
                        onClose={() => setWarnGenerateNewPasswordRecoveryCodesOpen(false)}
                        onConfirm={generateConfirmed}
                    />
                )}
            </Grid>
        </>
    );
};

export default AccountPasswordRecoveryCodesView;
