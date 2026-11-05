import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import groupsService from "../../services/groups";
import itemBlueprintService from "../../services/item-blueprint";

interface PendingSharesTooltipProps {
	groupId: string;
	outstandingShares: Record<string, unknown>;
	children: React.ReactElement;
}

const PendingSharesTooltip = ({
	groupId,
	outstandingShares,
	children,
}: PendingSharesTooltipProps) => {
	const { t } = useTranslation();
	const [hasOpened, setHasOpened] = useState(false);
	const [shares, setShares] = useState<
		{ id: string; title: string; type: string | null }[] | null
	>(null);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		if (!hasOpened) return;
		let isSubscribed = true;
		setShares(null);
		setFailed(false);

		const loadShares = async () => {
			try {
				// The outstanding-share index identifies pending shares; the group
				// details provide their encrypted titles and nonces.
				const group = await groupsService.readGroup(groupId);
				if (!isSubscribed) return;
				if (!group) {
					setFailed(true);
					return;
				}
				setShares(
					group.group_share_rights
						.filter((share) => Object.hasOwn(outstandingShares, share.share_id))
						.map((share) => ({
							id: share.share_id,
							title:
								share.title && share.title_nonce
									? groupsService.decryptSecretKey(
											groupId,
											share.title,
											share.title_nonce,
										)
									: share.share_id,
							type:
								share.type && share.type_nonce
									? groupsService.decryptSecretKey(
											groupId,
											share.type,
											share.type_nonce,
										)
									: null,
						})),
				);
			} catch {
				if (isSubscribed) setFailed(true);
			}
		};
		loadShares();

		return () => {
			isSubscribed = false;
		};
	}, [groupId, outstandingShares, hasOpened]);

	const getShareTypeLabel = (type: string | null) => {
		if (type === "folder") return t("FOLDER");
		const blueprint = itemBlueprintService
			.getEntryTypes()
			.find((entry) => entry.value === type);
		return t(blueprint?.title || "UNKNOWN_TYPE");
	};

	return (
		<Tooltip
			describeChild
			onOpen={() => setHasOpened(true)}
			title={
				failed ? (
					t("UNKNOWN_ERROR")
				) : shares === null ? (
					t("LOADING")
				) : (
					<Box
						component="ul"
						sx={{
							margin: 0,
							paddingLeft: 2,
							maxHeight: "300px",
							overflowY: "auto",
							overflowWrap: "anywhere",
						}}
					>
						{shares.map((share) => (
							<li key={share.id}>
								{share.title} ({getShareTypeLabel(share.type)})
							</li>
						))}
					</Box>
				)
			}
		>
			{children}
		</Tooltip>
	);
};

export default PendingSharesTooltip;
