import * as React from "react";
import PropTypes from "prop-types";
import { Grid } from "@mui/material";
import MuiAlert from '@mui/material/Alert'
import { useTranslation } from "react-i18next";

const GridContainerErrors = (props) => {
    const { errors, setErrors, severity, ...rest } = props;
    const { t } = useTranslation();

    return (
        <Grid container {...rest}>
            {errors && (
                <Grid item xs={12} sm={12} md={12}>
                    <>
                        {errors.map((error, index) => {
                            return (
                                <MuiAlert
                                    onClose={() => {
                                        setErrors([]);
                                    }}
                                    key={index}
                                    severity={severity}
                                    style={{ marginBottom: "5px" }}
                                >
                                    {t(error)}
                                </MuiAlert>
                            );
                        })}
                    </>
                </Grid>
            )}
        </Grid>
    );
};

GridContainerErrors.defaultProps = {
    severity: "error",
};

GridContainerErrors.propTypes = {
    errors: PropTypes.array.isRequired,
    setErrors: PropTypes.func.isRequired,
    severity: PropTypes.string,
};

export default GridContainerErrors;
