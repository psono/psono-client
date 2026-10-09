import { Grid } from "@mui/material";
import type { GridProps } from "@mui/material/Grid";
import type { AlertColor } from "@mui/material/Alert";
import MuiAlert from "@mui/material/Alert";
import PropTypes from "prop-types";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type GridContainerErrorsProps = GridProps & {
	errors: string[];
	setErrors: (errors: string[]) => void;
	severity?: AlertColor;
};

const GridContainerErrors = (props: GridContainerErrorsProps) => {
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
	severity: "error" as const,
};

GridContainerErrors.propTypes = {
	errors: PropTypes.array.isRequired,
	setErrors: PropTypes.func.isRequired,
	severity: PropTypes.string,
};

export default GridContainerErrors;
