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
import type { GatewayCluster } from "../../types/api";
import type { Datastore } from "../../types/datastore";
import type { SecretReference } from "../../types/vault";

export interface GatewayLaunchButtonProps {
	className?: string;
	item: Datastore;
	offline?: boolean | null;
	showLabel?: boolean;
}

const GatewayLaunchButton = ({
	className,
	item,
	offline,
	showLabel,
}: GatewayLaunchButtonProps) => {
	const { t } = useTranslation();
	const [clusters, setClusters] = useState<GatewayCluster[]>([]);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const hidden =
		!hostService.supportsGateway() ||
		offline ||
		offlineCache.isActive() ||
		!item.secret_id ||
		!item.secret_key ||
		!["ssh_connection", "rdp_connection", "vnc_connection"].includes(
			item.type!,
		) ||
		item.share_rights?.read === false;

	if (hidden) {
		return null;
	}

	const showError = (error: unknown) => {
		const failure = error as
			| { code?: string; non_field_errors?: string[] }
			| null
			| undefined;
		const code = failure?.code || failure?.non_field_errors?.[0];
		notification.errorSend(t(code || "GATEWAY_LAUNCH_FAILED"));
	};

	const onLaunch = async (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setLoading(true);
		try {
			// The visibility check above requires a complete connection reference.
			const result = await gatewayService.prepareLaunch(
				item as Datastore & SecretReference,
			);
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

	const onSelect = async (clusterId: string, remember: boolean) => {
		setLoading(true);
		try {
			await gatewayService.launchSelected(
				item as Datastore & SecretReference,
				clusterId,
				remember,
			);
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
