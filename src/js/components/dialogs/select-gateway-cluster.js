import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const DialogSelectGatewayCluster = ({
	clusters,
	loading,
	onClose,
	onSelect,
	open,
}) => {
	const { t } = useTranslation();
	const [clusterId, setClusterId] = useState("");
	const [remember, setRemember] = useState(false);

	useEffect(() => {
		if (open) {
			setClusterId(clusters[0]?.id || "");
			setRemember(false);
		}
	}, [clusters, open]);

	return (
		<Dialog
			open={open}
			onClose={loading ? undefined : onClose}
			fullWidth
			maxWidth="xs"
		>
			<DialogTitle>{t("SELECT_GATEWAY")}</DialogTitle>
			<DialogContent>
				<FormControl fullWidth margin="normal" size="small">
					<InputLabel id="gateway-cluster-label">{t("GATEWAY")}</InputLabel>
					<Select
						labelId="gateway-cluster-label"
						label={t("GATEWAY")}
						value={clusterId}
						onChange={(event) => setClusterId(event.target.value)}
					>
						{clusters.map((cluster) => (
							<MenuItem key={cluster.id} value={cluster.id}>
								{cluster.title}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControlLabel
					control={
						<Checkbox
							checked={remember}
							onChange={(event) => setRemember(event.target.checked)}
						/>
					}
					label={t("REMEMBER_GATEWAY_FOR_CONNECTION")}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={loading}>
					{t("CANCEL")}
				</Button>
				<Button
					onClick={() => onSelect(clusterId, remember)}
					disabled={!clusterId || loading}
					variant="contained"
					color="primary"
				>
					{t("LAUNCH")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

DialogSelectGatewayCluster.propTypes = {
	clusters: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			title: PropTypes.string.isRequired,
		}),
	).isRequired,
	loading: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	onSelect: PropTypes.func.isRequired,
	open: PropTypes.bool.isRequired,
};

export default DialogSelectGatewayCluster;
