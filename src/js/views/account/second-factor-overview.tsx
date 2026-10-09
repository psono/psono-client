import AddIcon from "@mui/icons-material/Add";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	DialogContent,
	Typography,
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import type { FactorRow, IvaltRow } from "../../../types/account-ui";

interface SecondFactorOverviewProps {
	rows: ReadonlyArray<FactorRow | IvaltRow> | null;
	loadError: boolean;
	onCreate: () => void;
	children: React.ReactNode;
}

const SecondFactorOverview = ({
	rows,
	loadError,
	onCreate,
	children,
}: SecondFactorOverviewProps) => {
	const { t } = useTranslation();

	return (
		<DialogContent>
			{loadError ? (
				<Alert severity="error">{t("SECOND_FACTOR_LIST_LOAD_FAILED")}</Alert>
			) : rows === null ? (
				<Box role="status" sx={{ py: 4, textAlign: "center" }}>
					<CircularProgress size={32} aria-label={t("LOADING")} />
				</Box>
			) : rows.some((row) => row[2]) ? (
				children
			) : (
				<Box
					sx={{
						p: 4,
						textAlign: "center",
						border: 1,
						borderColor: "divider",
						borderRadius: 1,
						bgcolor: "action.hover",
					}}
				>
					<SecurityOutlinedIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
					<Typography variant="h6" component="h3" gutterBottom>
						{t("NO_ACTIVE_SECOND_FACTOR_TITLE")}
					</Typography>
					<Typography color="textSecondary" sx={{ mb: 3 }}>
						{t("NO_ACTIVE_SECOND_FACTOR_DESCRIPTION")}
					</Typography>
					<Button
						variant="contained"
						color="primary"
						startIcon={<AddIcon />}
						onClick={onCreate}
						autoFocus
					>
						{t("CREATE")}
					</Button>
				</Box>
			)}
		</DialogContent>
	);
};

export default SecondFactorOverview;
