import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import MuiAlert from "@material-ui/lab/Alert";
import Button from "@material-ui/core/Button";
import { Grid } from "@material-ui/core";

const DialogVerify = (props) => {
    const { open, onClose, onConfirm, entries, affectedEntriesText, title, description } = props;
    const { t } = useTranslation();

    return (
        <Dialog
            fullWidth
            maxWidth={"sm"}
            open={open}
            onClose={onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                }}
                name="verifyDialog"
                autoComplete="off"
            >
                <DialogTitle id="alert-dialog-title">{t(title)}</DialogTitle>
                <DialogContent>
                    <Grid container>
                        {entries.length > 0 && (
                            <Grid item xs={12} sm={12} md={12}>
                                <strong>{t(affectedEntriesText)}</strong>
                            </Grid>
                        )}
                        {entries.length > 0 && (
                            <Grid item xs={12} sm={12} md={12} style={{ marginTop: "10px" }}>
                                <ul>
                                    {entries.map((entry, i) => (
                                        <li key={i}>{t(entry)}</li>
                                    ))}
                                </ul>
                            </Grid>
                        )}
                        <Grid item xs={12} sm={12} md={12}>
                            <MuiAlert
                                severity="warning"
                                style={{
                                    marginBottom: "5px",
                                    marginTop: "5px",
                                }}
                            >
                                {t(description)}
                            </MuiAlert>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>{t("CLOSE")}</Button>
                    <Button onClick={onConfirm} variant="contained" color="primary" type="submit">
                        {t("CONFIRM")}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

DialogVerify.defaultProps = {
    entries: [],
};

DialogVerify.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    affectedEntriesText: PropTypes.string,
    entries: PropTypes.array,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
};

export default DialogVerify;
