import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Button from "@mui/material/Button";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import gatewayService from "../services/gateway";
import hostService from "../services/host";
import notification from "../services/notification";
import offlineCache from "../services/offline-cache";
import DialogSelectGatewayCluster from "./dialogs/select-gateway-cluster";

const GatewayLaunchButton = ({ className, item, offline, showLabel }) => {
	const { t } = useTranslation();
	const [clusters, setClusters] = useState([]);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const hidden =
		!hostService.supportsGateway() ||
		offline ||
		offlineCache.isActive() ||
		!item.secret_id ||
		!item.secret_key ||
		!["ssh_connection", "rdp_connection", "vnc_connection"].includes(
			item.type,
		) ||
		item.share_rights?.read === false;

	if (hidden) {
		return null;
	}

	const showError = (error) => {
		const code = error?.code || error?.non_field_errors?.[0];
		notification.errorSend(t(code || "GATEWAY_LAUNCH_FAILED"));
	};

	const onLaunch = async (event) => {
		event.preventDefault();
		event.stopPropagation();
		setLoading(true);
		try {
			const result = await gatewayService.prepareLaunch(item);
			if (!result.launched) {
				setClusters(result.clusters);
				setDialogOpen(true);
			}
		} catch (error) {
			showError(error);
		} finally {
			setLoading(false);
		}
	};

	const onSelect = async (clusterId, remember) => {
		setLoading(true);
		try {
			await gatewayService.launchSelected(item, clusterId, remember);
			setDialogOpen(false);
		} catch (error) {
			showError(error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Button
				aria-label={t("LAUNCH_WITH_GATEWAY")}
				className={className}
				disabled={loading}
				onClick={onLaunch}
				startIcon={showLabel ? <OpenInNewIcon fontSize="small" /> : undefined}
			>
				{showLabel ? t("LAUNCH") : <OpenInNewIcon fontSize="small" />}
			</Button>
			<DialogSelectGatewayCluster
				clusters={clusters}
				loading={loading}
				onClose={() => setDialogOpen(false)}
				onSelect={onSelect}
				open={dialogOpen}
			/>
		</>
	);
};

GatewayLaunchButton.defaultProps = {
	className: undefined,
	offline: false,
	showLabel: false,
};

GatewayLaunchButton.propTypes = {
	className: PropTypes.string,
	item: PropTypes.object.isRequired,
	offline: PropTypes.bool,
	showLabel: PropTypes.bool,
};

export default GatewayLaunchButton;
